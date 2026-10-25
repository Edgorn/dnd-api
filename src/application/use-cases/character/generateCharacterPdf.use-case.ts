import CharacterService from "../../../domain/services/character.service";
import IUserRepository from "../../../domain/repositories/IUserRepository";
import { ICharacterSheetPdfGenerator } from "../../../domain/ports/ICharacterSheetPdfGenerator";

export default class GenerateCharacterPdf {
  constructor(
    private readonly characterService: CharacterService,
    private readonly userRepository: IUserRepository,
    private readonly pdfGenerator: ICharacterSheetPdfGenerator
  ) {}

  async execute(idCharacter: string, userId: string): Promise<Uint8Array> {
    const { character, ownerId } = await this.characterService.getByIdForExport(idCharacter, userId, {
      applyActiveTraits: false
    });
    const playerName = await this.userRepository.getUserName(ownerId);
    return this.pdfGenerator.generate(character, playerName);
  }
}
