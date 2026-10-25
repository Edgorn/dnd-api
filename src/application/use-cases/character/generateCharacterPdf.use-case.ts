import CharacterService from "../../../domain/services/character.service";
import IUserRepository from "../../../domain/repositories/IUserRepository";
import { ICharacterSheetPdfGenerator } from "../../../domain/ports/ICharacterSheetPdfGenerator";
import { NotFoundError } from "../../../domain/errors/AppError";

export default class GenerateCharacterPdf {
  constructor(
    private readonly characterService: CharacterService,
    private readonly userRepository: IUserRepository,
    private readonly pdfGenerator: ICharacterSheetPdfGenerator
  ) {}

  async execute(idCharacter: string, userId: string): Promise<Uint8Array> {
    const character = await this.characterService.getById(idCharacter, userId, {
      applyActiveTraits: false
    });
    const link = await this.characterService.getCampaignLink(idCharacter);
    if (!link) {
      throw new NotFoundError("Personaje no encontrado");
    }
    const playerName = await this.userRepository.getUserName(link.userId);
    return this.pdfGenerator.generate(character, playerName);
  }
}
