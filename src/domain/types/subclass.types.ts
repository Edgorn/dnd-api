import { ChoiceApi, ChoiceMongo } from ".";
import { LevelSkillProficiencyChoice, SpellChoiceMongo } from "./classLevelChoices.types";
import { OptionChoiceMongo, OptionReplacementConfig } from "./optionGroup.types";
import { SkillApi } from "./skill.types";
import { SpellApi } from "./spell.types";
import { TraitApi, TraitDataMongo } from "./traits.types";

export interface SubclassLevelInput {
  level: number;
  traits?: string[];
  traits_data?: TraitDataMongo;
  skill_choices?: ChoiceMongo | null;
  skillProficiencyChoices?: LevelSkillProficiencyChoice | null;
  spell_choices?: SpellChoiceMongo[] | null;
  optionChoices?: OptionChoiceMongo[] | null;
}

export interface SubclassLevelMongo {
  level: number;
  traits: string[];
  traits_data: TraitDataMongo;
  skill_choices?: ChoiceMongo;
  skillProficiencyChoices?: LevelSkillProficiencyChoice;
  spell_choices?: SpellChoiceMongo[];
  optionChoices?: OptionChoiceMongo[];
}

export interface SubclassLevelApi {
  level: number;
  traits: TraitApi[];
  traits_data: TraitDataMongo;
  skill_choices?: ChoiceApi<SkillApi>;
  skillProficiencyChoices?: LevelSkillProficiencyChoice;
  spell_choices?: SpellChoiceMongo[];
  optionChoices?: OptionChoiceMongo[];
}

export interface InputCreateSubclass {
  ruleset: string;
  classId: string;
  name: string;
  description?: string[];
  img?: string;
  levels?: SubclassLevelInput[];
  expandedSpells?: string[];
  optionReplacements?: OptionReplacementConfig[] | null;
}

export interface InputUpdateSubclass {
  id: string;
  ruleset?: string;
  classId?: string;
  name?: string;
  description?: string[];
  img?: string;
  levels?: SubclassLevelInput[];
  expandedSpells?: string[] | null;
  optionReplacements?: OptionReplacementConfig[] | null;
}

export interface SubclassMongo {
  _id?: any;
  ruleset: string;
  classId: string;
  name: string;
  description: string[];
  img: string;
  levels: SubclassLevelMongo[];
  expandedSpells?: string[];
  optionReplacements?: OptionReplacementConfig[];
  deletedAt?: Date | null;
}

export interface SubclassRulesLevel {
  level: number;
  traits: string[];
  traits_data: TraitDataMongo;
  skill_choices?: ChoiceMongo;
  skillProficiencyChoices?: LevelSkillProficiencyChoice;
  spell_choices?: SpellChoiceMongo[];
  optionChoices?: OptionChoiceMongo[];
}

/** Lean subclass document: trait ids per level, no hydrated catalog. */
export interface SubclassRulesRef {
  id: string;
  ruleset: string;
  classId: string;
  name: string;
  levels: SubclassRulesLevel[];
  expandedSpells: string[];
  optionReplacements?: OptionReplacementConfig[];
}

export interface SubclassApi {
  id: string;
  ruleset: string;
  classId: string;
  name: string;
  description: string[];
  img: string;
  levels: SubclassLevelApi[];
  expandedSpells?: SpellApi[];
  optionReplacements?: OptionReplacementConfig[];
  deletedAt?: Date | null;
}

export interface SubclassNameRef {
  id: string;
  name: string;
  classId: string;
}

export interface SubclassSummaryDraft {
  id: string;
  name: string;
  img: string;
  description: string[];
  ruleset: string;
  classId: string;
}

export interface SubclassSummary {
  id: string;
  name: string;
  img: string;
  descriptionTeaser?: string;
  ruleset: string;
  classId: string;
}
