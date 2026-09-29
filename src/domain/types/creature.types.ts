import { ObjectId } from "mongoose";
import { ChoiceApi, ChoiceMongo, Speed } from ".";
import { AttributeApi, CharacterAttributeApi } from "./attribute.types";
import { CreatureTypeApi } from "./creatureType.types";
import { Damage } from "./damage.types";
import { EquipmentInstanceApi, CharacterEquipmentMongo } from "./equipment.types";
import { ConditionApi } from "./condition.types";
import { CreatureLanguages, CreatureLanguagesCreate, LanguageApi } from "./language.types";
import { SkillPersonajeApi } from "./skill.types";
import { RaceRef } from "./race.types";
import { SpellApi } from "./spell.types";

/**
 * Distances on speed, senses, reach and range are stored in feet.
 * Equipment weight, when present, stays in pounds on the equipment catalog.
 */

export const CREATURE_ATTACK_KINDS = ["melee_weapon", "ranged_weapon", "melee_spell", "ranged_spell"] as const;
export type CreatureAttackKind = typeof CREATURE_ATTACK_KINDS[number];

export const CREATURE_USAGE_TYPES = ["atWill", "perDay", "recharge", "perRest"] as const;
export type CreatureUsageType = typeof CREATURE_USAGE_TYPES[number];

/** Stored and accepted in the body when the creature allows any catalog race. */
export const CREATURE_ANY_RACE = "any";

export interface CreatureDamageRoll {
  dice: string;
  bonus?: number;
  damageTypeId: string;
}

export interface CreatureDamageRollApi {
  dice: string;
  bonus?: number;
  damageType: Damage | null;
}

export interface CreatureAttack {
  kind: CreatureAttackKind;
  attributeKey?: string;
  bonus?: number;
  /** Reach in feet. */
  reach?: number;
  /** Range in feet. */
  range?: { normal: number; long?: number };
  targets?: string;
  equipmentId?: string;
  damage: CreatureDamageRoll[];
}

export interface CreatureAttackApi extends Omit<CreatureAttack, "bonus" | "damage"> {
  bonus: number;
  damage: CreatureDamageRollApi[];
}

export interface CreatureUsage {
  type: CreatureUsageType;
  value?: number | string;
}

export interface CreatureFeature {
  name: string;
  description: string[];
  usage?: CreatureUsage;
  attack?: CreatureAttack;
  cost?: number;
}

export interface CreatureFeatureApi extends Omit<CreatureFeature, "attack"> {
  attack?: CreatureAttackApi;
}

export interface CreatureSpellcasting {
  casterLevel?: number;
  /** Attribute id used as the spellcasting ability. */
  abilityId?: string;
  spellSaveDc?: number;
  spellAttackBonus?: number;
  slots: Record<string, number>;
  spells: string[];
}

export interface CreatureSpellcastingApi {
  casterLevel?: number;
  ability?: AttributeApi;
  spellSaveDc?: number;
  spellAttackBonus?: number;
  slots: Record<string, number>;
  spells: SpellApi[];
}

/** The usage limit applies to each spell of the group, not to the group as a whole. */
export interface CreatureInnateSpellGroup {
  usage: CreatureUsage;
  spells: string[];
}

export interface CreatureInnateSpellGroupApi {
  usage: CreatureUsage;
  spells: SpellApi[];
}

export interface CreatureInnateSpellcasting {
  /** Attribute id used as the innate spellcasting ability. */
  abilityId?: string;
  spellSaveDc?: number;
  spellAttackBonus?: number;
  spells: CreatureInnateSpellGroup[];
}

export interface CreatureInnateSpellcastingApi {
  ability?: AttributeApi;
  spellSaveDc?: number;
  spellAttackBonus?: number;
  spells: CreatureInnateSpellGroupApi[];
}

export interface CreatureSkillBonus {
  skillId: string;
  bonus: number;
}

/** Sense distances (darkvision, blindsight, tremorsense, truesight) are stored in feet. */
export interface CreatureSenses {
  darkvision?: number;
  blindsight?: number;
  tremorsense?: number;
  truesight?: number;
  passive_perception?: number;
  notes?: string;
}

export interface CreatureLegendaryActions {
  uses: number;
  description?: string[];
  actions: CreatureFeature[];
}

