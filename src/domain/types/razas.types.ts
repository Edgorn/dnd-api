import { ObjectId } from "mongoose"
import { AbilityBonusesMongo, ChoiceApi, ChoiceMongo, Speed } from "."
import { CompetenciaApi } from "./competencias.types"
import { ChoiceSpell, ConjuroApi } from "./conjuros.types"
import { DoteApi } from "./dotes.types"
import { HabilidadApi } from "./habilidades.types"
import { IdiomaApi, IdiomasCriatura, IdiomasCriaturaCrear } from "./idiomas.types"
import { RasgoApi, RasgoDataMongo } from "./rasgos.types"
import { CaracteristicaBonus, CaracteristicaBonusCreate } from "./caracteristica.types"

export interface RaceMongo {
  _id: ObjectId,
  index: string,
  name: string,
  description: string[],
  desc: string,
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
  ability_bonuses: CaracteristicaBonusCreate[],
  ability_bonus_choices: ChoiceMongo,
  traits: string[],
  traits_data: RasgoDataMongo,
  skill_choices?: ChoiceMongo,
  languages: IdiomasCriaturaCrear,
  language_choices?: ChoiceMongo,
  proficiencies_choices?: ChoiceMongo[],
  subraces?: SubracesMongo,
  variants: VarianteMongo[],
  levels: RaceLevelMongo[]
}

export interface RaceLevelMongo {
  level: number,
  traits_data: RasgoDataMongo,
}

export interface SubracesMongo {
  name: string,
  list: SubraceMongo[]
}

export interface SubraceMongo {
  index: string,
  name: string,
  description: string[],
  desc: string,
  img: string,
  ability_bonuses: CaracteristicaBonusCreate[],
  traits: string[],
  traits_data: RasgoDataMongo,
  languages: IdiomasCriaturaCrear,
  language_choices?: ChoiceMongo,
  spell_choices?: ChoiceSpell[],
  types: TypeMongo[],
}

export interface TypeMongo {
  name: string,
  desc: string,
  img: string
}

export interface VarianteMongo {
  name: string,
  ability_bonuses: CaracteristicaBonus[],
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
  ability_bonuses: CaracteristicaBonus[],
  ability_bonus_choices?: ChoiceApi<CaracteristicaBonus>,
  skill_choices?: ChoiceApi<HabilidadApi>,
  traits: RasgoApi[],
  traits_data: RasgoDataMongo,
  languages: IdiomasCriatura,
  language_choices?: ChoiceApi<IdiomaApi>,
  proficiencies_choices?: ChoiceApi<CompetenciaApi>[],
  spell_choices?: ChoiceApi<ConjuroApi>,
  subraces?: SubracesApi,
  variants: VarianteApi[]
}

export interface SubracesApi {
  name: string,
  list: SubraceApi[]
}

export interface SubraceApi {
  index: string,
  name: string,
  description: string[],
  img: string,
  ability_bonuses: CaracteristicaBonus[],
  traits: RasgoApi[],
  traits_data: RasgoDataMongo,
  languages: IdiomasCriatura,
  language_choices?: ChoiceApi<IdiomaApi>,
  spell_choices?: ChoiceApi<ConjuroApi>[],
  types: TypeApi[],
}

export interface TypeApi {
  name: string,
  desc: string,
  img: string
}

export interface VarianteApi {
  name: string,
  ability_bonuses: CaracteristicaBonus[],
  skill_choices?: ChoiceApi<HabilidadApi>,
  ability_bonus_choices?: ChoiceApi<CaracteristicaBonus>,
  dotes?: ChoiceApi<DoteApi>
}

export interface CreateRace {
  id?: string,
  name: string;
  description: string[];
  alignment: string;
  ruleset: string;
  img: string;
  ability_bonuses: CaracteristicaBonusCreate;
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
  traits_data: RasgoDataMongo,
  languages: IdiomasCriaturaCrear,
  subraces: CreateSubraces
}

export interface CreateSubraces {
  name: string,
  list: CreateSubrace[]
}

export interface CreateSubrace {
  id: string,
  name: string
  description: string[]
  img: string;
  ability_bonuses: CaracteristicaBonusCreate;
  traits: string[];
  traits_data: RasgoDataMongo,
  languages: IdiomasCriaturaCrear
}