import CharacterService from "../../../domain/services/character.service";
import { CharacterEquipmentStateResponse, TypeBindWeaponBond } from "../../../domain/types/character.types";

export default class BindWeaponBond {
  constructor(private readonly characterService: CharacterService) { }

  execute(data: TypeBindWeaponBond): Promise<CharacterEquipmentStateResponse> {
    return this.characterService.bindWeaponBond(data);
  }
}
