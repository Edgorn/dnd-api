import IDañoRepository from '../../../../domain/repositories/IDañoRepository';
import IEstadoRepository from '../../../../domain/repositories/IEstadoRepository';
import INpcRepository from '../../../../domain/repositories/INpcRepository';
import { CriaturaApi, CriaturaMongo } from '../../../../domain/types/criaturas.types';
import NpcSchema from '../schemas/Npc';

export default class NpcRepository implements INpcRepository {
  constructor(
    private readonly dañoRepository: IDañoRepository,
    private readonly estadoRepository: IEstadoRepository,
  ) { }

  async obtenerTodos(): Promise<CriaturaApi[]> {
    try {
      const npcs = await NpcSchema.find()
        .collation({ locale: 'es', strength: 1 })
        .sort({ name: 1 });
      return this.formatearNpcs(npcs);
    } catch (error) {
      console.error("Error obteniendo npcs:", error);
      throw new Error("No se pudieron obtener los npcs");
    }
  }

  private formatearNpcs(npcs: CriaturaMongo[]): Promise<CriaturaApi[]>  {
    return Promise.all(npcs.map(npc => this.formatearNpc(npc)));
  }

  private async formatearNpc(npc: CriaturaMongo): Promise<CriaturaApi> {
    const [
      damage_vulnerabilities,
      damage_immunities,
      damage_resistances,
      condition_immunities
    ] = await Promise.all([
      this.dañoRepository.obtenerDañosPorIndices(npc?.damage_vulnerabilities ?? []),
      this.dañoRepository.obtenerDañosPorIndices(npc?.damage_immunities ?? []),
      this.dañoRepository.obtenerDañosPorIndices(npc?.damage_resistances ?? []),
      this.estadoRepository.obtenerEstadosPorIndices(npc?.condition_immunities ?? [])
    ])

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
      languages: {
        speaks: [],
        understands: []
      },
      //languages: npc.languages,
      challenge_rating: npc.challenge_rating,
      xp: npc.xp,
      damage_vulnerabilities,
      damage_immunities,
      damage_resistances,
      condition_immunities,
      special_abilities: npc?.special_abilities ?? [],
      actions: npc.actions,
      reactions: npc.reactions
    }
  }
}
