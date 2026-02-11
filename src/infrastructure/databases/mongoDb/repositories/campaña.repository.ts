import ICampañaRepository from '../../../../domain/repositories/ICampañaRepository';
import Campaña from '../schemas/Campaña';
import { CampañaApi, CampañaBasica, CampañaMongo, TypeCrearCampaña, TypeEntradaCampaña, TypeEntradaPersonajeCampaña, TypeModificarLocalizaciones } from '../../../../domain/types/campañas.types';
import IUsuarioRepository from '../../../../domain/repositories/IUsuarioRepository';
import IPersonajeRepository from '../../../../domain/repositories/IPersonajeRepository';

export default class CampañaRepository implements ICampañaRepository {
  constructor(
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly personajeRepository: IPersonajeRepository
  ) { }

  async consultarPorUsuario(id: string): Promise<CampañaBasica[]> {
    const campañas = await Campaña
      .find({
        $or: [
          { master: id },
          { players: id },
          { players_requesting: id }
        ]
      })
      .collation({ locale: 'es', strength: 1 })
      .sort({ name: 1 });

    return await this.formatearCampañasBasicas(campañas, id)
  }
 
  async crear(data: TypeCrearCampaña): Promise<CampañaBasica | null> {
    const campaña = new Campaña({
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

    const resultado = await campaña.save()

    return this.formatearCampañaBasica(resultado, data.master)
  }

  async consultarPorId(idUser: string, idCampaign: string): Promise<CampañaApi | null> {
    const campaña = await Campaña.findById(idCampaign);

    if (campaña?.master === idUser || campaña?.players?.includes(idUser)) {
      return this.formatearCampaña(campaña, idUser)
    } else {
      throw new Error('No perteneces a la campaña');
    }
  }

  async registrarSolicitud(idUser: string, idCampaign: string): Promise<CampañaBasica | null> {
    const campaña = await Campaña.findById(idCampaign);

    if (!campaña) {
      throw new Error('Campaña no encontrada');
    }

    if (campaña.players_requesting.includes(idUser)) {
      throw new Error('El usuario ya ha pedido entrar en la campaña');
    }

    if (campaña.players.includes(idUser)) {
      throw new Error('El usuario ya pertenece a la campaña');
    }

    if (campaña.master === idUser) {
      throw new Error('El usuario ya es el master de la campaña');
    }

    if (campaña.players_requesting.length >= campaña.maxPlayers) {
      throw new Error('La campaña ya tiene el maximo de jugadores');
    }

    campaña.players_requesting.push(idUser)

    const result = await campaña.save()

    return this.formatearCampañaBasica(result, idUser)
  }

  async denegarSolicitud(data: TypeEntradaCampaña): Promise<{ userId: string, campaignId: string } | null> {
    const { masterId, campaignId, userId } = data

    const campaña = await Campaña.findById(campaignId);

    if (!campaña) {
      throw new Error('Campaña no encontrada');
    }

    if (campaña?.master !== masterId) {
      throw new Error('No tienes permisos para aceptar a alguien');
    }

    if (!campaña.players_requesting.includes(userId)) {
      throw new Error('El usuario no ha solicitado entrar en la campaña');
    }

    campaña.players_requesting = campaña.players_requesting.filter(player => player !== userId)

    await campaña.save()

    return {
      userId,
      campaignId
    }
  }

  async aceptarSolicitud(data: TypeEntradaCampaña): Promise<{ userId: string, campaignId: string } | null> {
    const { masterId, campaignId, userId } = data

    const campaña = await Campaña.findById(campaignId);

    if (!campaña) {
      throw new Error('Campaña no encontrada');
    }

    if (campaña?.master !== masterId) {
      throw new Error('No tienes permisos para aceptar a alguien');
    }

    if (!campaña.players_requesting.includes(userId)) {
      throw new Error('El usuario no ha solicitado entrar en la campaña');
    }

    campaña.players_requesting = campaña.players_requesting.filter(player => player !== userId)
    campaña.players.push(userId)

    await campaña.save()

    return {
      userId,
      campaignId
    }
  }

  async añadirPersonaje(data: TypeEntradaPersonajeCampaña): Promise<{ characterId: string } | null> {
    const { userId, campaignId, characterId } = data

    const campaña = await Campaña.findById(campaignId);

    if (!campaña) {
      throw new Error('Campaña no encontrada');
    }

    if (!campaña.players.includes(userId) && campaña.master !== userId) {
      throw new Error('El usuario no pertenece a la campaña');
    }

    const personaje = await this.personajeRepository.entrarCampaña(data)

    if (!personaje) {
      throw new Error('Personaje no encontrado');
    }

    campaña.characters.push(characterId)

    await campaña.save()

    return {
      characterId
    }
  }

  private formatearCampañasBasicas(campañas: CampañaMongo[], master: string): Promise<CampañaBasica[]> {
    return Promise.all(campañas.map(campaña => this.formatearCampañaBasica(campaña, master)));
  }

  private async formatearCampañaBasica(campaña: CampañaMongo, idUser: string): Promise<CampañaBasica> {
    const userMaster = await this.usuarioRepository.buscarUsuarioPorId(campaña.master)

    return {
      id: campaña._id.toString(),
      name: campaña.name,
      isMember: campaña.players.includes(idUser),
      isMaster: idUser === campaña.master,
      players: campaña.players.length,
      status: campaña.status,
      master: userMaster?.name ?? campaña.master,
      system: campaña.system,
      initialLevel: campaña.initialLevel,
      maxPlayers: campaña.maxPlayers,
      language: campaña.language
    }
  }

  private async formatearCampaña(campaña: CampañaMongo, idUser: string): Promise<CampañaApi> {
    const isMaster = idUser === campaña.master
    const master = await this.usuarioRepository.buscarUsuarioPorId(campaña.master)

    const players_requesting = isMaster ? await this.usuarioRepository.consultarUsuarios(campaña?.players_requesting ?? []) : []
    const players = await this.usuarioRepository.consultarUsuarios(campaña?.players ?? [])
    const characters = await this.personajeRepository.consultarPorIds(campaña?.characters ?? [])

    return {
      id: campaña._id.toString(),
      name: campaña.name,
      description: campaña?.description,
      isMaster,
      players_requesting,
      players,
      characters,
      master: master?.name ?? campaña.master,
      status: campaña.status,
      system: campaña.system,
      initialLevel: campaña.initialLevel,
      maxPlayers: campaña.maxPlayers,
      language: campaña.language,
      locations: campaña.locations,
      initialMapId: campaña.initialMapId
    }
  }

  async modificarLocalizaciones(data: TypeModificarLocalizaciones): Promise<boolean> {
    const { campaignId, locations, initialMapId, userId } = data;

    const campaña = await Campaña.findById(campaignId);

    if (!campaña) {
      throw new Error('Campaña no encontrada');
    }

    if (campaña?.master !== userId) {
      throw new Error('No tienes permisos para modificar las localizaciones');
    }

    const resultado = await Campaña.findByIdAndUpdate(
      campaignId,
      { 
        $set: { 
          locations: locations,
          initialMapId: initialMapId
        } 
      },
      { new: true }
    );

    return !!resultado;
  }
}
