import IConjuroRepository from '../../../../domain/repositories/IConjuroRepository';
import IDañoRepository from '../../../../domain/repositories/IDañoRepository';
import IEstadoRepository from '../../../../domain/repositories/IEstadoRepository';
import IIdiomaRepository from '../../../../domain/repositories/IIdiomaRepository';
import INpcRepository from '../../../../domain/repositories/INpcRepository';
import { ConjuroApi } from '../../../../domain/types/conjuros.types';
import { CriaturaApi, CriaturaMongo } from '../../../../domain/types/criaturas.types';
import NpcSchema from '../schemas/Npc';

export default class NpcRepository implements INpcRepository {
  constructor(
    private readonly dañoRepository: IDañoRepository,
    private readonly estadoRepository: IEstadoRepository,
    private readonly idiomasRepository: IIdiomaRepository,
    private readonly conjurosRepository: IConjuroRepository,
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
      condition_immunities,
      speaks_languages,
      understands_languages,
      spell_slots
    ] = await Promise.all([
      this.dañoRepository.obtenerDañosPorIndices(npc?.damage_vulnerabilities ?? []),
      this.dañoRepository.obtenerDañosPorIndices(npc?.damage_immunities ?? []),
      this.dañoRepository.obtenerDañosPorIndices(npc?.damage_resistances ?? []),
      this.estadoRepository.obtenerEstadosPorIndices(npc?.condition_immunities ?? []),
      this.idiomasRepository.obtenerIdiomasPorIndices(npc?.languages?.speaks ?? []),
      this.idiomasRepository.obtenerIdiomasPorIndices(npc?.languages?.understands ?? []),
      this.formatearConjurosCriatura(npc?.spell_slots ?? [])
    ])
       
    return {
      id: npc.index,
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
        speaks: speaks_languages,
        understands: understands_languages,
        notes: npc?.languages?.notes
      },
      challenge_rating: npc.challenge_rating,
      xp: npc.xp,
      damage_vulnerabilities,
      damage_immunities,
      damage_resistances,
      condition_immunities,
      special_abilities: npc?.special_abilities ?? [],
      actions: npc.actions,
      actions_aditional: npc.actions_aditional,
      reactions: npc.reactions,
      spell_slots
    }
  }

  private async formatearConjurosCriatura(spell_slots: { [key: string]: string[] }): Promise<{ [key: string]: ConjuroApi[] }> {
    const response: { [key: string]: ConjuroApi[] } = {}

    await Promise.all(
      Object.keys(spell_slots).map(async spell_slot => {
        response[spell_slot] = await this.conjurosRepository.obtenerConjurosPorIndices(spell_slots[spell_slot])
      })
    )

    return response
  }
}
