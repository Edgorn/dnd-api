import { CompetenciaApi } from "./competencias.types";
import { IdiomaApi } from "./idiomas.types";

export interface ChoiceMongo {
  choose: number;
  options: string[] | string;
}

export interface ChoiceApi<T> {
  choose: number;
  options: T[];
}

export interface OptionSelectApi {
  label: string,
  value: string
}

export type MixedChoicesMongo =
  | MixedChoiceOptionProficiency
  | MixedChoiceOptionNested;

export interface MixedChoiceOptionProficiency {
  type: "proficiency";
  value: string;
}

export interface MixedChoiceOptionNested {
  type: "choice";
  value: "language_choices" | "proficiencies_choices";
  language_choices?: ChoiceMongo;
  proficiencies_choices?: ChoiceMongo[];
}

export type MixedChoicesApi =
  | { type: "proficiency"; value: CompetenciaApi }
  | { type: "choice"; value: "language_choices"; language_choices: ChoiceApi<IdiomaApi> }
  | { type: "choice"; value: "proficiencies_choices"; proficiencies_choices: ChoiceApi<CompetenciaApi>[] };

export interface AbilityBonusesMongo {
  index: string,
  bonus: number
}

export interface AbilityBonusesApi {
  index: string,
  name: string,
  bonus: number
}

export interface DañoApi {
  index: string,
  name: string,
  desc: string
}

export interface OptionsMongo {
  type: string,
  options: OptionsMongo[] | string[],
  api?: string,
  choose: number
}

export interface OptionsApi {
  options: ({ index: string; name: string; } | OptionsApi)[],
  choose: number,
  type: string,
  //spell?: any
}

export interface EquipamientoOpcionesApi {
  items: {
    index: String,
    quantity: Number
  }[],
  name: String
}

export interface PropiedadesArma {
  index: string,
  name: string,
  desc: string[],
}