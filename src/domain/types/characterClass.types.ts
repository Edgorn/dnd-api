import { ChoiceApi, ChoiceMongo } from "."
import { ProficiencyApi } from "./proficiencies.types"
import { ChoiceSpell, SpellApi } from "./spell.types"
import { FeatApi } from "./feat.types"
import { EquipmentInstanceApi, CharacterEquipmentMongo, EquipmentChoiceMongo, EquipmentCost, ResolvedEquipmentChoiceApi } from "./equipment.types"
import { SkillApi } from "./skill.types"
import { LanguageApi } from "./language.types"
import { InvocacionApi } from "./invocaciones.types"
import { TraitApi, TraitDataMongo } from "./traits.types"
import { AttributeApi } from "./attribute.types"
import { SubclassApi } from "./subclass.types"
import { ObjectId } from "mongoose"

export interface SubclassChoiceConfig {
  name: string;
  description: string[];
  level: number;
}

export interface SubclassChoiceMenuApi extends SubclassChoiceConfig {
  options: SubclassApi[];
}

export type SpellPreparedFrom = "known" | "classList";

/** Cost to copy or duplicate one spell level into a class spell repository. */
export interface SpellCopyCost {
  hoursPerSpellLevel: number;
  costPerSpellLevel: EquipmentCost;
}

/**
 * Optional class config for a copyable spell repository (e.g. wizard spellbook).
 * Presence of this object is the frontend indicator that the class can copy spells
 * outside of level-up.
 */
export interface SpellRepositoryConfig {
  name: string;
  equipmentId?: string;
  includesCantrips: boolean;
  copy: SpellCopyCost;
  duplicate: SpellCopyCost;
  recoverPreparedOnLoss: boolean;
}

/** Spell slots table for a class level (create/update input and slim API). */
export interface ClassSpellSlots {
  cantrips?: number;
  /**
   * Number of leveled spells (1+) learned when gaining this class level.
   * Not inherited from previous levels.
   */
  spellsLearned?: number;
  /** Spell slot counts keyed by spell level ("1".."9"). */
  slots?: Record<string, number>;
}

/** Slim level row accepted on create/update (does not replace full Mongo level docs). */
export interface CharacterClassLevelInput {
  level: number;
  spellcasting?: ClassSpellSlots;
  spell_choices?: ChoiceMongo[];
  /** Trait ObjectIds granted at this class level. Omitted on update leaves existing traits. */
  traits?: string[];
}

export interface InputCreateCharacterClass {
  ruleset: string;
  name: string;
  description?: string[];
  img?: string;
  hit_die?: number;
  proficiencies?: string[];
  saving_throws?: string[];
  skill_choices?: ChoiceMongo | null;
  equipment?: CharacterEquipmentMongo[] | null;
  equipment_choices?: EquipmentChoiceMongo[] | null;
  spellcasting?: string | null;
  spellSaveDcFormula?: string;
  spellAttackBonusFormula?: string;
  spellsPreparedFormula?: string;
  preparedFrom?: SpellPreparedFrom;
  spellRepository?: SpellRepositoryConfig | null;
  levels?: CharacterClassLevelInput[];
  abilityScoreProgression?: number[] | null;
  subclassChoice?: SubclassChoiceConfig | null;
}

export interface InputUpdateCharacterClass {
  id: string;
  ruleset?: string;
  name?: string;
  description?: string[];
  img?: string;
  hit_die?: number;
  proficiencies?: string[];
  saving_throws?: string[];
  skill_choices?: ChoiceMongo | null;
  equipment?: CharacterEquipmentMongo[] | null;
  equipment_choices?: EquipmentChoiceMongo[] | null;
  /** Attribute ObjectId used as the class spellcasting ability. */
  spellcasting?: string | null;
  spellSaveDcFormula?: string;
  spellAttackBonusFormula?: string;
  spellsPreparedFormula?: string;
  preparedFrom?: SpellPreparedFrom;
  spellRepository?: SpellRepositoryConfig | null;
  levels?: CharacterClassLevelInput[];
  abilityScoreProgression?: number[] | null;
  subclassChoice?: SubclassChoiceConfig | null;
}

export interface CharacterClassMongo {
  _id?: any;
  ruleset?: string;
  deletedAt?: Date | null;
  name: string;
  description: string[];
  img: string;
  hit_die: number;
  proficiencies: string[];
  proficiencies_choices?: ChoiceMongo[];
  skill_choices?: ChoiceMongo;
  saving_throws: string[];
  equipment: CharacterEquipmentMongo[];
  equipment_choices?: EquipmentChoiceMongo[];
  levels: CharacterClassLevelMongo[];
  spellcasting?: ObjectId | string | null;
  spellSaveDcFormula?: string;
  spellAttackBonusFormula?: string;
  spellsPreparedFormula?: string;
  preparedFrom?: SpellPreparedFrom;
  spellRepository?: SpellRepositoryConfig | null;
  subclassChoice?: SubclassChoiceConfig | null;
  abilityScoreProgression?: number[] | null;
}

