import { ChoiceApi, ChoiceMongo } from ".";
import { LevelSkillProficiencyChoice, SpellChoiceMongo } from "./classLevelChoices.types";
import { OptionChoiceMongo, OptionReplacementConfig } from "./optionGroup.types";
import { ProficiencyApi } from "./proficiencies.types";
import { SkillApi } from "./skill.types";
import { SpellApi, SpellRef } from "./spell.types";
import { TraitApi, TraitDataMongo } from "./traits.types";

export interface AlwaysPreparedSpellRow {
  atLevel: number;
  spellIds: string[];
}

export interface AlwaysPreparedSpellRowApi {
  atLevel: number;
  spells: SpellApi[];
}

export interface AlwaysPreparedSpellRowRefApi {
  atLevel: number;
  spells: SpellRef[];
}

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
  proficiencies?: string[];
  proficiencies_choices?: ChoiceMongo[] | null;
  expandedSpells?: string[];
  alwaysPreparedSpells?: AlwaysPreparedSpellRow[];
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
  proficiencies?: string[];
  proficiencies_choices?: ChoiceMongo[] | null;
  expandedSpells?: string[] | null;
  alwaysPreparedSpells?: AlwaysPreparedSpellRow[] | null;
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
  proficiencies: string[];
  proficiencies_choices?: ChoiceMongo[];
  expandedSpells?: string[];
  alwaysPreparedSpells?: AlwaysPreparedSpellRow[];
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
  proficiencies: string[];
  proficiencies_choices?: ChoiceMongo[];
  expandedSpells: string[];
  alwaysPreparedSpells?: AlwaysPreparedSpellRow[];
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
  proficiencies?: ProficiencyApi[];
  proficiencies_choices?: ChoiceApi<ProficiencyApi>[];
  expandedSpells?: SpellApi[];
  alwaysPreparedSpells?: AlwaysPreparedSpellRowApi[];
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
