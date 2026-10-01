import { describe, expect, it } from "vitest";
import { Damage } from "../domain/types/damage.types";
import {
  collectDamageTypeIdsFromAffinities,
  damageAffinityFieldNeedsWrite,
  hydrateDamageAffinities,
  normalizeDamageAffinityList
} from "./damageAffinity";

const cold: Damage = {
  id: "cold",
  name: "Frío",
  description: "",
  color: "#00f",
  ruleset: "sys1"
};
const bludgeoning: Damage = {
  id: "bludgeoning",
  name: "Contundente",
  description: "",
  color: "#888",
  ruleset: "sys1"
};
const piercing: Damage = {
  id: "piercing",
  name: "Perforante",
  description: "",
  color: "#888",
  ruleset: "sys1"
};
const slashing: Damage = {
  id: "slashing",
  name: "Cortante",
  description: "",
  color: "#888",
  ruleset: "sys1"
};

const damageById = new Map<string, Damage>([
  ["cold", cold],
  ["bludgeoning", bludgeoning],
  ["piercing", piercing],
  ["slashing", slashing]
]);

describe("normalizeDamageAffinityList", () => {
  it("convierte cada id legado en un grant y no fusiona", () => {
    expect(normalizeDamageAffinityList(["cold", "fire"])).toEqual([
      { damageTypeIds: ["cold"], source: "any", bypass: [] },
      { damageTypeIds: ["fire"], source: "any", bypass: [] }
    ]);
  });

  it("deja vacía una lista vacía y trata un valor que no es array como []", () => {
    expect(normalizeDamageAffinityList([])).toEqual([]);
    expect(normalizeDamageAffinityList(undefined)).toEqual([]);
    expect(normalizeDamageAffinityList("cold")).toEqual([]);
  });

  it("rellena source y bypass en objetos ya migrados y descarta ids vacíos", () => {
    expect(normalizeDamageAffinityList([
      { damageTypeIds: ["cold", ""] },
      { damageTypeIds: [], source: "any" },
      {
        damageTypeIds: ["bludgeoning", "piercing", "slashing"],
        source: "nonmagical_attacks",
        bypass: ["silvered"]
      }
    ])).toEqual([
      { damageTypeIds: ["cold"], source: "any", bypass: [] },
      {
        damageTypeIds: ["bludgeoning", "piercing", "slashing"],
        source: "nonmagical_attacks",
        bypass: ["silvered"]
      }
    ]);
  });

  it("ignora bypass si la fuente no es ataques no mágicos", () => {
    expect(normalizeDamageAffinityList([{
      damageTypeIds: ["cold"],
      source: "any",
      bypass: ["adamantine"]
    }])).toEqual([{ damageTypeIds: ["cold"], source: "any", bypass: [] }]);
  });
});

describe("collectDamageTypeIdsFromAffinities", () => {
  it("recoge ids de listas legado y de grants", () => {
    expect(collectDamageTypeIdsFromAffinities(
      ["cold"],
      [{ damageTypeIds: ["bludgeoning", "piercing"], source: "nonmagical_attacks", bypass: [] }]
    )).toEqual(["cold", "bludgeoning", "piercing"]);
  });
});

describe("hydrateDamageAffinities", () => {
  it("hidrata el diablo: frío incondicional y C/C/P no mágico con plateado", () => {
    expect(hydrateDamageAffinities([
      { damageTypeIds: ["cold"] },
      {
        damageTypeIds: ["bludgeoning", "piercing", "slashing"],
        source: "nonmagical_attacks",
        bypass: ["silvered"]
      }
    ], damageById)).toEqual([
      { damageTypes: [cold], source: "any", bypass: [] },
      {
        damageTypes: [bludgeoning, piercing, slashing],
        source: "nonmagical_attacks",
        bypass: ["silvered"]
      }
    ]);
  });

  it("omite tipos ausentes y grants sin ningún tipo hidratado", () => {
    expect(hydrateDamageAffinities(
      ["missing", "cold", { damageTypeIds: ["ghost"] }],
      damageById
    )).toEqual([
      { damageTypes: [cold], source: "any", bypass: [] }
    ]);
  });
});

describe("damageAffinityFieldNeedsWrite", () => {
  it("no escribe listas canónicas ni campos ausentes vacíos", () => {
    const canonical = [{ damageTypeIds: ["cold"], source: "any" as const, bypass: [] }];
    expect(damageAffinityFieldNeedsWrite(canonical, canonical)).toBe(false);
    expect(damageAffinityFieldNeedsWrite(undefined, [])).toBe(false);
    expect(damageAffinityFieldNeedsWrite(null, [])).toBe(false);
  });

  it("escribe ids legado, objetos incompletos y valores que no son array", () => {
    const next = [{ damageTypeIds: ["cold"], source: "any" as const, bypass: [] }];
    expect(damageAffinityFieldNeedsWrite(["cold"], next)).toBe(true);
    expect(damageAffinityFieldNeedsWrite([{ damageTypeIds: ["cold"] }], next)).toBe(true);
    expect(damageAffinityFieldNeedsWrite("cold", [])).toBe(true);
  });
});
