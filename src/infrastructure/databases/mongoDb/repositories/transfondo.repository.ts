
import ICompetenciaRepository from '../../../../domain/repositories/ICompetenciaRepository';
import IConjuroRepository from '../../../../domain/repositories/IConjuroRepository';
import IEquipamientoRepository from '../../../../domain/repositories/IEquipamientoRepository';
import IHabilidadRepository from '../../../../domain/repositories/IHabilidadRepository';
import IIdiomaRepository from '../../../../domain/repositories/IIdiomaRepository';
import IRasgoRepository from '../../../../domain/repositories/IRasgoRepository';
import ITransfondoRepository from '../../../../domain/repositories/ITransfondoRepository';
import { formatearCompetencias, formatearEquipamiento, formatearEquipamientosOptions, formatearOptions, mapStringArrayToLabelValue } from '../../../../utils/formatters';
import TransfondoSchema from '../schemas/Transfondo';
import { OptionsNameApi, OptionsNameMongo, TransfondoApi, TransfondoMongo, VarianteApi, VarianteMongo } from '../../../../domain/types/transfondos.types';

export default class TransfondoRepository implements ITransfondoRepository {
  constructor(
    private readonly habilidadRepository: IHabilidadRepository,
    private readonly competenciaRepository: ICompetenciaRepository,
    private readonly idiomaRepository: IIdiomaRepository,
    private readonly conjuroRepository: IConjuroRepository,
    private readonly equipamientoRepository: IEquipamientoRepository,
    private readonly rasgoRepository: IRasgoRepository) {}

  async obtenerTodos(): Promise<TransfondoApi[]> {
    try {
      const transfondos = await TransfondoSchema.find()
        .collation({ locale: 'es', strength: 1 })
        .sort({ name: 1 });
      return this.formatearTransfondos(transfondos);
    } catch (error) {
      console.error("Error obteniendo transfondos:", error);
      throw new Error("No se pudieron obtener los transfondos");
    }
  }
  
  private formatearTransfondos(transfondos: TransfondoMongo[]): Promise<TransfondoApi[]> {
    return Promise.all(transfondos.map(transfondo => this.formatearTransfondo(transfondo)));
  }  

  private async formatearTransfondo(transfondo: TransfondoMongo): Promise<TransfondoApi>  {
    const options_name = this.formatearOptionsName(transfondo?.options_name)

    const [
      traits,
      options,
      variantes,
      proficiencies,
      traits_options
    ] = await Promise.all([
      this.rasgoRepository.obtenerRasgosPorIndices(transfondo?.traits ?? []),
      formatearOptions(transfondo?.options ?? [], this.idiomaRepository, this.competenciaRepository, this.habilidadRepository, this.conjuroRepository),
      this.formatearVariantes(transfondo?.variants),
      formatearCompetencias(transfondo?.starting_proficiencies ?? [], this.habilidadRepository, this.competenciaRepository),
      this.rasgoRepository.formatearTraitsOptions(transfondo?.traits_options)
    ])

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
      personality_traits: mapStringArrayToLabelValue(transfondo?.personality_traits ?? []),
      ideals: mapStringArrayToLabelValue(transfondo?.ideals ?? []),
      bonds: mapStringArrayToLabelValue(transfondo?.bonds ?? []),
      flaws: mapStringArrayToLabelValue(transfondo?.flaws ?? []),
      variants: variantes
    } 
  }

  private async formatearVariantes(variantes: VarianteMongo[]): Promise<VarianteApi[]> {
    const formateadas = await Promise.all(variantes.map(variante => this.formatearVariante(variante)))

    return formateadas.sort((a, b) =>
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
    );
  }

  private async formatearVariante(variante: VarianteMongo): Promise<VarianteApi> {
    const options_name = this.formatearOptionsName(variante?.options_name)

    const [traits, traits_options, options] = await Promise.all([
      variante?.traits 
        ? this.rasgoRepository.obtenerRasgosPorIndices(variante?.traits ?? [])
        : Promise.resolve(undefined),
      this.rasgoRepository.formatearTraitsOptions(variante?.traits_options),
      variante?.options
        ? formatearOptions(
            variante?.options ?? [],
            this.idiomaRepository,
            this.competenciaRepository,
            this.habilidadRepository,
            this.conjuroRepository
          )
        : Promise.resolve(undefined)
    ])

    return {
      name: variante.name,
      desc: variante.desc,
      traits,
      traits_options,
      equipment: variante?.starting_equipment ? formatearEquipamiento(variante?.starting_equipment ?? [], this.equipamientoRepository) : undefined,
      personalized_equipment: variante.personalized_equipment,
      options,
      equipment_options: variante?.starting_equipment_options ? formatearEquipamientosOptions(variante?.starting_equipment_options ?? [], this.equipamientoRepository) : undefined,
      options_name
    }
  }

  private formatearOptionsName(options_name: OptionsNameMongo | undefined): OptionsNameApi | undefined {
    return options_name ? {
      name: options_name.name ?? '',
      choose: options_name.choose ?? 1,
      options: options_name.options?.map(opt => ({ label: opt, value: opt })) ?? []
    } : undefined;
  }
}