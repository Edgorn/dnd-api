import ICriaturaRepository from '../../../../domain/repositories/ICriaturaRepository';
import IDañoRepository from '../../../../domain/repositories/IDañoRepository';
import IEstadoRepository from '../../../../domain/repositories/IEstadoRepository';
import IIdiomaRepository from '../../../../domain/repositories/IIdiomaRepository';
import { CriaturaApi, CriaturaMongo } from '../../../../domain/types/criaturas.types';
import CriaturaSchema from '../schemas/Criatura';

export default class CriaturaRepository implements ICriaturaRepository {
  constructor(
    private readonly dañoRepository: IDañoRepository,
    private readonly estadoRepository: IEstadoRepository,
    private readonly idiomasRepository: IIdiomaRepository,
  ) { }

  async obtenerTodas(): Promise<CriaturaApi[]> {
    try {
      const criaturas = await CriaturaSchema.find()
        .collation({ locale: 'es', strength: 1 })
        .sort({ name: 1 });
      return this.formatearCriaturas(criaturas);
    } catch (error) {
      console.error("Error obteniendo criaturas:", error);
      throw new Error("No se pudieron obtener los criaturas");
    }
  }

  private formatearCriaturas(criaturas: CriaturaMongo[]): Promise<CriaturaApi[]>  {
    return Promise.all(criaturas.map(criatura => this.formatearCriatura(criatura)));
  } 

  private async formatearCriatura(criatura: CriaturaMongo): Promise<CriaturaApi> {
    const [
      damage_vulnerabilities,
      damage_immunities,
      damage_resistances,
      condition_immunities,
      speaks_languages,
      understands_languages
    ] = await Promise.all([
      this.dañoRepository.obtenerDañosPorIndices(criatura?.damage_vulnerabilities ?? []),
      this.dañoRepository.obtenerDañosPorIndices(criatura?.damage_immunities ?? []),
      this.dañoRepository.obtenerDañosPorIndices(criatura?.damage_resistances ?? []),
      this.estadoRepository.obtenerEstadosPorIndices(criatura?.condition_immunities ?? []),
      this.idiomasRepository.obtenerIdiomasPorIndices(criatura?.languages?.speaks ?? []),
      this.idiomasRepository.obtenerIdiomasPorIndices(criatura?.languages?.understands ?? [])
    ])

    return {
      index: criatura.index,
      name: criatura.name,
      type: criatura.type,
      subtype: criatura.subtype,
      alignment: criatura.alignment,
      size: criatura.size,
      armor_class: criatura.armor_class,
      hit_points: criatura.hit_points,
      hit_dice: criatura.hit_dice,
      speed: criatura.speed,
      abilities: criatura.abilities,
      saving: criatura.saving,
      skills: criatura.skills,
      senses: criatura.senses,
      languages: {
        speaks: speaks_languages,
        understands: understands_languages
      },
      challenge_rating: criatura.challenge_rating,
      xp: criatura.xp,
      damage_vulnerabilities,
      damage_immunities,
      damage_resistances,
      condition_immunities,
      special_abilities: criatura?.special_abilities ?? [],
      actions: criatura.actions,
      reactions: criatura.reactions
    }
  }
}
