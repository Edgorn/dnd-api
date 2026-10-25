import CharacterService from "../../../domain/services/character.service";

export default class UpdateCharacterXp {
  constructor(private readonly characterService: CharacterService) {}

  execute(id: string, xp: number, userId: string): Promise<void> {
    return this.characterService.updateXp(id, xp, userId);
  }
}
