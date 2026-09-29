import { describe, expect, it } from "vitest";
import { createConditionSchema, updateConditionSchema } from "./condition.schema";

describe("createConditionSchema", () => {
  it("acepta nombre, sistema y descripción", () => {
    const result = createConditionSchema.safeParse({
      name: "Envenenado",
      ruleset: "sys1",
      description: "El objetivo sufre desventaja"
    });

    expect(result.success).toBe(true);
  });

  it("acepta el alta sin descripción", () => {
    const result = createConditionSchema.safeParse({
      name: "Aturdido",
      ruleset: "sys1"
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.description).toBeUndefined();
    }
  });

  it("rechaza un alta sin nombre o sin sistema", () => {
    const withoutName = createConditionSchema.safeParse({ ruleset: "sys1" });
    const withoutRuleset = createConditionSchema.safeParse({ name: "Aturdido" });
    const emptyName = createConditionSchema.safeParse({ name: "", ruleset: "sys1" });

    expect(withoutName.success).toBe(false);
    expect(withoutRuleset.success).toBe(false);
    expect(emptyName.success).toBe(false);
  });
});

describe("updateConditionSchema", () => {
  it("acepta un cambio parcial sin identificador en el cuerpo", () => {
    const result = updateConditionSchema.safeParse({ name: "Paralizado" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ name: "Paralizado" });
      expect("id" in result.data).toBe(false);
    }
  });

  it("rechaza un cuerpo vacío", () => {
    const result = updateConditionSchema.safeParse({});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some(issue =>
        issue.message === "Debe proporcionar al menos un campo para modificar"
      )).toBe(true);
    }
  });
});
