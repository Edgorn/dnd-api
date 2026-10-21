import { describe, expect, it } from "vitest";
import { CreateSpellSchema, SpellDamageSchema, UpdateSpellSchema } from "./spell.schema";

const energyOptions = ["acid", "cold", "fire", "lightning", "poison", "thunder"];

const chromaticOrb = {
  choices: [{ key: "energy", choose: 1, options: energyOptions }],
  base: [{ diceCount: 3, diceType: "d8", bonus: 0, choice: "energy" }],
  scaling: {
    mode: "per_slot_level" as const,
    steps: [{
      level: 2,
      type: "add" as const,
      components: [{ diceCount: 1, diceType: "d8", bonus: 0, choice: "energy" }]
    }]
  }
};

const issuePaths = (issues: { path: PropertyKey[] }[]) =>
  issues.map((issue) => issue.path.join("."));

describe("SpellDamageSchema", () => {
  it("acepta un componente con tipo fijo", () => {
    const result = SpellDamageSchema.safeParse({
      base: [{ diceCount: 8, diceType: "d6", bonus: 0, type: "fire" }]
    });

    expect(result.success).toBe(true);
  });

  it("acepta el orbe cromático cuando base y escalado comparten la misma elección", () => {
    const result = SpellDamageSchema.safeParse(chromaticOrb);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.base[0]?.choice).toBe("energy");
      expect(result.data.scaling?.steps[0]?.components[0]?.choice).toBe("energy");
    }
  });

  it("rechaza un componente que indica type y choice a la vez", () => {
    const result = SpellDamageSchema.safeParse({
      choices: [{ key: "energy", choose: 1, options: energyOptions }],
      base: [{ diceCount: 3, diceType: "d8", type: "fire", choice: "energy" }]
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(issuePaths(result.error.issues)).toContain("base.0.choice");
      expect(result.error.issues.some((issue) =>
        issue.message === "El componente debe indicar un tipo fijo o una elección, no ambos"
      )).toBe(true);
    }
  });

  it("rechaza un componente sin type ni choice", () => {
    const result = SpellDamageSchema.safeParse({
      base: [{ diceCount: 3, diceType: "d8" }]
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(issuePaths(result.error.issues)).toContain("base.0.choice");
      expect(result.error.issues.some((issue) =>
        issue.message === "El componente debe indicar un tipo fijo o una elección"
      )).toBe(true);
    }
  });

  it("rechaza una choice que no existe en choices", () => {
    const result = SpellDamageSchema.safeParse({
      choices: [{ key: "energy", choose: 1, options: energyOptions }],
      base: [{ diceCount: 3, diceType: "d8", choice: "missing" }]
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(issuePaths(result.error.issues)).toContain("base.0.choice");
      expect(result.error.issues.some((issue) => issue.message === "La elección indicada no existe")).toBe(true);
    }
  });

  it("rechaza claves de elección duplicadas", () => {
    const result = SpellDamageSchema.safeParse({
      choices: [
        { key: "energy", choose: 1, options: energyOptions },
        { key: "energy", choose: 1, options: ["fire"] }
      ],
      base: [{ diceCount: 3, diceType: "d8", choice: "energy" }]
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(issuePaths(result.error.issues)).toContain("choices.1.key");
      expect(result.error.issues.some((issue) => issue.message === "La clave de la elección está duplicada")).toBe(true);
    }
  });

  it("rechaza un choose mayor que el número de opciones", () => {
    const result = SpellDamageSchema.safeParse({
      choices: [{ key: "energy", choose: 3, options: ["fire", "cold"] }],
      base: [{ diceCount: 3, diceType: "d8", choice: "energy" }]
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(issuePaths(result.error.issues)).toContain("choices.0.choose");
      expect(result.error.issues.some((issue) =>
        issue.message === "El número de opciones a elegir no puede superar las opciones disponibles"
      )).toBe(true);
    }
  });
});

const plantGrowthBase = {
  ruleset: "sys1",
  name: "Crecimiento vegetal",
  description: ["Transmutación"],
  level: 3,
  classes: [],
  ritual: false
};

describe("CreateSpellSchema castingTimes", () => {
  it("acepta un único tiempo de lanzamiento", () => {
    const result = CreateSpellSchema.safeParse({
      ...plantGrowthBase,
      castingTimes: [{ value: 1, unit: "action" }]
    });

    expect(result.success).toBe(true);
  });

  it("acepta dos tiempos alternativos", () => {
    const result = CreateSpellSchema.safeParse({
      ...plantGrowthBase,
      castingTimes: [
        { value: 1, unit: "action" },
        { value: 8, unit: "hour" }
      ]
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.castingTimes).toHaveLength(2);
    }
  });

  it("rechaza un array vacío", () => {
    const result = CreateSpellSchema.safeParse({
      ...plantGrowthBase,
      castingTimes: []
    });

    expect(result.success).toBe(false);
  });

  it("rechaza el objeto legado castingTime", () => {
    const result = CreateSpellSchema.safeParse({
      ...plantGrowthBase,
      castingTime: { value: 1, unit: "action" }
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(issuePaths(result.error.issues)).toContain("castingTime");
      expect(result.error.issues.some((issue) =>
        issue.message === "Usa castingTimes en lugar de castingTime"
      )).toBe(true);
    }
  });
});

const confusionTable = {
  headers: ["d10", "Comportamiento"],
  rows: [
    ["1", "La criatura emplea todo su movimiento..."],
    ["2–6", "La criatura no se mueve ni realiza ninguna acción este turno."],
    ["7–8", "La criatura usa su acción para realizar un ataque..."],
    ["9–10", "La criatura puede actuar y moverse con normalidad."]
  ]
};

describe("CreateSpellSchema tables", () => {
  it("acepta un conjuro sin tables", () => {
    const result = CreateSpellSchema.safeParse(plantGrowthBase);

    expect(result.success).toBe(true);
  });

  it("acepta párrafos y una tabla", () => {
    const result = CreateSpellSchema.safeParse({
      ...plantGrowthBase,
      name: "Confusión",
      description: [
        "Un objetivo afectado no podrá llevar a cabo reacciones y deberá tirar 1d10...",
        "Al final de cada uno de sus turnos, un objetivo afectado puede realizar una tirada de salvación de Sabiduría..."
      ],
      tables: [confusionTable]
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tables).toHaveLength(1);
      expect(result.data.tables?.[0]?.headers).toEqual(["d10", "Comportamiento"]);
    }
  });

  it("rechaza cabeceras vacías", () => {
    const result = CreateSpellSchema.safeParse({
      ...plantGrowthBase,
      tables: [{ headers: [], rows: [["1", "Nada"]] }]
    });

    expect(result.success).toBe(false);
  });

  it("rechaza una tabla sin filas", () => {
    const result = CreateSpellSchema.safeParse({
      ...plantGrowthBase,
      tables: [{ headers: ["d10", "Comportamiento"], rows: [] }]
    });

    expect(result.success).toBe(false);
  });

  it("rechaza una fila con distinto número de celdas", () => {
    const result = CreateSpellSchema.safeParse({
      ...plantGrowthBase,
      tables: [{
        headers: ["d10", "Comportamiento"],
        rows: [["1", "Nada"], ["2–6"]]
      }]
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(issuePaths(result.error.issues)).toContain("tables.0.rows.1");
      expect(result.error.issues.some((issue) =>
        issue.message === "Cada fila debe tener el mismo número de celdas que las cabeceras"
      )).toBe(true);
    }
  });
});

const familiarForm = {
  purpose: "companion" as const,
  pool: { mode: "ids" as const, creatureIds: ["507f1f77bcf86cd799439011"] }
};

describe("CreateSpellSchema creatureForm", () => {
  it("acepta un familiar por lista de ids", () => {
    const result = CreateSpellSchema.safeParse({
      ...plantGrowthBase,
      creatureForm: familiarForm
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.creatureForm?.choose).toBe(1);
      expect(result.data.creatureForm?.replaceOnRecast).toBe(true);
    }
  });

  it("acepta un filtro de polimorfar", () => {
    const result = CreateSpellSchema.safeParse({
      ...plantGrowthBase,
      creatureForm: {
        purpose: "self",
        pool: { mode: "filter", creatureTypeIds: ["507f1f77bcf86cd799439012"], maxCR: 1 }
      }
    });

    expect(result.success).toBe(true);
  });

  it("acepta purpose target", () => {
    const result = CreateSpellSchema.safeParse({
      ...plantGrowthBase,
      creatureForm: {
        purpose: "target",
        pool: { mode: "filter" }
      }
    });

    expect(result.success).toBe(true);
  });

  it("rechaza ids duplicados", () => {
    const result = CreateSpellSchema.safeParse({
      ...plantGrowthBase,
      creatureForm: {
        purpose: "companion",
        pool: { mode: "ids", creatureIds: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439011"] }
      }
    });

    expect(result.success).toBe(false);
  });

  it("acepta un filtro vacío como todas las criaturas", () => {
    const result = CreateSpellSchema.safeParse({
      ...plantGrowthBase,
      creatureForm: { purpose: "self", pool: { mode: "filter" } }
    });

    expect(result.success).toBe(true);
  });
});

describe("UpdateSpellSchema creatureForm", () => {
  it("acepta null para borrar", () => {
    const result = UpdateSpellSchema.safeParse({ creatureForm: null });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.creatureForm).toBeNull();
    }
  });
});

describe("UpdateSpellSchema tables", () => {
  it("acepta tables vacío para borrarlas", () => {
    const result = UpdateSpellSchema.safeParse({ tables: [] });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tables).toEqual([]);
    }
  });
});
