export interface LogearUsuarioParams {
  user: string;
  password: string;
}

export interface LogearUsuarioResult {
  token: string;
  user: {
    name: string;
  };
}

export interface AbilityBonusesMongo {
  index: string,
  bonus: number
}

export interface AbilityBonusesApi {
  index: string,
  name: string,
  bonus: number
}

export interface IdiomaApi {
  index: string,
  name: string
}

export interface RasgoMongo {
  index: string,
  name: string,
  desc: string[],
  discard?: string[],
  type?: string,
  languages?: string[],
  spells?: any[],
  skills?: string[],
  proficiencies?: string[],
  proficiencies_weapon?: string[],
  proficiencies_armor?: string[],
  speed?: number,
  hidden?: boolean,
  tables?: {
    title: string,
    data: {
      titles: string[],
      rows: string[][]
    }
  }[]
}

export interface RasgoApi {
  index: string,
  name: string,
  desc: string,
  discard?: string[],
  skills?: string[],
  languages?: any[],
  hidden?: boolean,
  tables?: {
    title: string,
    data: {
      titles: string[],
      rows: string[][]
    }
  }[]
}

export interface DañoApi {
  index: string,
  name: string
}

export interface ConjuroMongo {
  index: string,
  name: string,
  level: number,
  classes: string[],
  school: string,
  casting_time: string,
  range: string,
  components: string[],
  duration: string,
  desc: string[],
  ritual: boolean 
}

export interface ConjuroApi {
  index: string,
  name: string,
  type: string,
  typeName: string,
  school: string,
  casting_time: string,
  range: string,
  components: string[],
  duration: string,
  desc: string[],
  ritual: boolean
}

export interface ProficienciesMongo {
  index: string,
  type: string
}

export interface ProficienciesApi {
  index: string,
  name: string,
  type: string
}

export interface HabilidadApi {
  index: string,
  name: string,
  ability_score: string
}

export interface CompetenciaApi {
  index: string,
  name: string,
  type: string,
  desc: [string]
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
