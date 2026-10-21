import { ChoiceApi, ChoiceMongo } from "."
import { ProficiencyApi } from "./proficiencies.types"
import { ChoiceSpell, SpellApi } from "./spell.types"
import {
  LevelSkillProficiencyChoice,
  SpellChoiceApi,
  SpellChoiceMongo
} from "./classLevelChoices.types"
import { FeatApi, FeatRequirements, FeatRequirementsCreate } from "./feat.types"
import { EquipmentInstanceApi, CharacterEquipmentMongo, EquipmentChoiceMongo, EquipmentCost, ResolvedEquipmentChoiceApi } from "./equipment.types"
import { SkillApi } from "./skill.types"
import { LanguageApi } from "./language.types"
import { OptionChoiceMongo, OptionReplacementConfig } from "./optionGroup.types"
import { TraitApi, TraitDataMongo } from "./traits.types"
import { AttributeApi } from "./attribute.types"
import { SubclassApi, SubclassSummary } from "./subclass.types"
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

/**
 * Optional class config to replace known spells when gaining a class level
 * (e.g. bard: swap one known class spell for another of a level you have slots for).
 */
export interface SpellReplacementConfig {
  count: number;
  /** When true, known cantrips may also be replaced. Default false (PHB 2014). */
  includeCantrips?: boolean;
}

export type {
  FormatSpellChoicesContext,
  LevelSkillProficiencyChoice,
  LevelSkillProficiencyFrom,
  LevelSkillProficiencyValue,
  SpellChoiceApi,
  SpellChoiceMongo,
  SpellChoiceSource
} from "./classLevelChoices.types";
export {
  LEVEL_SKILL_PROFICIENCY_FROMS,
  LEVEL_SKILL_PROFICIENCY_VALUES,
  SPELL_CHOICE_SOURCES
} from "./classLevelChoices.types";

/** Uniform slot pool: `count` slots, all of spell `level` (e.g. warlock-style). */
export interface UniformSpellSlots {
  count: number;
  level: number;
}

/** Spell slots table for a class level (create/update input and slim API). */
export interface ClassSpellSlots {
  cantrips?: number;
  /**
   * Number of leveled spells (1+) learned when gaining this class level.
   * Not inherited from previous levels.
   */
  spellsLearned?: number;
  /** Spell slot counts keyed by spell level ("1".."9"). Mutually exclusive with uniformSlots. */
  slots?: Record<string, number>;
  /** Uniform slot pool. Mutually exclusive with slots. */
  uniformSlots?: UniformSpellSlots;
}

/** Slim level row accepted on create/update (does not replace full Mongo level docs). */
export interface CharacterClassLevelInput {
  level: number;
  spellcasting?: ClassSpellSlots;
  spell_choices?: SpellChoiceMongo[];
  /** Trait ObjectIds granted at this class level. Omitted on update leaves existing traits. */
  traits?: string[];
  /** Dynamic trait placeholders for this class level. Omitted on update leaves existing traits_data. */
  traits_data?: TraitDataMongo;
  skill_choices?: ChoiceMongo | null;
  skillProficiencyChoices?: LevelSkillProficiencyChoice | null;
  optionChoices?: OptionChoiceMongo[] | null;
}

export interface CharacterClassMulticlassCreate {
  requirements?: FeatRequirementsCreate;
  proficiencies?: string[];
  skill_choices?: ChoiceMongo | null;
  proficiencies_choices?: ChoiceMongo[] | null;
}

