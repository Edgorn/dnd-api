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

export interface EquipamientoMongo {
  index: string,
  quantity: number
}

export interface EquipamientoApi {
  index: string,
  name: string,
  quantity: number,
  content: {
    name: string,
    quantity: number,
    item?: string
  }[],
  equipped?: boolean,
  category?: string,
  weapon?: {
    damage: {
      name: string,
      type: string
    },
    two_handed_damage: {
      name: string,
      type: string
    },
    properties: (string | any)[]
  }
  armor?: {
    category: string,
    class: {
      base: number,
      dex_bonus: number,
      max_bonus: number
    }
  },
  isMagic?: boolean,
}

export interface EquipamientoOpcionesMongo {
  items: {
    index: String,
    quantity: Number
  }[],
  api: String,
  quantity: number
}

export interface EquipamientoOpcionesApi {
  items: {
    index: String,
    quantity: Number
  }[],
  name: String
}