
import ICompetenciaRepository from '../../../../domain/repositories/ICompetenciaRepository';
import IConjuroRepository from '../../../../domain/repositories/IConjuroRepository';
import IEquipamientoRepository from '../../../../domain/repositories/IEquipamientoRepository';
import IHabilidadRepository from '../../../../domain/repositories/IHabilidadRepository';
import IIdiomaRepository from '../../../../domain/repositories/IIdiomaRepository';
import IRasgoRepository from '../../../../domain/repositories/IRasgoRepository';
import ITransfondoRepository from '../../../../domain/repositories/ITransfondoRepository';
import { formatearEquipamiento, formatearEquipamientosOptions, formatearOptions, mapStringArrayToLabelValue } from '../../../../utils/formatters';
import TransfondoSchema from '../schemas/Transfondo';
import { OptionsNameApi, OptionsNameMongo, TransfondoApi, TransfondoMongo, VarianteApi, VarianteMongo } from '../../../../domain/types/transfondos.types';
import { MixedChoicesApi, MixedChoicesMongo } from '../../../../domain/types';

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
      traits_options,
      skills,
      language_choices,
      proficiencies,
      proficiencies_choices,
      variantes
    ] = await Promise.all([
      this.rasgoRepository.obtenerRasgosPorIndices(transfondo?.traits ?? []),
      this.rasgoRepository.obtenerRasgosOptions(transfondo?.traits_options),
      this.habilidadRepository.obtenerHabilidadesPorIndices(transfondo?.skills ?? []),
      this.idiomaRepository.formatearOpcionesDeIdioma(transfondo?.language_choices),
      this.competenciaRepository.obtenerCompetenciasPorIndices(transfondo?.proficiencies ?? []),
      this.competenciaRepository.formatearOpcionesDeCompetencias(transfondo?.proficiencies_choices),
      this.formatearVariantes(transfondo?.variants)
    ])
       
    return {
      index: transfondo.index,
      name: transfondo.name,
      img: transfondo.img,
      desc: transfondo.desc,
      traits,
      traits_options,
      skills,
      language_choices,
      proficiencies,
      proficiencies_choices,
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

    const [traits, traits_options, proficiencies_choices, mixed_choices] = await Promise.all([
      variante?.traits 
        ? this.rasgoRepository.obtenerRasgosPorIndices(variante?.traits ?? [])
        : Promise.resolve(undefined),
      this.rasgoRepository.obtenerRasgosOptions(variante?.traits_options),
      this.competenciaRepository.formatearOpcionesDeCompetencias(variante?.proficiencies_choices),
      this.formatearMixedChoices(variante.mixed_choices)
    ])

    return {
      name: variante.name,
      desc: variante.desc,
      traits,
      traits_options,
      proficiencies_choices,
      mixed_choices,
      personalized_equipment: variante.personalized_equipment,
      equipment: variante?.starting_equipment ? formatearEquipamiento(variante?.starting_equipment ?? [], this.equipamientoRepository) : undefined,
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

  private async formatearMixedChoices(mixedChoices: MixedChoicesMongo[][] | undefined): Promise<MixedChoicesApi[][] | undefined> {
    if (!mixedChoices) return undefined;

    const results = await Promise.all(mixedChoices.map(mixedChoice => this.formatearMixedChoice(mixedChoice)))  
    
    return results.filter((r): r is MixedChoicesApi[] => r !== undefined);
  }

  private async formatearMixedChoice(mixedChoices: MixedChoicesMongo[] | undefined): Promise<MixedChoicesApi[] | undefined> {
    if (!mixedChoices) return undefined;

    const results = await Promise.all(mixedChoices.map(async (mixedChoice) => {
      if (mixedChoice.type === "proficiency") {
        const competencia = await this.competenciaRepository.obtenerCompetenciaPorIndice(mixedChoice.value);
        if (competencia) {
          return {
            type: "proficiency",
            value: competencia
          }
        }
      } else if (mixedChoice.type === "choice") {
        if (mixedChoice.value === "language_choices" && mixedChoice.language_choices) {
          // Resolver idiomas
          const idiomas = await this.idiomaRepository.formatearOpcionesDeIdioma(mixedChoice.language_choices);
          if (idiomas) {
            return {
              type: "choice",
              value: "language_choices",
              language_choices: idiomas
            };
          }
        } else if (mixedChoice.value === "proficiencies_choices" && mixedChoice.proficiencies_choices) {
          // Resolver elección de competencias
          const competenciasChoices = await this.competenciaRepository.formatearOpcionesDeCompetencias(mixedChoice.proficiencies_choices);
          if (competenciasChoices) {
            return {
              type: "choice",
              value: "proficiencies_choices",
              proficiencies_choices: competenciasChoices
            }
          }
        }
      }
      
      return undefined
    }))

    return results.filter((r): r is MixedChoicesApi => r !== undefined);
  }
}