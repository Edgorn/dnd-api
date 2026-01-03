import { ConjuroApi } from "./conjuros.types"

export interface InvocacionMongo {
  index: string,
  name: string,
  desc: string[],
  spells: string[],
  skills: string[],
  requirements: {
    level: number,
    spells: string[],
    traits: string[]
  }
}

export interface InvocacionApi {
  index: string,
  name: string,
  desc: string[],
  spells: ConjuroApi[],
  skills: string[],
  requirements: {
    level: number,
    spells: {
      index: string,
      name: string
    }[],
    traits: {
      index: string,
      name: string
    }[]
  }
}