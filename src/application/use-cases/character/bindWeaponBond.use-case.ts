import CharacterService from "../../../domain/services/character.service";
import { CharacterApi, CharacterBasic, TypeBindWeaponBond } from "../../../domain/types/character.types";

export default class BindWeaponBond {
  constructor(private readonly characterService: CharacterService) { }

  execute(data: TypeBindWeaponBond): Promise<{ full: CharacterApi; basic: CharacterBasic }> {
    return this.characterService.bindWeaponBond(data);
  }
}
