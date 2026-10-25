import { formPurposeOverlaysCharacter } from "../domain/types/creatureForm.types";
import { CharacterApi } from "../domain/types/character.types";
import { CharacterAttributeApi } from "../domain/types/attribute.types";
import { Damage } from "../domain/types";
import { CreatureApi } from "../domain/types/creature.types";
import { evaluateFormula } from "./formulaEvaluator";

export function applyActiveFormOverlay(
  character: CharacterApi,
  options?: { initiativeBonusFormula?: string }
): CharacterApi {
  const activeId = character.activeFormId;
  if (!activeId) return character;

  const form = (character.forms ?? []).find(item => item.id === activeId);
  if (!form || !formPurposeOverlaysCharacter(form.purpose) || !form.creature) return character;

  const creature = form.creature;
  const attributes = overlayAttributes(character.attributes ?? [], creature);
  const initiativeBonus = options?.initiativeBonusFormula
    ? evaluateFormula(options.initiativeBonusFormula, attributes)
    : attributes.find(attribute => attribute.key === "dex")?.modifier ?? 0;

  return {
    ...character,
    size: creature.size,
    speed: creature.speed,
    ac: creature.CA,
    hpMax: creature.HPMax,
    hpCurrent: creature.HPMax,
    attributes,
    initiativeBonus,
    resistances: flattenDamageTypes(creature.damage_resistances),
    conditionImmunities: creature.condition_immunities?.length
      ? [{ name: creature.name, conditions: creature.condition_immunities }]
      : []
  };
}

function overlayAttributes(
  attributes: CharacterAttributeApi[],
  creature: CreatureApi
): CharacterAttributeApi[] {
  const byKey = new Map((creature.attributes ?? []).map(attribute => [attribute.key, attribute]));
  return attributes.map(attribute => {
    const overlay = byKey.get(attribute.key);
    if (!overlay) return attribute;
    return {
      ...attribute,
      value: overlay.value,
      modifier: overlay.modifier
    };
  });
}

function flattenDamageTypes(
  grants: CreatureApi["damage_resistances"] | undefined
): Damage[] {
  const result: Damage[] = [];
  const seen = new Set<string>();
  for (const grant of grants ?? []) {
    for (const damage of grant.damageTypes ?? []) {
      if (!damage.id || seen.has(damage.id)) continue;
      seen.add(damage.id);
      result.push(damage);
    }
  }
  return result;
}