export interface CharacterClassMulticlassApi {
  requirements?: FeatRequirements;
  proficiencies: ProficiencyApi[];
  skill_choices?: ChoiceApi<SkillApi>;
  proficiencies_choices?: ChoiceApi<ProficiencyApi>[];
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
  proficiencies_choices?: ChoiceMongo[] | null;
  multiclass?: CharacterClassMulticlassCreate;
  equipment?: CharacterEquipmentMongo[] | null;
  equipment_choices?: EquipmentChoiceMongo[] | null;
  spellcasting?: string | null;
  spellSaveDcFormula?: string;
  spellAttackBonusFormula?: string;
  spellsPreparedFormula?: string;
  preparedFrom?: SpellPreparedFrom;
  spellRepository?: SpellRepositoryConfig | null;
  spellReplacement?: SpellReplacementConfig | null;
  optionReplacements?: OptionReplacementConfig[] | null;
  levels?: CharacterClassLevelInput[];
  abilityScoreProgression?: number[] | null;
  subclassChoice?: SubclassChoiceConfig | null;
  god?: boolean;
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
  proficiencies_choices?: ChoiceMongo[] | null;
  multiclass?: CharacterClassMulticlassCreate | null;
  equipment?: CharacterEquipmentMongo[] | null;
  equipment_choices?: EquipmentChoiceMongo[] | null;
  /** Attribute ObjectId used as the class spellcasting ability. */
  spellcasting?: string | null;
  spellSaveDcFormula?: string;
  spellAttackBonusFormula?: string;
  spellsPreparedFormula?: string;
  preparedFrom?: SpellPreparedFrom;
  spellRepository?: SpellRepositoryConfig | null;
  spellReplacement?: SpellReplacementConfig | null;
  optionReplacements?: OptionReplacementConfig[] | null;
  levels?: CharacterClassLevelInput[];
  abilityScoreProgression?: number[] | null;
  subclassChoice?: SubclassChoiceConfig | null;
  god?: boolean;
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
  multiclass?: CharacterClassMulticlassCreate | null;
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
  spellReplacement?: SpellReplacementConfig | null;
  optionReplacements?: OptionReplacementConfig[] | null;
  subclassChoice?: SubclassChoiceConfig | null;
  abilityScoreProgression?: number[] | null;
  god?: boolean;
}

export interface CharacterClassLevelMongo {
  level: number;
  proficiencies: string[];
  traits: string[];
  traits_data: TraitDataMongo;
  spell_choices?: (SpellChoiceMongo | ChoiceSpell)[];
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
  skill_choices?: ChoiceMongo;
  skillProficiencyChoices?: LevelSkillProficiencyChoice;
  optionChoices?: OptionChoiceMongo[];
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
  skill_choices?: ChoiceMongo;
  proficiencies?: string[];
  spells?: string[];
  spell_choices?: SpellChoiceMongo[];
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
  multiclass?: CharacterClassMulticlassApi;
  spells?: SpellApi[];
  spell_choices?: SpellChoiceApi[];
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
  spellReplacement?: SpellReplacementConfig;
  optionReplacements?: OptionReplacementConfig[];
  levels?: CharacterClassLevelInput[];
  abilityScoreProgression?: number[];
  subclassChoice?: SubclassChoiceConfig;
  subclasses?: SubclassApi[];
  god: boolean;
  deletedAt?: Date | null;
}

export interface CharacterClassSummaryChoice {
  name: string;
  level: number;
}

export interface CharacterClassSummaryDraft {
  id: string;
  name: string;
  img: string;
  description: string[];
  ruleset: string;
  hit_die: number;
  hasSpellcasting: boolean;
  subclassChoice: CharacterClassSummaryChoice | null;
}

export interface CharacterClassSummary {
  id: string;
  name: string;
  img: string;
  descriptionTeaser?: string;
  ruleset: string;
  hit_die: number;
  hasSpellcasting: boolean;
  subclassChoice: CharacterClassSummaryChoice | null;
  subclassCount: number;
}

export interface CharacterClassCatalogItem {
  id: string;
  name: string;
  ruleset: string;
  multiclass?: {
    requirements: FeatRequirements;
  };
}

export interface CharacterClassDetailApi extends Omit<CharacterClassApi, "subclasses"> {
  subclasses?: SubclassSummary[];
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
  skill_choices?: ChoiceApi<SkillApi>;
  language_choices?: ChoiceApi<LanguageApi>;
  proficiencies?: ProficiencyApi[];
  spells?: SpellApi[];
  spell_choices?: SpellChoiceApi[];
}

export interface ClaseLevelUp {
  hit_die: number;
  traits: TraitApi[];
  traits_data: TraitDataMongo;
  ability_score?: boolean;
  feats?: ChoiceApi<FeatApi>;
  subclassChoice?: SubclassChoiceMenuApi | null;
  spells?: SpellApi[];
  spell_choices?: SpellChoiceApi[];
  spell_changes?: ChoiceApi<SpellApi>[][];
  skill_choices?: ChoiceApi<SkillApi>;
  skillProficiencyChoices?: LevelSkillProficiencyChoice[];
  optionChoices?: OptionChoiceMongo[];
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
