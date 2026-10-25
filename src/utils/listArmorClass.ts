import { CharacterAttributeApi } from "../domain/types/attribute.types";
import { ArmorClassEquipmentInput } from "../domain/types/equipment.types";
import { SystemRulesConfig } from "../domain/types/system.types";
import { TraitArmorClassInput } from "../domain/types/traits.types";
import { applyTraitAbilityScores } from "./applyTraitAbilityScores";
import { computeArmorClass } from "./armorRules";
import { evaluateAttributeModifier, evaluateFormula } from "./formulaEvaluator";

export interface ListArmorClassInput {
  attributes: { key: string; value: number }[];
  traits: TraitArmorClassInput[];
  equipment: ArmorClassEquipmentInput[];
  globalModifierFormula?: string;
  baseAcFormula?: string;
}

export interface ListArmorClassResult {
  ac: number;
  attributes: { key: string; value: number }[];
}

function attributeModifier(value: number, formula?: string): number {
  if (formula) {
    return evaluateAttributeModifier(formula, value) ?? Math.floor((value / 2) - 5);
  }
  return Math.floor((value / 2) - 5);
}

export function listArmorClass(input: ListArmorClassInput): ListArmorClassResult {
  const overlay = applyTraitAbilityScores(input.attributes, input.traits);
  const attributes: CharacterAttributeApi[] = overlay.attributes.map(attribute => ({
    id: attribute.key,
    name: attribute.key,
    key: attribute.key,
    value: attribute.value,
    modifier: attributeModifier(attribute.value, input.globalModifierFormula)
  }));

  let baseUnarmoredAc: number;
  if (input.baseAcFormula) {
    baseUnarmoredAc = evaluateFormula(input.baseAcFormula, attributes);
  } else {
    const dexAttr = attributes.find(attribute => attribute.key === "dex");
    baseUnarmoredAc = 10 + (dexAttr?.modifier ?? 0);
  }

  return {
    ac: computeArmorClass({
      equipment: input.equipment,
      traits: input.traits,
      attributes,
      baseUnarmoredAc
    }),
    attributes: overlay.attributes
  };
}

export function storedAcNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function listArmorClassFromRules(
  input: Omit<ListArmorClassInput, "globalModifierFormula" | "baseAcFormula"> & {
    rulesConfig?: Pick<SystemRulesConfig, "globalModifierFormula" | "baseAcFormula">;
  }
): ListArmorClassResult {
  return listArmorClass({
    ...input,
    globalModifierFormula: input.rulesConfig?.globalModifierFormula,
    baseAcFormula: input.rulesConfig?.baseAcFormula
  });
}
