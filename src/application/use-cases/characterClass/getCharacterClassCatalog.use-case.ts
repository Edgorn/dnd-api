import CharacterClassService from "../../../domain/services/characterClass.service";
import { CharacterClassCatalogItem } from "../../../domain/types/characterClass.types";

export default class GetCharacterClassCatalog {
  constructor(private readonly characterClassService: CharacterClassService) { }

  async execute(rulesets?: string[], includeMulticlass: boolean = false): Promise<CharacterClassCatalogItem[]> {
    if (!rulesets || rulesets.length === 0) {
      return [];
    }
    return this.characterClassService.getCatalog(rulesets, includeMulticlass);
  }
}
