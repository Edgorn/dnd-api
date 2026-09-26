import PersonajeService from "../../../domain/services/personaje.service";
import IUserRepository from "../../../domain/repositories/IUserRepository";
import { ICharacterSheetPdfGenerator } from "../../../domain/ports/ICharacterSheetPdfGenerator";
import { NotFoundError } from "../../../domain/errors/AppError";

export default class GenerateCharacterPdf {
  constructor(
    private readonly personajeService: PersonajeService,
    private readonly userRepository: IUserRepository,
    private readonly pdfGenerator: ICharacterSheetPdfGenerator
  ) {}

  async execute(idCharacter: string, userId: string): Promise<Uint8Array> {
    const character = await this.personajeService.consultarPersonaje(idCharacter, userId);
    const link = await this.personajeService.getCampaignLink(idCharacter);
    if (!link) {
      throw new NotFoundError("Personaje no encontrado");
    }
    const playerName = await this.userRepository.getUserName(link.userId);
    return this.pdfGenerator.generate(character, playerName);
  }
}
