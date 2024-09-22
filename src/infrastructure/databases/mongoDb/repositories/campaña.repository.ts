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

  async consultar(data: any): Promise<any[]> {
    const campañas = await Campaña.find({ master: data });

    return await this.formatearCampañas(campañas, data)
  }

  async formatearCampañas(campañas: any[], master: number): Promise<any[]> {
    const formateadas = await Promise.all(campañas.map(campaña => this.formatearCampaña(campaña, master)))
    
    return formateadas;
  }

  async formatearCampaña(campaña: any, master: number): Promise<any> {
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
}
