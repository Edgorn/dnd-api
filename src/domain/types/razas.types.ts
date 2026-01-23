import { AbilityBonusesApi, AbilityBonusesMongo, ChoiceApi, ChoiceMongo } from "."
import { CompetenciaApi } from "./competencias.types"
import { ChoiceSpell, ConjuroApi } from "./conjuros.types"
import { DoteApi } from "./dotes.types"
import { HabilidadApi } from "./habilidades.types"
import { IdiomaApi } from "./idiomas.types"
import { RasgoApi, RasgoDataMongo } from "./rasgos.types"

export interface RaceMongo {
  index: string,
  name: string,
  desc: string,
  img: string,
  speed: number,
  size: string,
  ability_bonuses: AbilityBonusesMongo[],
  ability_bonus_choices: ChoiceMongo,
  traits: string[],
  skill_choices?: ChoiceMongo,
  languages: string[],
  language_choices?: ChoiceMongo,
  proficiencies_choices?: ChoiceMongo[],
  subraces: SubraceMongo[],
  variants: VarianteMongo[],
  levels: RaceLevelMongo[]
}

export interface RaceLevelMongo {
  level: number,
  traits_data: RasgoDataMongo,
}

export interface SubraceMongo {
  index: string,
  name: string,
  desc: string,
  img: string,
  ability_bonuses: AbilityBonusesMongo[],
  traits: string[],
  traits_data: RasgoDataMongo,
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
  ability_bonuses: AbilityBonusesMongo[],
  skill_choices?: ChoiceMongo,
  ability_bonus_choices: ChoiceMongo,
  dotes?: number
}

export interface RaceApi {
  index: string,
  name: string,
  desc: string,
  img: string,
  speed: number,
  size: string,
  ability_bonuses: AbilityBonusesApi[],
  ability_bonus_choices?: ChoiceApi<AbilityBonusesApi>,
  skill_choices?: ChoiceApi<HabilidadApi>,
  traits: RasgoApi[],
  traits_data: RasgoDataMongo,
  languages: IdiomaApi[],
  language_choices?: ChoiceApi<IdiomaApi>,
  proficiencies_choices?: ChoiceApi<CompetenciaApi>[],
  spell_choices?: ChoiceApi<ConjuroApi>,
  subraces: SubraceApi[], 
  variants: VarianteApi[]
} 

export interface SubraceApi {
  index: string,
  name: string,
  desc: String,
  img: string,
  ability_bonuses: AbilityBonusesApi[],
  traits: RasgoApi[],
  traits_data: RasgoDataMongo,
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
  ability_bonuses: AbilityBonusesApi[],
  skill_choices?: ChoiceApi<HabilidadApi>,
  ability_bonus_choices?: ChoiceApi<AbilityBonusesApi>,
  dotes?: ChoiceApi<DoteApi>
}