
import ICompetenciaRepository from '../../../../domain/repositories/ICompetenciaRepository';
import IConjuroRepository from '../../../../domain/repositories/IConjuroRepository';
import IEquipamientoRepository from '../../../../domain/repositories/IEquipamientoRepository';
import IHabilidadRepository from '../../../../domain/repositories/IHabilidadRepository';
import IIdiomaRepository from '../../../../domain/repositories/IIdiomaRepository';
import ITransfondoRepository from '../../../../domain/repositories/ITransfondoRepository';
import { formatearCompetencias, formatearEquipamiento, formatearOptions } from '../../../../utils/formatters';
import CompetenciaRepository from './competencia.repository';
import ConjuroRepository from './conjuros.repository';
import EquipamientoRepository from './equipamiento.repository';
import HabilidadRepository from './habilidad.repository';
import IdiomaRepository from './idioma.repository';
const TransfondoSchema = require('../schemas/Transfondo');

export default class TransfondoRepository extends ITransfondoRepository {
  idiomaRepository: IIdiomaRepository
  /*rasgoRepository: IRasgoRepository*/
  equipamientoRepository: IEquipamientoRepository
  habilidadRepository: IHabilidadRepository
  competenciaRepository: ICompetenciaRepository
  conjuroRepository: IConjuroRepository

  constructor() {
    super()
    this.habilidadRepository = new HabilidadRepository()
    this.competenciaRepository = new CompetenciaRepository()
    this.idiomaRepository = new IdiomaRepository()
    this.conjuroRepository = new ConjuroRepository()
    this.equipamientoRepository = new EquipamientoRepository()
    /*this.rasgoRepository = new RasgoRepository()*/
  }

  async obtenerTodos() {
    const transfondos = await TransfondoSchema.find();

    return this.formatearTransfondos(transfondos)
  }

  formatearTransfondos(transfondos: any[]): any[] {
    const formateadas = transfondos.map(transfondo => this.formatearTransfondo(transfondo))

    formateadas.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    });

    return formateadas;
  }

  formatearTransfondo(transfondo: any): any {
    console.log(transfondo)
    
    return {
      index: transfondo.index,
      name: transfondo.name,
      img: transfondo.img,
      desc: transfondo.desc,
      proficiencies: formatearCompetencias(transfondo?.starting_proficiencies ?? [], this.habilidadRepository, this.competenciaRepository),
      options: formatearOptions(transfondo?.options ?? [], this.idiomaRepository, this.competenciaRepository, this.habilidadRepository, this.conjuroRepository),
      equipment: formatearEquipamiento(transfondo?.starting_equipment ?? [], this.equipamientoRepository)
    }
  }
}