export interface CreatureLegendaryActionsApi {
  uses: number;
  description?: string[];
  actions: CreatureFeatureApi[];
}

export interface CreatureMongo {
  _id: ObjectId;
  name: string;
  ruleset: string;
  img?: string;
  description: string[];
  creatureTypeId: string;
  /** `"any"`, a race id, or null when the creature has no race. Legacy `subtype` is ignored. */
  race?: string | null;
  size: string;
  alignment: string;
  armor_class?: { value: number; notes?: string };
  HPMax: number;
  hit_dice?: string;
  /** Movement speeds in feet. */
  speed: Speed;
  attributes: { key: string; value: number }[];
  saving_throws: string[];
  skill_bonuses?: CreatureSkillBonus[];
  senses?: CreatureSenses;
  languages: CreatureLanguagesCreate;
  language_choices?: ChoiceMongo;
  challenge_rating: number;
  xp: number;
  prof_bonus: number;
  damage_vulnerabilities: string[];
  damage_immunities: string[];
  damage_resistances: string[];
  condition_immunities: string[];
  special_abilities: CreatureFeature[];
  spellcasting?: CreatureSpellcasting | null;
  innateSpellcasting?: CreatureInnateSpellcasting | null;
  actions: CreatureFeature[];
  bonus_actions: CreatureFeature[];
  reactions: CreatureFeature[];
  legendary_actions?: CreatureLegendaryActions;
  equipment: CharacterEquipmentMongo[];
  deletedAt?: Date | null;
}

export interface CreatureApi {
  id: string;
  name: string;
  ruleset: string;
  img?: string;
  description: string[];
  creatureType?: CreatureTypeApi;
  race: RaceRef | typeof CREATURE_ANY_RACE | null;
  size: string;
  alignment: string;
  armor_class?: { value: number; notes?: string };
  CA: number;
  HPMax: number;
  hit_dice?: string;
  speed: Speed;
  attributes: CharacterAttributeApi[];
  saving_throws: string[];
  skills: SkillPersonajeApi[];
  senses: CreatureSenses;
  languages: CreatureLanguages;
  language_choices?: ChoiceApi<LanguageApi>;
  challenge_rating: number;
  xp: number;
  prof_bonus: number;
  damage_vulnerabilities: Damage[];
  damage_immunities: Damage[];
  damage_resistances: Damage[];
  condition_immunities: ConditionApi[];
  special_abilities: CreatureFeatureApi[];
  spellcasting: CreatureSpellcastingApi;
  innateSpellcasting: CreatureInnateSpellcastingApi;
  actions: CreatureFeatureApi[];
  bonus_actions: CreatureFeatureApi[];
  reactions: CreatureFeatureApi[];
  legendary_actions?: CreatureLegendaryActionsApi;
  equipment: EquipmentInstanceApi[];
  deletedAt?: Date | null;
}

export interface CreateCreature {
  name: string;
  ruleset: string;
  img?: string | null;
  description?: string[];
  creatureTypeId: string;
  /** `"any"`, a race id, or null when the creature has no race. */
  race?: string | null;
  size: string;
  alignment: string;
  armor_class?: { value: number; notes?: string } | null;
  HPMax: number;
  hit_dice?: string | null;
  speed: Speed;
  attributes?: { key: string; value: number }[];
  saving_throws?: string[];
  skill_bonuses?: CreatureSkillBonus[] | null;
  senses?: CreatureSenses | null;
  languages?: CreatureLanguagesCreate | null;
  language_choices?: ChoiceMongo | null;
  challenge_rating: number;
  xp: number;
  prof_bonus: number;
  damage_vulnerabilities?: string[];
  damage_immunities?: string[];
  damage_resistances?: string[];
  condition_immunities?: string[];
  special_abilities?: CreatureFeature[];
  spellcasting?: CreatureSpellcasting | null;
  innateSpellcasting?: CreatureInnateSpellcasting | null;
  actions?: CreatureFeature[];
  bonus_actions?: CreatureFeature[];
  reactions?: CreatureFeature[];
  legendary_actions?: CreatureLegendaryActions | null;
  equipment?: CharacterEquipmentMongo[] | null;
}

export interface UpdateCreature extends Partial<CreateCreature> {
  id: string;
}

export interface CreatureListFilters {
  creatureTypeId?: string;
}
