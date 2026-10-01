import { describe, expect, it } from "vitest";
import { Types } from "mongoose";
import { AttributeApi } from "../../../../domain/types/attribute.types";
import { CREATURE_ANY_RACE, CreatureInnateSpellcasting } from "../../../../domain/types/creature.types";
import { SpellApi } from "../../../../domain/types/spell.types";
import {
  collectDamageIds,
  creatureObjectIds,
  formatStoredCreatureRace,
  hydrateInnateSpellcasting,
  hydrateSpellcasting,
  resolveCreatureTraits
} from "./creature.repository";

describe("collectDamageIds", () => {
  it("recoge ids legado y grants, más el daño de ataques", () => {
    const ids = collectDamageIds({
      damage_vulnerabilities: ["cold"] as never,
      damage_immunities: [{
        damageTypeIds: ["bludgeoning", "piercing"],
        source: "nonmagical_attacks",
        bypass: ["silvered"]
      }],
      damage_resistances: [],
      actions: [{
        name: "Mordisco",
        description: [],
        attack: {
          kind: "melee_weapon",
          damage: [{ dice: "1d6", damageTypeId: "poison" }]
        }
      }]
    } as never);

    expect(ids).toEqual(["cold", "bludgeoning", "piercing", "poison"]);
  });
});

describe("resolveCreatureTraits", () => {
  it("expone traits y lee special_abilities de documentos lean antiguos", () => {
    const embedded = { name: "Incorpóreo", description: ["Puede atravesar objetos."] };

    expect(resolveCreatureTraits({ traits: [embedded] })).toEqual([embedded]);
    expect(resolveCreatureTraits({ special_abilities: [embedded] })).toEqual([embedded]);
    expect(resolveCreatureTraits({})).toEqual([]);
  });
});

describe("creatureObjectIds", () => {
  it("convierte ids de Mongo y descarta índices antiguos", () => {
    const id = new Types.ObjectId().toString();
    const result = creatureObjectIds([id, "priest", ""]);

    expect(result).toHaveLength(1);
    expect(result[0]?.toString()).toBe(id);
  });
});

describe("formatStoredCreatureRace", () => {
  const elf = {
    id: "race1",
    name: "Elfo",
    ruleset: "sys1",
    creatureTypeId: "type1"
  };

  it("deja sin raza cuando el campo falta, es null o solo existía subtype", () => {
    expect(formatStoredCreatureRace(undefined)).toBeNull();
    expect(formatStoredCreatureRace(null)).toBeNull();
    expect(formatStoredCreatureRace("")).toBeNull();
  });

  it("conserva el comodín de raza cualquiera", () => {
    expect(formatStoredCreatureRace(CREATURE_ANY_RACE)).toBe("any");
  });

  it("resuelve el id al RaceRef y anula un id que ya no existe", () => {
    expect(formatStoredCreatureRace("race1", elf)).toEqual(elf);
    expect(formatStoredCreatureRace("missing")).toBeNull();
  });
});

