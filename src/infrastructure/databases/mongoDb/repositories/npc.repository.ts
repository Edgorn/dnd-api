import IDañoRepository from '../../../../domain/repositories/IDañoRepository';
import IEstadoRepository from '../../../../domain/repositories/IEstadoRepository';
import INpcRepository from '../../../../domain/repositories/INpcRepository';
import DañoRepository from './daño.repository';
import EstadoRepository from './estado.repository';
const NpcSchema = require('../schemas/Npc');

export default class NpcRepository extends INpcRepository {
  dañoRepository: IDañoRepository
  estadoRepository: IEstadoRepository
  constructor() {
    super()
    this.dañoRepository = new DañoRepository()
    this.estadoRepository = new EstadoRepository()
  }

  async obtenerTodos() {
    const npcsMongo: any[] = await NpcSchema.find();
    const npcsFormateadas = await this.formatearNpcs(npcsMongo)

    return npcsFormateadas
  }

  async formatearNpcs(npcs: any) {
    const formateadas = await Promise.all(npcs
      .map((npc: any) => this.formatearNpc(npc)))

    formateadas.sort((a: any, b: any) => {
      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
    });

    return formateadas;
  } 

  async formatearNpc(npc: any) {
    return {
      index: npc.index,
      name: npc.name,
      type: npc.type,
      subtype: npc.subtype,
      alignment: npc.alignment,
      size: npc.size,
      armor_class: npc.armor_class,
      hit_points: npc.hit_points,
      hit_dice: npc.hit_dice,
      speed: npc.speed,
      abilities: npc.abilities,
      saving: npc.saving,
      skills: npc.skills,
      senses: npc.senses,
      languages: npc.languages,
      challenge_rating: npc.challenge_rating,
      xp: npc.xp,
      damage_vulnerabilities: this.dañoRepository.obtenerDañosPorIndices(npc?.damage_vulnerabilities ?? []),
      damage_immunities: this.dañoRepository.obtenerDañosPorIndices(npc?.damage_immunities ?? []),
      damage_resistances: this.dañoRepository.obtenerDañosPorIndices(npc?.damage_resistances ?? []),
      condition_immunities: this.estadoRepository.obtenerEstadosPorIndices(npc?.condition_immunities ?? []),
      special_abilities: npc?.special_abilities ?? [],
      actions: npc.actions,
      reactions: npc.reactions
    }
  }
}