export interface CharacterClassLevelMongo {
  level: number;
  proficiencies: string[];
  traits: string[];
  traits_options?: {
    name: string;
    options: string[];
  };
  traits_data: TraitDataMongo;
  spell_choices?: (ChoiceMongo | ChoiceSpell)[];
  spell_changes?: {
    number: number;
    options: ChoiceSpell[];
  };
  spell_group?: {
    level: number;
    class: string;
  };
  subclasses_options?: SubclassesOptionsMongo;
  subclasses?: SubclassesMongo;
  ability_score?: boolean;
  spellcasting?: ClassSpellSlots;
  double_skills?: number;
  skill_choices?: ChoiceMongo;
  invocations?: number;
  invocations_change?: number;
}

/** Raw spellcasting data from class repo before character attribute/formula evaluation. */
export interface SpellcastingLevelSource {
  class: string;
  abilityKey: string;
  classLevel?: number;
  slots?: ClassSpellSlots;
  spellSaveDcFormula?: string;
  spellAttackBonusFormula?: string;
  spellsPreparedFormula?: string;
  preparedFrom?: SpellPreparedFrom;
  spellRepository?: SpellRepositoryConfig;
}

/** Spellcasting entry on PersonajeApi after hydration and formula evaluation. */
export interface SpellcastingLevel {
  class: string;
  ability: AttributeApi;
  slots?: ClassSpellSlots;
  spellSaveDc?: number;
  spellAttackBonus?: number;
  spellsPrepared?: number;
  preparedFrom?: SpellPreparedFrom;
  spellRepository?: SpellRepositoryConfig;
}


export interface SubclassesOptionsMongo {
  name: string;
  desc: string;
  options: SubclassesOptionsMongoOption[];
}

export interface SubclassesOptionsMongoOption {
  id: string;
  name: string;
  img: string;
}

export interface SubclassesMongo {
  [key: string]: SubclassMongo;
}

export interface SubclassMongo {
  traits: string[];
  traits_data: TraitDataMongo;
  traits_options?: {
    name: string;
    options: string[];
  };
  skill_choices?: ChoiceMongo;
  double_skill_choices?: ChoiceMongo;
  proficiencies?: string[];
  spells?: string[];
  spell_choices?: ChoiceSpell[];
  language_choices?: ChoiceMongo;
}

export interface CharacterClassApi {
  id: string;
  ruleset: string;
  name: string;
  description: string[];
  img: string;
  hit_die: number;
  proficiencies: ProficiencyApi[];
  proficiencies_choices?: ChoiceApi<ProficiencyApi>[];
  skill_choices?: ChoiceApi<SkillApi>;
  spells?: SpellApi[];
  spell_choices?: ChoiceApi<SpellApi>[];
  traits: TraitApi[];
  traits_data: TraitDataMongo;
  saving_throws: AttributeApi[];
  equipment?: EquipmentInstanceApi[];
  equipment_choices?: ResolvedEquipmentChoiceApi[];
  prof_bonus: number;
  spellcasting?: AttributeApi;
  spellSaveDcFormula?: string;
  spellAttackBonusFormula?: string;
  spellsPreparedFormula?: string;
  preparedFrom?: SpellPreparedFrom;
  spellRepository?: SpellRepositoryConfig;
  levels?: CharacterClassLevelInput[];
  abilityScoreProgression?: number[];
  subclassChoice?: SubclassChoiceConfig;
  subclasses?: SubclassApi[];
  deletedAt?: Date | null;
}

export interface SubclassesOptionsApi {
  name: string;
  desc: string;
  options: SubclassOptionApi[];
}

export interface SubclassOptionApi extends EmbeddedSubclassApi {
  id: string;
  name: string;
  img: string;
}

/** Legacy embedded subclass payload (levels[].subclasses). Kept for old documents. */
export interface EmbeddedSubclassApi {
  traits: TraitApi[];
  traits_options?: {
    name: string;
    options: TraitApi[];
  };
  skill_choices?: ChoiceApi<SkillApi>;
  double_skill_choices?: ChoiceApi<SkillApi>;
  language_choices?: ChoiceApi<LanguageApi>;
  proficiencies?: ProficiencyApi[];
  spells?: SpellApi[];
  spell_choices?: ChoiceApi<SpellApi>[];
}

export interface ClaseLevelUp {
  hit_die: number;
  traits: TraitApi[];
  traits_data: TraitDataMongo;
  traits_options?: {
    name: string;
    options: TraitApi[];
  };
  ability_score?: boolean;
  feats?: ChoiceApi<FeatApi>;
  subclassChoice?: SubclassChoiceMenuApi | null;
  double_skills?: number;
  spells?: SpellApi[];
  spell_choices?: ChoiceApi<SpellApi>[];
  spell_changes?: ChoiceApi<SpellApi>[][];
  skill_choices?: ChoiceApi<SkillApi>;
  invocations_choices?: ChoiceApi<InvocacionApi>;
  invocations_change?: ChoiceApi<InvocacionApi>;
}

// Aliases for legacy compatibility
export type ClaseMongo = CharacterClassMongo;
export type ClaseApi = CharacterClassApi;
export type SubclaseApi = EmbeddedSubclassApi;
export type SubclaseOptionApi = SubclassOptionApi;
export type SubclasesOptionsApi = SubclassesOptionsApi;
export type SubclaseMongo = SubclassMongo;
export type SubclasesMongo = SubclassesMongo;
export type SubclasesOptionsMongo = SubclassesOptionsMongo;
export type SubclasesOptionsMongoOption = SubclassesOptionsMongoOption;
