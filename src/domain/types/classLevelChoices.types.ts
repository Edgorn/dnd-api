import { ChoiceApi } from ".";
import { SpellApi } from "./spell.types";

export const SPELL_CHOICE_SOURCES = ["classList", "anyClassList"] as const;
export type SpellChoiceSource = typeof SPELL_CHOICE_SOURCES[number];

export interface SpellChoiceMongo {
  choose: number;
  options?: string[];
  filter?: Record<string, string | number | (string | number)[]>;
  source?: SpellChoiceSource;
  levels?: "castable";
  includeCantrips?: boolean;
  countsTowardKnown?: boolean;
}

export interface SpellChoiceApi extends ChoiceApi<SpellApi> {
  source?: SpellChoiceSource;
  countsTowardKnown?: boolean;
}

export const LEVEL_SKILL_PROFICIENCY_VALUES = [0.5, 1, 2, 3] as const;
export type LevelSkillProficiencyValue = typeof LEVEL_SKILL_PROFICIENCY_VALUES[number];
export const LEVEL_SKILL_PROFICIENCY_FROMS = ["proficient"] as const;
export type LevelSkillProficiencyFrom = typeof LEVEL_SKILL_PROFICIENCY_FROMS[number];

export interface LevelSkillProficiencyChoice {
  choose: number;
  value: LevelSkillProficiencyValue;
  from: LevelSkillProficiencyFrom;
}

export interface FormatSpellChoicesContext {
  classId?: string;
  levels?: { level: number; spellcasting?: { cantrips?: number; spellsLearned?: number; slots?: Record<string, number> } }[];
  targetLevel?: number;
}
