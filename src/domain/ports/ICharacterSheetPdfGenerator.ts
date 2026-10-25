import { CharacterApi } from "../types/character.types";

export interface ICharacterSheetPdfGenerator {
  generate(character: CharacterApi, playerName: string): Promise<Uint8Array>;
}
