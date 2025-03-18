import ICampañaRepository from '../../../../domain/repositories/ICampañaRepository';
import Campaña from '../schemas/Campaña';
import Usuario from '../schemas/Usuario';
import { CampañaBasica } from '../../../../domain/types/campañas';
import IUsuarioRepository from '../../../../domain/repositories/IUsuarioRepository';
import UsuarioRepository from './usuario.repository';
import IPersonajeRepository from '../../../../domain/repositories/IPersonajeRepository';
import PersonajeRepository from './personaje.repository';

export default class CampañaRepository extends ICampañaRepository {
  usuarioRepository: IUsuarioRepository
  personajeRepository: IPersonajeRepository

  constructor() {
    super()
    this.usuarioRepository = new UsuarioRepository()
    this.personajeRepository = new PersonajeRepository()
  }

  async crear(data: any): Promise<CampañaBasica> {
    const campaña = new Campaña({
      name: data.name,
      description: data.description,
      master: data.master,
      status: 'Creada',
      players_requesting: [],
      players: [],
      characters: [],
      PNJs: []
    })
    
    const resultado = await campaña.save()

    return await this.formatearCampañaBasica(resultado, data.master)
  } 

  async consultarCampañas(id: string): Promise<CampañaBasica[]> {
    const campañas = await Campaña.find({
      $or: [
        { master: id },
        { players: id },
        { players_requesting: id }
      ]
    });

    return await this.formatearCampañas(campañas, id)
  }

  async formatearCampañas(campañas: any[], master: string): Promise<CampañaBasica[]> {
    const formateadas = await Promise.all(campañas.map(campaña => this.formatearCampañaBasica(campaña, master)))
    
    return formateadas;
  }

  async formatearCampañaBasica(campaña: any, idUser: string): Promise<CampañaBasica> {
    const userMaster = await Usuario.findById(campaña.master);

    return {
      id: campaña._id.toString(),
      name: campaña.name,
      isMember: campaña.players.includes(idUser),
      isMaster: idUser === campaña.master,
      players: campaña.players.length,
      status: campaña.status,
      master: userMaster?.name ?? campaña.master
    }
  }

  async consultarCampaña(idUser: string, idCampaign: string): Promise<any[]> {
    const campaña = await Campaña.findById(idCampaign);

    if (campaña?.master === idUser || campaña?.players?.includes(idUser)) {
      return await this.formatearCampaña(campaña, idUser)
    } else {
      throw new Error('No perteneces a la campaña');
    }
  }

  async entrarCampaña(idUser: string, idCampaign: string): Promise<any> {
    const campaña = await Campaña.findById(idCampaign);

    if (!campaña) {
      throw new Error('Campaña no encontrada');
    }

    if (!campaña.players_requesting) {
      campaña.players_requesting = []; 
    }

    if (campaña.players_requesting.includes(idUser)) {
      throw new Error('El usuario ya ha pedido entrar en la campaña');
    }

    if (!campaña.players) {
      campaña.players = []; 
    }

    if (campaña.players.includes(idUser)) {
      throw new Error('El usuario ya pertenece a la campaña');
    }

    campaña.players_requesting.push(idUser)

    const result = await campaña.save()

    return await this.formatearCampañaBasica(result, idUser)
  }

  async formatearCampaña(campaña: any, master: string): Promise<any> {
    const userMaster = await Usuario.findById(master)
    const isMaster = master === campaña.master

    const players_requesting = isMaster ? await this.usuarioRepository.consultarUsuarios(campaña?.players_requesting ?? []) : []
    const players = await this.usuarioRepository.consultarUsuarios(campaña?.players ?? [])
    const characters = await this.personajeRepository.consultarPersonajes(campaña?.characters ?? [])

    return {
      id: campaña._id.toString(),
      name: campaña.name,
      description: campaña?.description,
      isMaster: master === campaña.master,
      players_requesting,
      players: players.filter((user: any) => user !== null),
      characters,
      status: campaña.status,
      master: userMaster?.name ?? campaña.master
    }
  }

  async aceptarUsuarioCampaña(idMaster: string, idUser: string, idCampaign: string): Promise<any> {
    const campaña = await Campaña.findById(idCampaign);

    if (!campaña) {
      throw new Error('Campaña no encontrada');
    }

    if (campaña?.master !== idMaster) {
      throw new Error('No tienes permisos para aceptar a alguien');
    }

    if (!campaña.players_requesting) {
      campaña.players_requesting = []; 
    }

    if (!campaña.players_requesting.includes(idUser)) {
      throw new Error('El usuario no ha solicitado entrar en la campaña');
    }

    campaña.players_requesting = campaña.players_requesting.filter(player => player !== idUser)
    campaña.players.push(idUser)

    await campaña.save()
    
    return await this.formatearCampaña(campaña, idMaster); 
  }

  async denegarUsuarioCampaña(idMaster: string, idUser: string, idCampaign: string): Promise<any> {
    const campaña = await Campaña.findById(idCampaign);

    if (!campaña) {
      throw new Error('Campaña no encontrada');
    }

    if (campaña?.master !== idMaster) {
      throw new Error('No tienes permisos para aceptar a alguien');
    }

    if (!campaña.players_requesting) {
      campaña.players_requesting = []; 
    }

    if (!campaña.players_requesting.includes(idUser)) {
      throw new Error('El usuario no ha solicitado entrar en la campaña');
    }

    campaña.players_requesting = campaña.players_requesting.filter(player => player !== idUser)

    await campaña.save()
    
    return await this.formatearCampaña(campaña, idMaster); 
  }

  async entrarPersonajeCampaña(idUser: string, idCharacter: string, idCampaign: string) {
    const campaña = await Campaña.findById(idCampaign);

    if (!campaña) {
      throw new Error('Campaña no encontrada');
    }

    if (!campaña.players.includes(idUser)) {
      throw new Error('El usuario no pertenece a la campaña');
    }

    const personaje = this.personajeRepository.entrarPersonajeCampaña(idUser, idCharacter, idCampaign)

    campaña.characters.push(idCharacter)

    campaña.save()

    return personaje
  }

  async nombreCampaña(idCampaign: string): Promise<string> {
    const campaña = await Campaña.findById(idCampaign);

    return campaña?.name ?? ''
  }
}
