export interface Coin {
  name: string;
  abbreviation: string;
  isBase: boolean;
  multiplier: number;
  weight: number;
  color: string;
}

export interface InputCreateCoin {
  ruleset: string;
  name: string;
  abbreviation: string;
  isBase?: boolean;
  multiplier: number;
  weight: number;
  color: string;
}

export interface InputUpdateCoin {
  id: string;
  ruleset?: string;
  name?: string;
  abbreviation?: string;
  isBase?: boolean;
  multiplier?: number;
  weight?: number;
  color?: string;
}

export interface CoinMongo {
  _id?: any;
  ruleset: string;
  name: string;
  abbreviation: string;
  isBase: boolean;
  multiplier: number;
  weight: number;
  color?: string;
  deletedAt?: Date | null;
}

export interface CoinApi {
  id: string;
  ruleset: string;
  name: string;
  abbreviation: string;
  isBase: boolean;
  multiplier: number;
  weight: number;
  color: string;
  deletedAt?: Date | null;
}
