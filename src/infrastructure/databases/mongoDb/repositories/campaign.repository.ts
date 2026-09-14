import ICampaignRepository from '../../../../domain/repositories/ICampaignRepository';
import Campaign from '../schemas/Campaign';
import { CampaignApi, CampaignBasic, CampaignMongo, CreateCampaignInput, CampaignJoinInput, AddCharacterToCampaignInput, UpdateCampaignLocationsInput } from '../../../../domain/types/campaign.types';
import IUserRepository from '../../../../domain/repositories/IUserRepository';
import IPersonajeRepository from '../../../../domain/repositories/IPersonajeRepository';

export default class CampaignRepository implements ICampaignRepository {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly personajeRepository: IPersonajeRepository
  ) { }

  async getByUser(id: string): Promise<CampaignBasic[]> {
    const campaigns = await Campaign
      .find({
        $and: [
          { $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }] },
          {
            $or: [
              { master: id },
              { players: id },
              { players_requesting: id }
            ]
          }
        ]
      })
      .collation({ locale: 'es', strength: 1 })
      .sort({ name: 1 })
      .lean<CampaignMongo[]>();

    const masterIds = [...new Set(campaigns.map(campaign => campaign.master).filter(Boolean))];
    const masters = await this.userRepository.getUsers(masterIds);
    const masterNames = new Map(masters.map(master => [master.id, master.name]));

    return campaigns.map(campaign =>
      this.toCampaignBasic(campaign, id, masterNames.get(campaign.master) ?? campaign.master)
    );
  }

  async create(data: CreateCampaignInput): Promise<CampaignBasic | null> {
    const campaign = new Campaign({
      name: data.name,
      description: data.description,
      master: data.master,
      status: 'Activa',
      players_requesting: [],
      players: [],
      characters: [],
      system: data.system,
      initialLevel: data.initialLevel,
      maxPlayers: data.maxPlayers,
      language: data.language,
      locations: []
    })

    const result = await campaign.save()
    const userMaster = await this.userRepository.getUserById(data.master)

    return this.toCampaignBasic(result, data.master, userMaster?.name ?? data.master)
  }

  async findActiveById(id: string): Promise<CampaignMongo | null> {
    const campaign = await Campaign
      .findOne({
        _id: id as any,
        $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }]
      })
      .lean<CampaignMongo | null>();

    return campaign;
  }

  async getDetail(userId: string, campaign: CampaignMongo): Promise<CampaignApi> {
    return this.toCampaignApi(campaign, userId);
  }

  async registerJoinRequest(userId: string, campaignId: string): Promise<CampaignBasic | null> {
    const result = await Campaign.findByIdAndUpdate(
      campaignId,
      { $addToSet: { players_requesting: userId } },
      { returnDocument: "after" }
    );

    if (!result) {
      return null;
    }

    const userMaster = await this.userRepository.getUserById(result.master);

    return this.toCampaignBasic(result, userId, userMaster?.name ?? result.master);
  }

  async denyJoinRequest(data: CampaignJoinInput): Promise<{ userId: string, campaignId: string } | null> {
    const { masterId, campaignId, userId } = data

    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      throw new Error('Campaña no encontrada');
    }

    if (campaign?.master !== masterId) {
      throw new Error('No tienes permisos para aceptar a alguien');
    }

    if (!campaign.players_requesting.includes(userId)) {
      throw new Error('El usuario no ha solicitado entrar en la campaña');
    }

    campaign.players_requesting = campaign.players_requesting.filter(player => player !== userId)

    await campaign.save()

    return {
      userId,
      campaignId
    }
  }

  async acceptJoinRequest(data: CampaignJoinInput): Promise<{ userId: string, campaignId: string } | null> {
    const { masterId, campaignId, userId } = data

    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      throw new Error('Campaña no encontrada');
    }

    if (campaign?.master !== masterId) {
      throw new Error('No tienes permisos para aceptar a alguien');
    }

    if (!campaign.players_requesting.includes(userId)) {
      throw new Error('El usuario no ha solicitado entrar en la campaña');
    }

    campaign.players_requesting = campaign.players_requesting.filter(player => player !== userId)
    campaign.players.push(userId)

    await campaign.save()

    return {
      userId,
      campaignId
    }
  }

  async addCharacter(data: AddCharacterToCampaignInput): Promise<{ characterId: string } | null> {
    const { userId, campaignId, characterId } = data

    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      throw new Error('Campaña no encontrada');
    }

    if (!campaign.players.includes(userId) && campaign.master !== userId) {
      throw new Error('El usuario no pertenece a la campaña');
    }

    const character = await this.personajeRepository.entrarCampaña(data)

    if (!character) {
      throw new Error('Personaje no encontrado');
    }

    campaign.characters.push(characterId)

    await campaign.save()

    return {
      characterId
    }
  }

  private toStringArray(value: unknown): string[] {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  }

  private toCampaignBasic(campaign: CampaignMongo, idUser: string, masterName: string): CampaignBasic {
    const players = this.toStringArray(campaign.players);

    return {
      id: campaign._id.toString(),
      name: campaign.name,
      isMember: players.includes(idUser),
      isMaster: idUser === campaign.master,
      players: players.length,
      status: campaign.status,
      master: masterName,
      system: campaign.system,
      initialLevel: campaign.initialLevel,
      maxPlayers: campaign.maxPlayers,
      language: campaign.language
    }
  }

  private async toCampaignApi(campaign: CampaignMongo, idUser: string): Promise<CampaignApi> {
    const isMaster = idUser === campaign.master
    const master = await this.userRepository.getUserById(campaign.master)

    const players_requesting = isMaster ? await this.userRepository.getUsers(campaign?.players_requesting ?? []) : []
    const players = await this.userRepository.getUsers(campaign?.players ?? [])
    const characters = await this.personajeRepository.getByIds(campaign?.characters ?? [])

    return {
      id: campaign._id.toString(),
      name: campaign.name,
      description: campaign?.description,
      isMaster,
      players_requesting,
      players,
      characters,
      master: master?.name ?? campaign.master,
      status: campaign.status,
      system: campaign.system,
      initialLevel: campaign.initialLevel,
      maxPlayers: campaign.maxPlayers,
      language: campaign.language,
      locations: campaign.locations,
      initialMapId: campaign.initialMapId
    }
  }

  async updateLocations(data: UpdateCampaignLocationsInput): Promise<boolean> {
    const { campaignId, locations, initialMapId, userId } = data;

    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      throw new Error('Campaña no encontrada');
    }

    if (campaign?.master !== userId) {
      throw new Error('No tienes permisos para modificar las localizaciones');
    }

    const result = await Campaign.findByIdAndUpdate(
      campaignId,
      {
        $set: {
          locations: locations,
          initialMapId: initialMapId
        }
      },
      { returnDocument: 'after' }
    );

    return !!result;
  }
}
