import { CharacterAttributeApi } from "../domain/types/attribute.types";
import { TraitApi } from "../domain/types/traits.types";
import { evaluateFormula } from "./formulaEvaluator";

export function resolveTraitActions(
  traits: TraitApi[],
  attributes: CharacterAttributeApi[],
  proficiencyBonus: number
): TraitApi[] {
  return traits.map(trait => {
    const formula = trait.action?.saveDcFormula;
    if (!formula) return trait;

    const saveDc = evaluateFormula(formula, attributes, { proficiencyBonus });
    const withDc = (texts: string[]) => texts.map(text => text.replaceAll("{dc}", String(saveDc)));

    return {
      ...trait,
      description: withDc(trait.description ?? []),
      summary: withDc(trait.summary ?? []),
      action: {
        ...trait.action!,
        saveDc
      }
    };
  });
}
