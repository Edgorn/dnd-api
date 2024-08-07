export interface LogearUsuarioParams {
  user: string;
  password: string;
}

export interface LogearUsuarioResult {
  token: any;
  user: {
    name: any;
  };
}

export interface RazaMongo {
  index: string,
  name: string,
  desc: string,
  speed: string,
  size: string,
  subraces: SubrazaMongo[]
  ability_bonuses: AbilityBonusesMongo[]
}

export interface SubrazaMongo {
  index: string,
  name: string,
  desc: string,
  speed: string,
  ability_bonuses: AbilityBonusesMongo[]
}

export interface RazaApi {
  index: string,
  name: string,
  desc: string,
  speed: string,
  size: string,
  subraces: SubrazaApi[],
  ability_bonuses: AbilityBonusesApi[]
}

export interface SubrazaApi {
  index: string,
  name: string,
  desc: string,
  speed: string,
  ability_bonuses: AbilityBonusesApi[]
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
