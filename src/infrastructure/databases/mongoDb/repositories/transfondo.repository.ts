
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
import TransfondoSchema from '../schemas/Transfondo';
import { TransfondoApi, TransfondoMongo, VarianteApi, VarianteMongo } from '../../../../domain/types/transfondos';
import IDoteRepository from '../../../../domain/repositories/IDoteRepository';
import DoteRepository from './dote.repository';

export default class TransfondoRepository extends ITransfondoRepository {
  idiomaRepository: IIdiomaRepository
  rasgoRepository: IRasgoRepository
  equipamientoRepository: IEquipamientoRepository
  habilidadRepository: IHabilidadRepository
  competenciaRepository: ICompetenciaRepository
  conjuroRepository: IConjuroRepository
  doteRepository: IDoteRepository

  constructor() {
    super()
    this.habilidadRepository = new HabilidadRepository()
    this.competenciaRepository = new CompetenciaRepository()
    this.idiomaRepository = new IdiomaRepository()
    this.conjuroRepository = new ConjuroRepository()
    this.equipamientoRepository = new EquipamientoRepository()
    this.rasgoRepository = new RasgoRepository()
    this.doteRepository = new DoteRepository()
  }

  async obtenerTodos(): Promise<TransfondoApi[]> {
    const transfondos = await TransfondoSchema.find();

    const transfondosFormateados = await this.formatearTransfondos(transfondos)

    return transfondosFormateados
  }
  
  async formatearTransfondos(transfondos: TransfondoMongo[]): Promise<TransfondoApi[]> {
    const formateadas = await Promise.all(transfondos.map(transfondo => this.formatearTransfondo(transfondo)))

    formateadas.sort((a: any, b: any) => {
      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
    });

    return formateadas;
  }  

  async formatearTransfondo(transfondo: TransfondoMongo): Promise<TransfondoApi>  {
    let options_name = undefined

    if (transfondo.options_name) {
      options_name = {
        name: transfondo?.options_name?.name ?? '',
        choose: transfondo?.options_name?.choose ?? 1,
        options: transfondo?.options_name?.options?.map(opt => { return { label: opt, value: opt } })
      }
    }

    let traits_options = undefined

    if (transfondo?.traits_options) {
      const traitsAux = await this.rasgoRepository.obtenerRasgosPorIndices(transfondo?.traits_options?.options ?? [])
      traits_options = {
        ...transfondo.traits_options,
        options: traitsAux
      }
    }

    const traits = await this.rasgoRepository.obtenerRasgosPorIndices(transfondo?.traits ?? [])
    const options = await formatearOptions(transfondo?.options ?? [], this.idiomaRepository, this.competenciaRepository, this.habilidadRepository, this.conjuroRepository)
    const variantes = await this.formatearVariantes(transfondo?.variants)
    const proficiencies = await formatearCompetencias(transfondo?.starting_proficiencies ?? [], this.habilidadRepository, this.competenciaRepository)

    return {
      index: transfondo.index,
      name: transfondo.name,
      img: transfondo.img,
      desc: transfondo.desc,
      traits,
      traits_options,
      proficiencies,
      options,
      equipment: formatearEquipamiento(transfondo?.starting_equipment ?? [], this.equipamientoRepository),
      equipment_options: formatearEquipamientosOptions(transfondo?.starting_equipment_options ?? [], this.equipamientoRepository),
      personalized_equipment: transfondo.personalized_equipment,
      money: transfondo.money,
      god: transfondo?.god,
      options_name,
      personality_traits: transfondo?.personality_traits?.map(opt => { return { label: opt, value: opt } }),
      ideals: transfondo?.ideals?.map(opt => { return { label: opt, value: opt } }),
      bonds: transfondo?.bonds?.map(opt => { return { label: opt, value: opt } }),
      flaws: transfondo?.flaws?.map(opt => { return { label: opt, value: opt } }),
      variants: variantes
    } 
  }

  async formatearVariantes(variantes: VarianteMongo[]): Promise<VarianteApi[]> {
    const formateadas = await Promise.all(variantes.map(variante => this.formatearVariante(variante)))

    formateadas.sort((a: any, b: any) => {
      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
    });

    return formateadas;
  }

  async formatearVariante(variante: VarianteMongo): Promise<VarianteApi> {
    let traits_options = undefined

    if (variante?.traits_options) {
      const traitsAux = await this.rasgoRepository.obtenerRasgosPorIndices(variante?.traits_options?.options ?? [])
      traits_options = {
        ...variante.traits_options,
        options: traitsAux
      }
    }

    const traits = variante?.traits ? await this.rasgoRepository.obtenerRasgosPorIndices(variante?.traits ?? []) : undefined
    const options = variante?.options ? await formatearOptions(
      variante?.options ?? [], this.idiomaRepository, this.competenciaRepository, this.habilidadRepository, this.conjuroRepository
    ) : undefined

    return {
      name: variante?.name,
      desc: variante?.desc,
      traits,
      traits_options,
      equipment: variante?.starting_equipment ? formatearEquipamiento(variante?.starting_equipment ?? [], this.equipamientoRepository) : undefined,
      personalized_equipment: variante.personalized_equipment,
      options,
      equipment_options: variante?.starting_equipment_options ? formatearEquipamientosOptions(variante?.starting_equipment_options ?? [], this.equipamientoRepository) : undefined,
      options_name: variante?.options_name ? {
        ...variante?.options_name,
        options: variante?.options_name?.options?.map(opt => { return { label: opt, value: opt } })
      } : undefined
    }
  }
}