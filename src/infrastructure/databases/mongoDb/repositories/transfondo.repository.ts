
import ICompetenciaRepository from '../../../../domain/repositories/ICompetenciaRepository';
import IConjuroRepository from '../../../../domain/repositories/IConjuroRepository';
import IEquipamientoRepository from '../../../../domain/repositories/IEquipamientoRepository';
import IHabilidadRepository from '../../../../domain/repositories/IHabilidadRepository';
import IIdiomaRepository from '../../../../domain/repositories/IIdiomaRepository';
import IRasgoRepository from '../../../../domain/repositories/IRasgoRepository';
import ITransfondoRepository from '../../../../domain/repositories/ITransfondoRepository';
import { formatearCompetencias, formatearEquipamiento, formatearEquipamientosOptions, formatearOptions } from '../../../../utils/formatters';
import CompetenciaRepository from './competencia.repository';
import ConjuroRepository from './conjuros.repository';
import EquipamientoRepository from './equipamiento.repository';
import HabilidadRepository from './habilidad.repository';
import IdiomaRepository from './idioma.repository';
import RasgoRepository from './rasgo.repository';
const TransfondoSchema = require('../schemas/Transfondo');

export default class TransfondoRepository extends ITransfondoRepository {
  idiomaRepository: IIdiomaRepository
  rasgoRepository: IRasgoRepository
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
    this.rasgoRepository = new RasgoRepository(this.conjuroRepository)
  }

  async obtenerTodos() {
    const transfondos = await TransfondoSchema.find();

    await this.idiomaRepository.init()
    await this.rasgoRepository.init()

    return this.formatearTransfondos(transfondos)
  }
  
  formatearTransfondos(transfondos: any[]): any[] {
    const formateadas = transfondos.map(transfondo => this.formatearTransfondo(transfondo)) 

    formateadas.sort((a: any, b: any) => {
      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
    });

    return formateadas;
  }  

  formatearTransfondo(transfondo: any): any {
    let options_name = {...transfondo.options_name}

    if (options_name) {
      options_name.options = transfondo?.options_name?.options?.map((opt: string) => { return { label: opt, value: opt } })
    }
     
    return {
      index: transfondo.index,
      name: transfondo.name,
      img: transfondo.img,
      desc: transfondo.desc,
      traits: this.rasgoRepository.obtenerRasgosPorIndices(transfondo?.traits ?? []),
      proficiencies: formatearCompetencias(transfondo?.starting_proficiencies ?? [], this.habilidadRepository, this.competenciaRepository),
      options: formatearOptions(transfondo?.options ?? [], this.idiomaRepository, this.competenciaRepository, this.habilidadRepository, this.conjuroRepository),
      equipment: formatearEquipamiento(transfondo?.starting_equipment ?? [], this.equipamientoRepository),
      equipment_options: formatearEquipamientosOptions(transfondo?.starting_equipment_options ?? [], this.equipamientoRepository),
      personalized_equipment: transfondo.personalized_equipment,
      money: transfondo.money,
      options_name,
      personality_traits: transfondo?.personality_traits?.map((opt: string) => { return { label: opt, value: opt } }),
      ideals: transfondo?.ideals?.map((opt: string) => { return { label: opt, value: opt } }),
      bonds: transfondo?.bonds?.map((opt: string) => { return { label: opt, value: opt } }),
      flaws: transfondo?.flaws?.map((opt: string) => { return { label: opt, value: opt } }),
      god: transfondo?.god
    }
  }
}
