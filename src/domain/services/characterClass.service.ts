import ICharacterClassRepository from "../repositories/ICharacterClassRepository";
import { CharacterClassApi, InputCreateCharacterClass, InputUpdateCharacterClass } from "../types/characterClass.types";

export default class CharacterClassService {
  constructor(private readonly characterClassRepository: ICharacterClassRepository) { }

  getBySystems(rulesets: string[]): Promise<CharacterClassApi[]> {
    return this.characterClassRepository.getBySystems(rulesets);
  }

  getById(id: string): Promise<CharacterClassApi | null> {
    return this.characterClassRepository.getById(id);
  }

  create(data: InputCreateCharacterClass): Promise<CharacterClassApi> {
    return this.characterClassRepository.create(data);
  }

  update(data: InputUpdateCharacterClass): Promise<CharacterClassApi> {
    return this.characterClassRepository.update(data);
  }

  softDelete(id: string): Promise<void> {
    return this.characterClassRepository.softDelete(id);
  }

  restore(id: string): Promise<void> {
    return this.characterClassRepository.restore(id);
  }
}
