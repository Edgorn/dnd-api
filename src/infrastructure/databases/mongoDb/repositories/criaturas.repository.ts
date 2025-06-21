import ICriaturaRepository from '../../../../domain/repositories/ICriaturaRepository';
import IDañoRepository from '../../../../domain/repositories/IDañoRepository';
import IEstadoRepository from '../../../../domain/repositories/IEstadoRepository';
import DañoRepository from './daño.repository';
import EstadoRepository from './estado.repository';
const CriaturaSchema = require('../schemas/Criatura');

export default class CriaturaRepository extends ICriaturaRepository {
  dañoRepository: IDañoRepository
  estadoRepository: IEstadoRepository
  constructor() {
    super()
    this.dañoRepository = new DañoRepository()
    this.estadoRepository = new EstadoRepository()
  }

  async obtenerTodas() {
    const criaturasMongo: any[] = await CriaturaSchema.find();
    const criaturasFormateadas = await this.formatearCriaturas(criaturasMongo)

    return criaturasFormateadas
  }

  async formatearCriaturas(criaturas: any) {
    const formateadas = await Promise.all(criaturas
      .map((criatura: any) => this.formatearCriatura(criatura)))

    formateadas.sort((a: any, b: any) => {
      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
    });

    return formateadas;
  } 

  async formatearCriatura(criatura: any) {
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
      skills: criatura.skills,
      senses: criatura.senses,
      languages: criatura.languages,
      challenge_rating: criatura.challenge_rating,
      xp: criatura.xp,
      damage_vulnerabilities: this.dañoRepository.obtenerDañosPorIndices(criatura?.damage_vulnerabilities ?? []),
      damage_immunities: this.dañoRepository.obtenerDañosPorIndices(criatura?.damage_immunities ?? []),
      damage_resistances: this.dañoRepository.obtenerDañosPorIndices(criatura?.damage_resistances ?? []),
      condition_immunities: this.estadoRepository.obtenerEstadosPorIndices(criatura?.condition_immunities ?? []),
      special_abilities: criatura?.special_abilities ?? [],
      actions: criatura.actions,
      reactions: criatura.reactions
    }
  }
}
