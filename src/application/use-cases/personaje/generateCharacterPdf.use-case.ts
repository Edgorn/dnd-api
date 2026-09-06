import PersonajeService from "../../../domain/services/personaje.service";
import IUserRepository from "../../../domain/repositories/IUserRepository";
import { ICharacterSheetPdfGenerator } from "../../../domain/ports/ICharacterSheetPdfGenerator";

export default class GenerateCharacterPdf {
  constructor(
    private readonly personajeService: PersonajeService,
    private readonly userRepository: IUserRepository,
    private readonly pdfGenerator: ICharacterSheetPdfGenerator
  ) {}

  async execute(idCharacter: string, userId: string): Promise<Uint8Array> {
    const character = await this.personajeService.consultarPersonaje(idCharacter, userId);
    const playerName = await this.userRepository.getUserName(userId);
    return this.pdfGenerator.generate(character, playerName);
  }
}
