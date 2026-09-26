import { describe, expect, it } from "vitest";
import { createCreatureTypeSchema, updateCreatureTypeSchema } from "./creatureType.schema";

describe("createCreatureTypeSchema", () => {
  it("acepta nombre, sistema y descripción", () => {
    const result = createCreatureTypeSchema.safeParse({
      name: "Humanoide",
      ruleset: "sys1",
      description: "Criaturas con forma humana"
    });

    expect(result.success).toBe(true);
  });

  it("acepta el alta sin descripción", () => {
    const result = createCreatureTypeSchema.safeParse({
      name: "Bestia",
      ruleset: "sys1"
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBeUndefined();
    }
  });

  it("rechaza un alta sin nombre o sin sistema", () => {
    const withoutName = createCreatureTypeSchema.safeParse({ ruleset: "sys1" });
    const withoutRuleset = createCreatureTypeSchema.safeParse({ name: "Bestia" });
    const emptyName = createCreatureTypeSchema.safeParse({ name: "", ruleset: "sys1" });

    expect(withoutName.success).toBe(false);
    expect(withoutRuleset.success).toBe(false);
    expect(emptyName.success).toBe(false);
  });
});

describe("updateCreatureTypeSchema", () => {
  it("acepta un cambio parcial sin identificador en el cuerpo", () => {
    const result = updateCreatureTypeSchema.safeParse({ name: "Monstruosidad" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ name: "Monstruosidad" });
      expect("id" in result.data).toBe(false);
    }
  });

  it("rechaza un cuerpo vacío", () => {
    const result = updateCreatureTypeSchema.safeParse({});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(issue =>
        issue.message === "Debe proporcionar al menos un campo para modificar"
      )).toBe(true);
    }
  });
});
