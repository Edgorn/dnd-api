import { PersonajeApi } from "../types/personajes.types";

export interface ICharacterSheetPdfGenerator {
  generate(character: PersonajeApi, playerName: string): Promise<Uint8Array>;
}
