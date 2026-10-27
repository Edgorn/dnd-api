import { CharacterAttributeApi } from "../domain/types/attribute.types";
import { SystemRulesConfig } from "../domain/types/system.types";
import { evaluateFormula } from "./formulaEvaluator";

type DrawRules = Pick<SystemRulesConfig, "drawCapacityMultiplier"> | null | undefined;

export function characterCarryingCapacity(
  attributes: CharacterAttributeApi[],
  formula?: string | null
): number | null {
  if (!formula) return null;
  return evaluateFormula(formula, attributes);
}

export function drawCapacity(
  capacities: number[],
  rules?: DrawRules
): number | null {
  if (rules?.drawCapacityMultiplier === undefined) return null;
  const total = capacities.reduce((sum, value) => sum + value, 0);
  return total * rules.drawCapacityMultiplier;
}
