import { SpellApi } from "./spell.types"

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
  description: string[],
  summary: string[],
  spells: SpellApi[],
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