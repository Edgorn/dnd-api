import { describe, expect, it } from "vitest";
import { Damage } from "../domain/types";
import { ConditionApi } from "../domain/types/condition.types";
import { aggregateConditionalConditionImmunities, aggregateConditionalResistances } from "./aggregateConditionalResistances";

const damage = (id: string, name: string): Damage => ({
  id,
  name,
  description: "",
  color: "",
  ruleset: "sys1"
});

const bludgeoning = damage("bludgeoning", "Contundente");
const piercing = damage("piercing", "Perforante");
const slashing = damage("slashing", "Cortante");
const fire = damage("fire", "Fuego");

describe("aggregateConditionalResistances", () => {
  it("returns one group for a single trait", () => {
    expect(aggregateConditionalResistances([{
      name: "Furia",
      conditional_resistances: [bludgeoning, piercing, slashing]
    }])).toEqual([{
      name: "Furia",
      resistances: [bludgeoning, piercing, slashing]
    }]);
  });

  it("keeps separate groups when names differ", () => {
    expect(aggregateConditionalResistances([
      { name: "Furia", conditional_resistances: [bludgeoning] },
      { name: "Piel de piedra", conditional_resistances: [fire] }
    ])).toEqual([
      { name: "Furia", resistances: [bludgeoning] },
      { name: "Piel de piedra", resistances: [fire] }
    ]);
  });

  it("unions resistances of the same group without duplicating ids", () => {
    expect(aggregateConditionalResistances([
      {
        name: "Furia",
        conditionalResistanceGroup: "Furia",
        conditional_resistances: [bludgeoning, piercing, slashing]
      },
      {
        name: "Espíritu tótem oso",
        conditionalResistanceGroup: "Furia",
        conditional_resistances: [slashing, fire]
      }
    ])).toEqual([{
      name: "Furia",
      resistances: [bludgeoning, piercing, slashing, fire]
    }]);
  });

  it("falls back to trait.name when the group is omitted", () => {
    expect(aggregateConditionalResistances([{
      name: "Resistencia dracónica",
      conditional_resistances: [fire]
    }])).toEqual([{
      name: "Resistencia dracónica",
      resistances: [fire]
    }]);
  });

  it("skips traits without conditional resistances", () => {
    expect(aggregateConditionalResistances([
      { name: "Defensa sin Armadura", conditional_resistances: [] },
      { name: "Furia", conditional_resistances: [bludgeoning] }
    ])).toEqual([{
      name: "Furia",
      resistances: [bludgeoning]
    }]);
  });
});

const condition = (id: string, name: string): ConditionApi => ({
  id,
  name,
  ruleset: "sys1"
});

const frightened = condition("frightened", "Asustado");
const charmed = condition("charmed", "Hechizado");

describe("aggregateConditionalConditionImmunities", () => {
  it("unions immunities of the same group without duplicating ids", () => {
    expect(aggregateConditionalConditionImmunities([
      {
        name: "Furia",
        conditionalResistanceGroup: "Furia",
        conditionalConditionImmunities: [frightened]
      },
      {
        name: "Furia Irracional",
        conditionalResistanceGroup: "Furia",
        conditionalConditionImmunities: [frightened, charmed]
      }
    ])).toEqual([{
      name: "Furia",
      estados: [frightened, charmed]
    }]);
  });

  it("skips traits without conditional immunities", () => {
    expect(aggregateConditionalConditionImmunities([
      { name: "Furia", conditionalConditionImmunities: [] },
      { name: "Furia Irracional", conditionalConditionImmunities: [charmed] }
    ])).toEqual([{
      name: "Furia Irracional",
      estados: [charmed]
    }]);
  });
});
