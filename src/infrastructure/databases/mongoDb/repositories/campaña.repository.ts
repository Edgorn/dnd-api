import { Types } from 'mongoose';
import ICampañaRepository from '../../../../domain/repositories/ICampañaRepository';
import Campaña from '../schemas/Campaña';
import Usuario from '../schemas/Usuario';

export default class CampañaRepository extends ICampañaRepository {

  constructor() {
    super()
  }

  async crear(data: any): Promise<any> {

    const campaña = new Campaña({
      name: data.name,
      description: data.description,
      master: data.master,
      status: 'Creada',
      players: [],
      characters: [],
      PNJs: []
    })
    
    const resultado = await campaña.save()

    return resultado
  }

  async consultarCampañas(id: any): Promise<any[]> {
    const campañas = await Campaña.find({
      $or: [
        { master: id },
        { players: id }
      ]
    });

    return await this.formatearCampañas(campañas, id)
  }

  async consultarCampaña(idUser: any, id: string | undefined): Promise<any[]> {
    const campaña = await Campaña.findById(id);

    return await this.formatearCampaña(campaña, idUser)
  }

  async entrarCampaña(idUser: any, id: string | undefined): Promise<any> {
    const campaña = await Campaña.findById(id);

    if (!campaña) {
      throw new Error('Campaña no encontrada');
    }

    if (!campaña.players) {
      campaña.players = []; 
    }

    if (campaña.players.includes(idUser)) {
      throw new Error('El usuario ya pertenece a la campaña');
    }

    campaña.players.push(idUser)

    const result = await campaña.save()

    return await this.formatearCampañaBasica(result, idUser)
  }

  async formatearCampañas(campañas: any[], master: number): Promise<any[]> {
    const formateadas = await Promise.all(campañas.map(campaña => this.formatearCampañaBasica(campaña, master)))
    
    return formateadas;
  }

  async formatearCampañaBasica(campaña: any, master: number): Promise<any> {
    const userMaster = await Usuario.find({ index: campaña.master })

    return {
      id: campaña._id.toString(),
      name: campaña.name,
      isMaster: master === campaña.master,
      players: campaña.players.length,
      status: campaña.status,
      master: userMaster[0]?.name ?? campaña.master
    }
  }

  async formatearCampaña(campaña: any, master: number): Promise<any> {
    const userMaster = await Usuario.find({ index: campaña.master })

    return {
      id: campaña._id.toString(),
      name: campaña.name,
      description: campaña?.description,
      isMaster: master === campaña.master,
      players: campaña.players.length,
      status: campaña.status,
      master: userMaster[0]?.name ?? campaña.master
    }
  }
}
