import { PersonajeApi } from "../domain/types/personajes.types";
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
  character: Pick<PersonajeApi, "traits" | "activeTraitIds" | "equipment">
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

function applyWeaponDamageOverlays(
  equipment: CharacterEquipmentApi[],
  stances: TraitApi[],
  attributes: PersonajeApi["attributes"],
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
  character: PersonajeApi,
  rules: ActiveTraitOverlayRules
): PersonajeApi {
  const stances = activeUnsuppressedStances(character);
  if (!stances.length) return character;

  const groupKeys = new Set(stances.map(stanceGroupKey));
  const resistances = mergeConditionalResistancesFromGroups(
    character.traits ?? [],
    groupKeys,
    character.resistances ?? []
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
    equipment
  };
}
