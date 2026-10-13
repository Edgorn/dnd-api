import { CharacterAttributeApi } from "../domain/types/attribute.types";
import { TraitApi } from "../domain/types/traits.types";
import { evaluateFormula } from "./formulaEvaluator";
import {
  resolveActionRemaining,
  resolveActionUses,
  resolveWeaponDamageAmount
} from "./traitProgression";

export interface ResolveTraitActionsContext {
  grantingClassLevelByTraitId?: ReadonlyMap<string, number>;
  spentByTraitId?: ReadonlyMap<string, number>;
  activeTraitIds?: ReadonlySet<string>;
}

export function resolveTraitActions(
  traits: TraitApi[],
  attributes: CharacterAttributeApi[],
  proficiencyBonus: number,
  context: ResolveTraitActionsContext = {}
): TraitApi[] {
  return traits.map(trait => {
    const classLevel = trait.id ? context.grantingClassLevelByTraitId?.get(trait.id) : undefined;
    const spent = trait.id ? context.spentByTraitId?.get(trait.id) ?? 0 : 0;
    let next = trait;

    if (trait.action) {
      const uses = resolveActionUses(trait.action, classLevel);
      const remaining = resolveActionRemaining(uses, spent);
      const kind = trait.action.kind ?? "instant";
      const active = kind === "stance" && !!trait.id && (context.activeTraitIds?.has(trait.id) ?? false);

      next = {
        ...next,
        action: {
          ...trait.action,
          ...(uses !== undefined ? { uses } : {}),
          ...(remaining !== undefined ? { remaining } : {}),
          ...(kind === "stance" ? { active } : {})
        }
      };
    }

    if (trait.weaponDamageBonus) {
      const amount = resolveWeaponDamageAmount(trait.weaponDamageBonus, classLevel);
      if (amount !== undefined) {
        next = {
          ...next,
          weaponDamageBonus: {
            ...trait.weaponDamageBonus,
            amount
          }
        };
      }
    }

    const formula = next.action?.saveDcFormula;
    if (!formula) return next;

    const saveDc = evaluateFormula(formula, attributes, { proficiencyBonus });
    const withDc = (texts: string[]) => texts.map(text => text.replaceAll("{dc}", String(saveDc)));

    return {
      ...next,
      description: withDc(next.description ?? []),
      summary: withDc(next.summary ?? []),
      action: {
        ...next.action!,
        saveDc
      }
    };
  });
}
