import { Damage } from "../domain/types";
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
