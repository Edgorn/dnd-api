import { ChoiceApi, ChoiceMongo } from ".";
import { LevelSkillProficiencyChoice, SpellChoiceMongo } from "./classLevelChoices.types";
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
}

export interface SubclassLevelMongo {
  level: number;
  traits: string[];
  traits_data: TraitDataMongo;
  skill_choices?: ChoiceMongo;
  skillProficiencyChoices?: LevelSkillProficiencyChoice;
  spell_choices?: SpellChoiceMongo[];
}

export interface SubclassLevelApi {
  level: number;
  traits: TraitApi[];
  traits_data: TraitDataMongo;
  skill_choices?: ChoiceApi<SkillApi>;
  skillProficiencyChoices?: LevelSkillProficiencyChoice;
  spell_choices?: SpellChoiceMongo[];
}

export interface InputCreateSubclass {
  ruleset: string;
  classId: string;
  name: string;
  description?: string[];
  img?: string;
  levels?: SubclassLevelInput[];
  expandedSpells?: string[];
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
  deletedAt?: Date | null;
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
  deletedAt?: Date | null;
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
