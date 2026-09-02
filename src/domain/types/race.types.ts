import { ObjectId } from "mongoose"
import { ChoiceApi, ChoiceMongo, Speed } from "."
import { ProficiencyApi } from "./proficiencies.types"
import { SpellApi } from "./spell.types"
import { DoteApi } from "./dotes.types"
import { SkillApi } from "./skill.types"
import { LanguageApi, CreatureLanguages, CreatureLanguagesCreate } from "./language.types"
import { TraitApi, TraitDataMongo } from "./traits.types"
import { AttributeApi, AttributeBonus, AttributeBonusCreate } from "./attribute.types"

export interface RaceMongo {
  _id: ObjectId,
  name: string,
  description: string[],
  alignment?: string,
  img: string,
  ruleset: string,
  speed: Speed,
  size: string,
  size_range?: {
    min: number;
    max: number;
  },
  weight_range?: {
    min: number;
    max: number;
  },
  age?: {
    maturity: number;
    expectancy: number;
  },
  ability_bonuses: AttributeBonusCreate[],
  ability_bonus_choices: ChoiceMongo,
  traits: string[],
  traits_data: TraitDataMongo,
  skill_choices?: ChoiceMongo,
  languages: CreatureLanguagesCreate,
  language_choices?: ChoiceMongo,
  proficiencies_choices?: ChoiceMongo[],
  subraces_name?: string,
  parentId?: ObjectId | null,
  variants: VarianteMongo[],
  levels: RaceLevelMongo[],
  spell_choices?: ChoiceMongo[],
  spellcasting?: ObjectId | string | null,
  deletedAt?: Date | null
}

export interface RaceLevelMongo {
  level: number,
  traits_data: TraitDataMongo,
}

// SubracesMongo has been removed in favor of parentId on children

export interface VarianteMongo {
  name: string,
  ability_bonuses: AttributeBonus[],
  skill_choices?: ChoiceMongo,
  ability_bonus_choices: ChoiceMongo,
  dotes?: number
}

export interface RaceApi {
  id: string,
  name: string,
  description: string[],
  alignment?: string,
  img: string,
  ruleset: string,
  speed: Speed,
  size: string,
  size_range?: {
    min: number;
    max: number;
  },
  weight_range?: {
    min: number;
    max: number;
  }
  age?: {
    maturity: number;
    expectancy: number;
  },
  ability_bonuses: AttributeBonus[],
  ability_bonus_choices?: ChoiceApi<AttributeBonus>,
  skill_choices?: ChoiceApi<SkillApi>,
  traits: TraitApi[],
  traits_data: TraitDataMongo,
  languages: CreatureLanguages,
  language_choices?: ChoiceApi<LanguageApi>,
  proficiencies_choices?: ChoiceApi<ProficiencyApi>[],
  spell_choices?: ChoiceApi<SpellApi>[],
  spellcasting?: AttributeApi,
  subraces?: SubracesApi,
  parentId?: string | null,
  variants: VarianteApi[]
}

export interface SubracesApi {
  name: string,
  list: RaceApi[]
}

export interface VarianteApi {
  name: string,
  ability_bonuses: AttributeBonus[],
  skill_choices?: ChoiceApi<SkillApi>,
  ability_bonus_choices?: ChoiceApi<AttributeBonus>,
  dotes?: ChoiceApi<DoteApi>
}

export interface CreateRace {
  id?: string,
  name: string;
  description?: string[] | null;
  alignment?: string | null;
  ruleset: string;
  img?: string | null;
  ability_bonuses?: AttributeBonusCreate | null;
  speed: {
    walk: number;
  };
  size: string;
  size_range?: {
    min: number;
    max: number;
  } | null;
  weight_range?: {
    min: number;
    max: number;
  } | null;
  age?: {
    maturity: number;
    expectancy: number;
  } | null;
  traits?: string[] | null;
  traits_data?: TraitDataMongo | null;
  languages?: CreatureLanguagesCreate | null;
  language_choices?: ChoiceMongo | null;
  parentId?: string | null;
  subraces_name?: string | null;
  spell_choices?: ChoiceMongo[] | null;
  spellcasting?: string | null
}

export interface UpdateRace extends Partial<CreateRace> {
  id: string;
}

