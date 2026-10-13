import { Damage } from "../domain/types";
import { ConditionApi } from "../domain/types/condition.types";
import { TraitApi } from "../domain/types/traits.types";

export type ConditionalResistanceGroup = {
  name: string;
  resistances: Damage[];
};

type TraitConditionalResistanceSource = Pick<
  TraitApi,
  "name" | "conditional_resistances" | "conditionalResistanceGroup"
>;

export function aggregateConditionalResistances(
  traits: TraitConditionalResistanceSource[]
): ConditionalResistanceGroup[] {
  const groups: ConditionalResistanceGroup[] = [];

  for (const trait of traits) {
    const list = trait.conditional_resistances ?? [];
    if (list.length === 0) continue;

    const name = trait.conditionalResistanceGroup || trait.name;
    let group = groups.find(item => item.name === name);
    if (!group) {
      group = { name, resistances: [] };
      groups.push(group);
    }

    for (const damage of list) {
      if (damage.id && group.resistances.some(item => item.id === damage.id)) continue;
      group.resistances.push(damage);
    }
  }

  return groups;
}

export type ConditionalConditionImmunityGroup = {
  name: string;
  estados: ConditionApi[];
};

type TraitConditionalConditionImmunitySource = Pick<
  TraitApi,
  "name" | "conditionalConditionImmunities" | "conditionalResistanceGroup"
>;

export function aggregateConditionalConditionImmunities(
  traits: TraitConditionalConditionImmunitySource[]
): ConditionalConditionImmunityGroup[] {
  const groups: ConditionalConditionImmunityGroup[] = [];

  for (const trait of traits) {
    const list = trait.conditionalConditionImmunities ?? [];
    if (list.length === 0) continue;

    const name = trait.conditionalResistanceGroup || trait.name;
    let group = groups.find(item => item.name === name);
    if (!group) {
      group = { name, estados: [] };
      groups.push(group);
    }

    for (const condition of list) {
      if (condition.id && group.estados.some(item => item.id === condition.id)) continue;
      group.estados.push(condition);
    }
  }

  return groups;
}
