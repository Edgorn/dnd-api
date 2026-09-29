import ISpellRepository from '../../../../domain/repositories/ISpellRepository';
import IDamageRepository from '../../../../domain/repositories/IDamageRepository';
import IConditionRepository from '../../../../domain/repositories/IConditionRepository';
import ILanguageRepository from "../../../../domain/repositories/ILanguageRepository";
import INpcRepository from '../../../../domain/repositories/INpcRepository';
import { SpellApi } from '../../../../domain/types/spell.types';
import { LegacyCreatureApi, LegacyCreatureMongo } from '../../../../domain/types/npc.types';
import NpcSchema from '../schemas/Npc';

export default class NpcRepository implements INpcRepository {
  constructor(
    private readonly damageRepository: IDamageRepository,
    private readonly conditionRepository: IConditionRepository,
    private readonly languageRepository: ILanguageRepository,
    private readonly spellsRepository: ISpellRepository,
  ) { }

  async obtenerTodos(): Promise<LegacyCreatureApi[]> {
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

  private formatearNpcs(npcs: LegacyCreatureMongo[]): Promise<LegacyCreatureApi[]>  {
    return Promise.all(npcs.map(npc => this.formatearNpc(npc)));
  }

  private async formatearNpc(npc: LegacyCreatureMongo): Promise<LegacyCreatureApi> {
    const [
      damage_vulnerabilities,
      damage_immunities,
      damage_resistances,
      condition_immunities,
      speaks_languages,
      understands_languages,
      spell_slots
    ] = await Promise.all([
      this.damageRepository.getByIds(npc?.damage_vulnerabilities ?? []),
      this.damageRepository.getByIds(npc?.damage_immunities ?? []),
      this.damageRepository.getByIds(npc?.damage_resistances ?? []),
      this.conditionRepository.getByIds(npc?.condition_immunities ?? []),
      this.languageRepository.getLanguagesByIndex(npc?.languages?.speaks ?? []),
      this.languageRepository.getLanguagesByIndex(npc?.languages?.understands ?? []),
      this.formatCreatureSpellSlots(npc?.spell_slots ?? [])
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
      actions_legendary: npc.actions_legendary,
      reactions: npc.reactions,
      spell_slots
    }
  }

  private async formatCreatureSpellSlots(spell_slots: { [key: string]: string[] }): Promise<{ [key: string]: SpellApi[] }> {
    const response: { [key: string]: SpellApi[] } = {}

    await Promise.all(
      Object.keys(spell_slots).map(async spell_slot => {
        response[spell_slot] = await this.spellsRepository.getSpellsByIndexes(spell_slots[spell_slot])
      })
    )

    return response
  }
}
