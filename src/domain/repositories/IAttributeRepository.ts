import { ChoiceMongo, ChoiceApi } from "../types";
import { AttributeApi, InputCreateAttribute, InputUpdateAttribute, AttributeBonus, AttributeBonusCreate, CharacterAttributeApi } from "../types/attribute.types";

export default interface IAttributeRepository {
  create(data: InputCreateAttribute): Promise<AttributeApi>;
  update(data: InputUpdateAttribute): Promise<AttributeApi>;
  addSystem(attributeId: string, systemId: string): Promise<AttributeApi>;
  removeSystem(attributeId: string, systemId: string): Promise<AttributeApi>;
  getBySystems(rulesets: string[]): Promise<AttributeApi[]>;
  formatAbilityBonuses(
    bonuses: AttributeBonusCreate[] | AttributeBonus[], 
    system: string
  ): Promise<AttributeBonus[]>;
  formatAbilityBonusChoices(
    bonus_choices: ChoiceMongo | undefined, 
    system: string
  ): Promise<ChoiceApi<AttributeBonus> | undefined>;
}
