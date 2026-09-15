import ICampaignRepository from '../../../../domain/repositories/ICampaignRepository';
import Campaign from '../schemas/Campaign';
import { CampaignApi, CampaignBasic, CampaignMongo, CreateCampaignInput, CampaignJoinInput } from '../../../../domain/types/campaign.types';
import IUserRepository from '../../../../domain/repositories/IUserRepository';
import IPersonajeRepository from '../../../../domain/repositories/IPersonajeRepository';
import ISystemRepository from '../../../../domain/repositories/ISystemRepository';
import { System, SystemBasic } from '../../../../domain/types/system.types';

export default class CampaignRepository implements ICampaignRepository {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly personajeRepository: IPersonajeRepository,
    private readonly systemRepository: ISystemRepository
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

    const systemIds = [...new Set(campaigns.map(campaign => campaign.system).filter(Boolean))];
    const systems = await this.systemRepository.getByIds(systemIds);
    const systemMap = this.toSystemMap(systems);

    return campaigns.map(campaign =>
      this.toCampaignBasic(
        campaign,
        id,
        masterNames.get(campaign.master) ?? campaign.master,
        this.toSystemBasic(systemMap.get(campaign.system), campaign.system)
      )
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
      language: data.language
    })

    const result = await campaign.save()
    const [userMaster, system] = await Promise.all([
      this.userRepository.getUserById(data.master),
      this.getSystemBasic(data.system)
    ]);

    return this.toCampaignBasic(result, data.master, userMaster?.name ?? data.master, system)
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

    const [userMaster, system] = await Promise.all([
      this.userRepository.getUserById(result.master),
      this.getSystemBasic(result.system)
    ]);

    return this.toCampaignBasic(result, userId, userMaster?.name ?? result.master, system);
  }

  async denyJoinRequest(data: CampaignJoinInput): Promise<{ userId: string, campaignId: string } | null> {
    const { campaignId, userId } = data;

    const result = await Campaign.findOneAndUpdate(
      {
        _id: campaignId as any,
        $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }]
      },
      { $pull: { players_requesting: userId } },
      { returnDocument: "after" }
    );

    if (!result) {
      return null;
    }

    return {
      userId,
      campaignId
    };
  }

  async acceptJoinRequest(data: CampaignJoinInput): Promise<{ userId: string, campaignId: string } | null> {
    const { campaignId, userId } = data;

    const result = await Campaign.findOneAndUpdate(
      {
        _id: campaignId as any,
        $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }]
      },
      {
        $pull: { players_requesting: userId },
        $addToSet: { players: userId }
      },
      { returnDocument: "after" }
    );

    if (!result) {
      return null;
    }

    return {
      userId,
      campaignId
    };
  }

  async addCharacter(campaignId: string, characterId: string): Promise<{ characterId: string } | null> {
    const result = await Campaign.findOneAndUpdate(
      {
        _id: campaignId as any,
        $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }]
      },
      { $addToSet: { characters: characterId } },
      { returnDocument: "after" }
    );

    if (!result) {
      return null;
    }

    return {
      characterId
    };
  }

  private toStringArray(value: unknown): string[] {
    return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
  }

  private toSystemMap(systems: System[]): Map<string, System> {
    const systemMap = new Map<string, System>();

    for (const system of systems) {
      systemMap.set(system._id.toString(), system);
      if (system.name) {
        systemMap.set(system.name, system);
      }
    }

    return systemMap;
  }

  private toSystemBasic(system: System | undefined, fallbackId: string): SystemBasic {
    if (!system) {
      return { id: fallbackId, name: fallbackId, description: "" };
    }

    return {
      id: system._id.toString(),
      name: system.name,
      description: system.description ?? ""
    };
  }

  private async getSystemBasic(systemId: string): Promise<SystemBasic> {
    const systems = await this.systemRepository.getByIds([systemId]);
    return this.toSystemBasic(this.toSystemMap(systems).get(systemId), systemId);
  }

  private toCampaignBasic(campaign: CampaignMongo, idUser: string, masterName: string, system: SystemBasic): CampaignBasic {
    const players = this.toStringArray(campaign.players);

    return {
      id: campaign._id.toString(),
      name: campaign.name,
      isMember: players.includes(idUser),
      isMaster: idUser === campaign.master,
      players: players.length,
      status: campaign.status,
      master: masterName,
      system,
      initialLevel: campaign.initialLevel,
      maxPlayers: campaign.maxPlayers,
      language: campaign.language
    }
  }

  private async toCampaignApi(campaign: CampaignMongo, idUser: string): Promise<CampaignApi> {
    const isMaster = idUser === campaign.master
    const [master, players_requesting, players, characters, system] = await Promise.all([
      this.userRepository.getUserById(campaign.master),
      isMaster ? this.userRepository.getUsers(campaign?.players_requesting ?? []) : Promise.resolve([]),
      this.userRepository.getUsers(campaign?.players ?? []),
      this.personajeRepository.getByIds(campaign?.characters ?? []),
      this.getSystemBasic(campaign.system)
    ]);

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
      system,
      initialLevel: campaign.initialLevel,
      maxPlayers: campaign.maxPlayers,
      language: campaign.language
    }
  }
}
