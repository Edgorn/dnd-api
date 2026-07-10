import { ChoiceMongo, ChoiceApi } from "../types";
import { AttributeApi, InputCreateAttribute, InputUpdateAttribute, AttributeBonus, AttributeBonusCreate, CharacterAttributeApi } from "../types/attribute.types";

export default interface IAttributeRepository {
  create(data: InputCreateAttribute): Promise<AttributeApi>;
  update(data: InputUpdateAttribute): Promise<AttributeApi>;
  getBySystems(rulesets: string[]): Promise<AttributeApi[]>;
  formatAbilityBonuses(
    bonuses: AttributeBonusCreate[], 
    system: string
  ): Promise<AttributeBonus[]>;
  formatAbilityBonusChoices(
    bonus_choices: ChoiceMongo | undefined, 
    system: string
  ): Promise<ChoiceApi<AttributeBonus> | undefined>;
  getById(id: string): Promise<AttributeApi | null>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  softDeleteByRuleset(ruleset: string, deletedAt: Date): Promise<void>;
  restoreByRuleset(ruleset: string, deletedAt: Date): Promise<void>;
}
