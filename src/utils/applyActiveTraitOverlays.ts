import { CharacterApi } from "../domain/types/character.types";
import { CharacterEquipmentApi } from "../domain/types/equipment.types";
import { TraitApi } from "../domain/types/traits.types";
import { SystemRulesConfig } from "../domain/types/system.types";
import { Damage } from "../domain/types";
import {
  collectEquippedArmorSuppression,
  isTraitSuppressedByArmor
} from "./armorRules";
import { isRangedWeapon, resolveWeaponAttributeStats } from "./weaponAttackAttributes";

export type ActiveTraitOverlayRules = Pick<
  SystemRulesConfig,
  "meleeAttackAttributes" | "rangedAttackAttributes"
>;

function stanceGroupKey(trait: Pick<TraitApi, "name" | "conditionalResistanceGroup">): string {
  return trait.conditionalResistanceGroup || trait.name;
}

export function activeUnsuppressedStances(
  character: Pick<CharacterApi, "traits" | "activeTraitIds" | "equipment">
): TraitApi[] {
  const equipped = collectEquippedArmorSuppression(character.equipment ?? []);
  const activeIds = new Set(character.activeTraitIds ?? []);

  return (character.traits ?? []).filter(trait => {
    if (!trait.id || (trait.action?.kind ?? "instant") !== "stance") return false;
    const isActive = trait.action?.active === true || activeIds.has(trait.id);
    if (!isActive) return false;
    return !isTraitSuppressedByArmor(trait, equipped);
  });
}

function mergeConditionalResistancesFromGroups(
  traits: TraitApi[],
  groupKeys: Set<string>,
  current: Damage[]
): Damage[] {
  const next = [...current];
  for (const trait of traits) {
    if (!groupKeys.has(stanceGroupKey(trait))) continue;
    for (const damage of trait.conditional_resistances ?? []) {
      if (damage.id && next.some(item => item.id === damage.id)) continue;
      next.push(damage);
    }
  }
  return next;
}

function mergeConditionalConditionImmunitiesFromGroups(
  traits: TraitApi[],
  groupKeys: Set<string>,
  current: CharacterApi["conditionImmunities"]
): CharacterApi["conditionImmunities"] {
  const next = current.map(group => ({ name: group.name, conditions: [...group.conditions] }));
  for (const trait of traits) {
    if (!groupKeys.has(stanceGroupKey(trait))) continue;
    const list = trait.conditionalConditionImmunities ?? [];
    if (!list.length) continue;
    const name = stanceGroupKey(trait);
    let group = next.find(item => item.name === name);
    if (!group) {
      group = { name, conditions: [] };
      next.push(group);
    }
    for (const condition of list) {
      if (condition.id && group.conditions.some(item => item.id === condition.id)) continue;
      group.conditions.push(condition);
    }
  }
  return next;
}

function applyWeaponDamageOverlays(
  equipment: CharacterEquipmentApi[],
  stances: TraitApi[],
  attributes: CharacterApi["attributes"],
  rules: ActiveTraitOverlayRules
): CharacterEquipmentApi[] {
  const bonuses = stances
    .map(trait => trait.weaponDamageBonus)
    .filter((bonus): bonus is NonNullable<TraitApi["weaponDamageBonus"]> =>
      Boolean(bonus && bonus.when === "active" && typeof bonus.amount === "number")
    );

  if (!bonuses.length) return equipment;

  return equipment.map(item => {
    if (!item.weapon) return item;
    let extra = 0;
    for (const bonus of bonuses) {
      if (bonus.melee && isRangedWeapon(item.weapon)) continue;
      const stats = resolveWeaponAttributeStats(item.weapon, rules, attributes);
      if (bonus.abilityKeys?.length) {
        if (!stats.attributeKey || !bonus.abilityKeys.includes(stats.attributeKey)) continue;
      }
      extra += bonus.amount ?? 0;
    }
    if (extra === 0) return item;
    return {
      ...item,
      damageBonus: (item.damageBonus ?? 0) + extra
    };
  });
}

export function applyActiveTraitOverlays(
  character: CharacterApi,
  rules: ActiveTraitOverlayRules
): CharacterApi {
  const stances = activeUnsuppressedStances(character);
  if (!stances.length) return character;

  const groupKeys = new Set(stances.map(stanceGroupKey));
  const resistances = mergeConditionalResistancesFromGroups(
    character.traits ?? [],
    groupKeys,
    character.resistances ?? []
  );
  const conditionImmunities = mergeConditionalConditionImmunitiesFromGroups(
    character.traits ?? [],
    groupKeys,
    character.conditionImmunities ?? []
  );
  const equipment = applyWeaponDamageOverlays(
    character.equipment ?? [],
    stances,
    character.attributes ?? [],
    rules
  );

  return {
    ...character,
    resistances,
    conditionImmunities,
    equipment
  };
}
