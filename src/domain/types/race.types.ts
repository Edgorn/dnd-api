import { ObjectId } from "mongoose"
import { ChoiceApi, ChoiceMongo, Speed } from "."
import { CompetenciaApi } from "./competencias.types"
import { ChoiceSpell, ConjuroApi } from "./conjuros.types"
import { DoteApi } from "./dotes.types"
import { SkillApi } from "./skill.types"
import { LanguageApi, CreatureLanguages, CreatureLanguagesCreate } from "./language.types"
import { TraitApi, TraitDataMongo } from "./traits.types"
import { AttributeBonus, AttributeBonusCreate } from "./attribute.types"

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
  spell_choices?: ChoiceSpell[],
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
  proficiencies_choices?: ChoiceApi<CompetenciaApi>[],
  spell_choices?: ChoiceApi<ConjuroApi>[],
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
  description: string[];
  alignment?: string;
  ruleset: string;
  img: string;
  ability_bonuses: AttributeBonusCreate;
  speed: {
    walk: number;
  };
  size: string;
  size_range?: {
    min: number;
    max: number;
  };
  weight_range?: {
    min: number;
    max: number;
  }
  age?: {
    maturity: number;
    expectancy: number;
  };
  traits: string[];
  traits_data: TraitDataMongo,
  languages: CreatureLanguagesCreate,
  parentId?: string,
  subraces_name?: string,
  spell_choices?: ChoiceSpell[]
}
