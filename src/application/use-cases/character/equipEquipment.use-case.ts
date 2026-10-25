import CharacterService from "../../../domain/services/character.service";
import { CharacterApi, CharacterBasic, TypeEquipEquipment } from "../../../domain/types/character.types";

export default class EquipEquipment {
  constructor(private readonly characterService: CharacterService) { }

  execute(data: TypeEquipEquipment): Promise<{ full: CharacterApi; basic: CharacterBasic }> {
    return this.characterService.equipEquipment(data);
  }
}
