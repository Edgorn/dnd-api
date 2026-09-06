import PersonajeService from "../../../domain/services/personaje.service";

export default class UpdateCharacterXp {
  constructor(private readonly personajeService: PersonajeService) {}

  execute(id: string, xp: number, userId: string): Promise<void> {
    return this.personajeService.updateXp(id, xp, userId);
  }
}