describe("hydrateSpellcasting", () => {
  const sacredFlame: SpellApi = {
    id: "sacred-flame",
    ruleset: "sys1",
    name: "Llama sagrada",
    level: 0,
    classes: [],
    description: []
  };
  const cureWounds: SpellApi = {
    id: "cure-wounds",
    ruleset: "sys1",
    name: "Curar heridas",
    level: 1,
    classes: [],
    description: []
  };
  const spellById = new Map<string, SpellApi>([
    ["cure-wounds", cureWounds],
    ["sacred-flame", sacredFlame]
  ]);
  const wisdom: AttributeApi = {
    id: "attr-wis",
    ruleset: "sys1",
    name: "Sabiduría",
    key: "wis"
  };
  const catalogAttributes = [wisdom];

  it("hidrata los ids en el orden guardado y deja las ranuras tal cual", () => {
    const slots = { "1": 4, "2": 3, "3": 2 };
    const result = hydrateSpellcasting({
      slots,
      spells: ["sacred-flame", "missing", "cure-wounds"]
    }, spellById, catalogAttributes);

    expect(result.slots).toEqual(slots);
    expect(result.spells).toEqual([sacredFlame, cureWounds]);
  });

  it("devuelve ranuras y conjuros vacíos cuando falta el campo", () => {
    expect(hydrateSpellcasting(null, spellById, catalogAttributes)).toEqual({ slots: {}, spells: [] });
    expect(hydrateSpellcasting(undefined, spellById)).toEqual({ slots: {}, spells: [] });
  });

  it("resuelve la aptitud mágica por id y copia nivel, CD y bonificador", () => {
    const result = hydrateSpellcasting({
      casterLevel: 5,
      abilityId: "attr-wis",
      spellSaveDc: 13,
      spellAttackBonus: 5,
      slots: { "1": 4 },
      spells: ["sacred-flame"]
    }, spellById, catalogAttributes);

    expect(result.casterLevel).toBe(5);
    expect(result.ability).toEqual(wisdom);
    expect(result.spellSaveDc).toBe(13);
    expect(result.spellAttackBonus).toBe(5);
  });

  it("acepta una clave de atributo guardada cuando no hay id", () => {
    const result = hydrateSpellcasting({
      abilityId: "wis",
      slots: {},
      spells: []
    }, spellById, catalogAttributes);

    expect(result.ability).toEqual(wisdom);
  });

  it("omite la aptitud mágica cuando el id no está en el catálogo", () => {
    const result = hydrateSpellcasting({
      abilityId: "missing",
      spellSaveDc: 10,
      slots: {},
      spells: []
    }, spellById, catalogAttributes);

    expect(result.ability).toBeUndefined();
    expect(result.spellSaveDc).toBe(10);
  });
});

describe("hydrateInnateSpellcasting", () => {
  const detectMagic: SpellApi = {
    id: "detect-magic",
    ruleset: "sys1",
    name: "Detectar magia",
    level: 1,
    classes: [],
    description: []
  };
  const levitate: SpellApi = {
    id: "levitate",
    ruleset: "sys1",
    name: "Levitar",
    level: 2,
    classes: [],
    description: []
  };
  const spellById = new Map<string, SpellApi>([
    ["detect-magic", detectMagic],
    ["levitate", levitate]
  ]);
  const intelligence: AttributeApi = {
    id: "attr-int",
    ruleset: "sys1",
    name: "Inteligencia",
    key: "int"
  };

  it("hidrata cada grupo con su uso y sus conjuros en orden", () => {
    const result = hydrateInnateSpellcasting({
      abilityId: "attr-int",
      spellSaveDc: 15,
      spells: [
        { usage: { type: "perDay", value: 3 }, spells: ["detect-magic", "missing"] },
        { usage: { type: "perDay", value: 1 }, spells: ["levitate"] }
      ]
    }, spellById, [intelligence]);

    expect(result).toEqual({
      ability: intelligence,
      spellSaveDc: 15,
      spells: [
        { usage: { type: "perDay", value: 3 }, spells: [detectMagic] },
        { usage: { type: "perDay", value: 1 }, spells: [levitate] }
      ]
    });
  });

  it("devuelve una lista vacía cuando falta el campo o no es válido", () => {
    expect(hydrateInnateSpellcasting(null, spellById)).toEqual({ spells: [] });
    expect(hydrateInnateSpellcasting(undefined, spellById)).toEqual({ spells: [] });
    expect(hydrateInnateSpellcasting(
      { spells: {} } as unknown as CreatureInnateSpellcasting,
      spellById
    )).toEqual({ spells: [] });
  });

  it("descarta grupos guardados sin uso o sin lista de conjuros", () => {
    const result = hydrateInnateSpellcasting({
      spells: [
        { usage: { type: "atWill" }, spells: ["levitate"] },
        { spells: ["detect-magic"] },
        { usage: { type: "perDay", value: 1 } }
      ] as unknown as CreatureInnateSpellcasting["spells"]
    }, spellById);

    expect(result.spells).toEqual([{ usage: { type: "atWill" }, spells: [levitate] }]);
  });
});
