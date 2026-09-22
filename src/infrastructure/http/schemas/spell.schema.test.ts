import { describe, expect, it } from "vitest";
import { SpellDamageSchema } from "./spell.schema";

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
