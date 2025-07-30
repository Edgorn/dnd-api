import { RasgoApi } from "."

export interface TraitsOptionsMongo {
  name: string,
  options: string[]
}

export interface TraitsOptionsApi {
  name: string,
  options: RasgoApi[]
}