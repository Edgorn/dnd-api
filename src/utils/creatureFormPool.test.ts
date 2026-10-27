import { describe, expect, it } from "vitest";
import {
  creatureMatchesAnyFormPool,
  creatureMatchesFormPool,
  formPoolsForSpell,
  overlaySpellCreatureForm
} from "./creatureFormPool";

const owl = {
  id: "owl",
  creatureTypeId: "beast",
  challenge_rating: 0,
  size: "Tiny",
  tags: ["familiar"]
};

const wolf = {
  id: "wolf",
  creatureTypeId: "beast",
  challenge_rating: 0.25,
  size: "Medium",
  tags: []
};

const goblin = {
  id: "goblin",
  creatureType: { id: "humanoid" },
  challenge_rating: 0.25,
  size: "Small",
  tags: ["goblinoid"]
};

describe("creatureMatchesFormPool", () => {
  it("acepta un id de la lista", () => {
    expect(creatureMatchesFormPool({ mode: "ids", creatureIds: ["owl", "cat"] }, owl)).toBe(true);
  });

  it("rechaza un id que no está en la lista", () => {
    expect(creatureMatchesFormPool({ mode: "ids", creatureIds: ["owl", "cat"] }, wolf)).toBe(false);
  });

  it("acepta ids hidratados como creatures", () => {
    expect(creatureMatchesFormPool({
      mode: "ids",
      creatureIds: [],
      creatures: [{ id: "owl" } as never]
    }, owl)).toBe(true);
  });

  it("filtra por tipo de criatura y CR", () => {
    const pool = { mode: "filter" as const, creatureTypeIds: ["beast"], maxCR: 0 };
    expect(creatureMatchesFormPool(pool, owl)).toBe(true);
    expect(creatureMatchesFormPool(pool, wolf)).toBe(false);
    expect(creatureMatchesFormPool(pool, goblin)).toBe(false);
  });

  it("filtra por tamaño y tags (AND)", () => {
    const pool = { mode: "filter" as const, sizes: ["Tiny"], tags: ["familiar"] };
    expect(creatureMatchesFormPool(pool, owl)).toBe(true);
    expect(creatureMatchesFormPool(pool, { ...owl, tags: [] })).toBe(false);
    expect(creatureMatchesFormPool(pool, wolf)).toBe(false);
  });

  it("compara tamaños normalizados", () => {
    const pool = { mode: "filter" as const, sizes: ["Tiny"] };
    expect(creatureMatchesFormPool(pool, { ...owl, size: "tiny" })).toBe(true);
    expect(creatureMatchesFormPool(pool, { ...owl, size: "Diminuto" })).toBe(true);
    expect(creatureMatchesFormPool(pool, { ...owl, size: "Medium" })).toBe(false);
  });

  it("usa creatureType.id si no hay creatureTypeId", () => {
    expect(creatureMatchesFormPool(
      { mode: "filter", creatureTypeIds: ["humanoid"] },
      goblin
    )).toBe(true);
  });

  it("acepta cualquier criatura si el filtro no tiene criterios", () => {
    const pool = { mode: "filter" as const };
    expect(creatureMatchesFormPool(pool, owl)).toBe(true);
    expect(creatureMatchesFormPool(pool, wolf)).toBe(true);
    expect(creatureMatchesFormPool(pool, goblin)).toBe(true);
  });
});

describe("formPoolsForSpell", () => {
  const spell = {
    id: "find-familiar",
    creatureForm: { pool: { mode: "ids" as const, creatureIds: ["owl"] } }
  };
  const imp = { ...owl, id: "imp" };

  it("acepta la lechuza por el pool del conjuro", () => {
    const pools = formPoolsForSpell(spell, []);
    expect(creatureMatchesAnyFormPool(pools, owl)).toBe(true);
  });

  it("acepta el diablillo solo con la extensión del rasgo", () => {
    const withoutTrait = formPoolsForSpell(spell, []);
    expect(creatureMatchesAnyFormPool(withoutTrait, imp)).toBe(false);

    const withTrait = formPoolsForSpell(spell, [{
      creatureFormExtensions: [{
        spellId: "find-familiar",
        extraPool: { mode: "ids", creatureIds: ["imp"] }
      }]
    }]);
    expect(creatureMatchesAnyFormPool(withTrait, imp)).toBe(true);
    expect(creatureMatchesAnyFormPool(withTrait, owl)).toBe(true);
  });
});

describe("overlaySpellCreatureForm", () => {
  it("concatenates ids pools", () => {
    const form = {
      purpose: "companion" as const,
      choose: 1,
      replaceOnRecast: true,
      pool: {
        mode: "ids" as const,
        creatureIds: ["owl"],
        creatures: [{ id: "owl", name: "Lechuza" } as never]
      }
    };
    const overlay = overlaySpellCreatureForm(form, [{
      mode: "ids",
      creatureIds: ["imp"],
      creatures: [{ id: "imp", name: "Diablillo" } as never]
    }]);
    expect(overlay?.pool).toEqual({
      mode: "ids",
      creatureIds: ["owl", "imp"],
      creatures: [
        { id: "owl", name: "Lechuza" },
        { id: "imp", name: "Diablillo" }
      ]
    });
  });

  it("keeps extraPools when mixing filter and ids", () => {
    const form = {
      purpose: "self" as const,
      choose: 1,
      replaceOnRecast: true,
      pool: { mode: "filter" as const, maxCR: 1 }
    };
    const extra = { mode: "ids" as const, creatureIds: ["imp"], creatures: [] };
    const overlay = overlaySpellCreatureForm(form, [extra]);
    expect(overlay?.pool).toEqual(form.pool);
    expect(overlay?.extraPools).toEqual([extra]);
  });
});
