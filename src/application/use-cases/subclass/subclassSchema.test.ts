import { describe, it, expect } from "vitest";
import { CreateSubclassSchema, UpdateSubclassSchema } from "../../../infrastructure/http/schemas/subclass.schema";

const classId = "507f1f77bcf86cd799439011";
const traitId = "507f1f77bcf86cd799439012";

describe("CreateSubclassSchema", () => {
  it("accepts a subclass with slim levels", () => {
    const result = CreateSubclassSchema.safeParse({
      ruleset: "sys1",
      classId,
      name: "Escuela de Evocación",
      description: ["Haces hincapié en el estudio de la magia elemental."],
      levels: [
        { level: 2, traits: [traitId] },
        { level: 6, traits: [traitId], traits_data: { [traitId]: { uses: "1" } } }
      ]
    });

    expect(result.success).toBe(true);
  });

  it("rejects an invalid classId", () => {
    const result = CreateSubclassSchema.safeParse({
      ruleset: "sys1",
      classId: "wizard",
      name: "Escuela de Evocación"
    });

    expect(result.success).toBe(false);
  });

  it("rejects duplicate levels", () => {
    const result = CreateSubclassSchema.safeParse({
      ruleset: "sys1",
      classId,
      name: "Escuela de Evocación",
      levels: [
        { level: 2, traits: [traitId] },
        { level: 2, traits: [traitId] }
      ]
    });

    expect(result.success).toBe(false);
  });

  it("rejects traits that are not ObjectIds", () => {
    const result = CreateSubclassSchema.safeParse({
      ruleset: "sys1",
      classId,
      name: "Escuela de Evocación",
      levels: [{ level: 2, traits: ["esculpir-conjuros"] }]
    });

    expect(result.success).toBe(false);
  });
});

describe("UpdateSubclassSchema", () => {
  it("accepts a partial update", () => {
    const result = UpdateSubclassSchema.safeParse({
      name: "Escuela de Evocación"
    });

    expect(result.success).toBe(true);
  });

  it("rejects an empty body", () => {
    const result = UpdateSubclassSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
