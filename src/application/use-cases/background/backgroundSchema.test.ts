import { describe, it, expect } from "vitest";
import { CreateBackgroundSchema, UpdateBackgroundSchema } from "../../../infrastructure/http/schemas/background.schema";

const proficiencyId = "507f1f77bcf86cd799439011";

describe("CreateBackgroundSchema proficiencies", () => {
  it("accepts proficiencies as ids", () => {
    const result = CreateBackgroundSchema.safeParse({
      ruleset: "sys1",
      name: "Artista",
      proficiencies: [proficiencyId]
    });

    expect(result.success).toBe(true);
  });

  it("accepts proficiencies_choices with options ids", () => {
    const result = CreateBackgroundSchema.safeParse({
      ruleset: "sys1",
      name: "Artista",
      proficiencies_choices: [{ choose: 1, options: [proficiencyId] }]
    });

    expect(result.success).toBe(true);
  });

  it("accepts proficiencies_choices with a type filter", () => {
    const result = CreateBackgroundSchema.safeParse({
      ruleset: "sys1",
      name: "Soldado",
      proficiencies_choices: [{ choose: 1, filter: { type: "tool" } }]
    });

    expect(result.success).toBe(true);
  });

  it("rejects proficiencies_choices when choose is less than 1", () => {
    const result = CreateBackgroundSchema.safeParse({
      ruleset: "sys1",
      name: "Soldado",
      proficiencies_choices: [{ choose: 0, filter: { type: "tool" } }]
    });

    expect(result.success).toBe(false);
  });
});

describe("CreateBackgroundSchema traits_choices", () => {
  const privilegeTraitId = "507f1f77bcf86cd799439021";
  const retainersTraitId = "507f1f77bcf86cd799439022";

  it("accepts traits_choices with choose and options ids", () => {
    const result = CreateBackgroundSchema.safeParse({
      ruleset: "sys1",
      name: "Noble",
      traits_choices: [{ choose: 1, options: [privilegeTraitId, retainersTraitId] }]
    });

    expect(result.success).toBe(true);
  });

  it("rejects traits_choices when choose is less than 1", () => {
    const result = CreateBackgroundSchema.safeParse({
      ruleset: "sys1",
      name: "Noble",
      traits_choices: [{ choose: 0, options: [privilegeTraitId, retainersTraitId] }]
    });

    expect(result.success).toBe(false);
  });

  it("rejects traits_choices when options is empty", () => {
    const result = CreateBackgroundSchema.safeParse({
      ruleset: "sys1",
      name: "Noble",
      traits_choices: [{ choose: 1, options: [] }]
    });

    expect(result.success).toBe(false);
  });
});

describe("CreateBackgroundSchema parentId", () => {
  it("accepts parentId for a variant", () => {
    const result = CreateBackgroundSchema.safeParse({
      ruleset: "sys1",
      name: "Caballero",
      parentId: "507f1f77bcf86cd799439011"
    });

    expect(result.success).toBe(true);
  });

  it("rejects empty parentId", () => {
    const result = CreateBackgroundSchema.safeParse({
      ruleset: "sys1",
      name: "Caballero",
      parentId: ""
    });

    expect(result.success).toBe(false);
  });
});

describe("UpdateBackgroundSchema proficiencies", () => {
  it("accepts proficiencies and proficiencies_choices on update", () => {
    const result = UpdateBackgroundSchema.safeParse({
      proficiencies: [proficiencyId],
      proficiencies_choices: [{ choose: 1, filter: { type: "tool" } }]
    });

    expect(result.success).toBe(true);
  });

  it("rejects proficiencies_choices when choose is less than 1", () => {
    const result = UpdateBackgroundSchema.safeParse({
      proficiencies_choices: [{ choose: 0, options: [proficiencyId] }]
    });

    expect(result.success).toBe(false);
  });
});

describe("UpdateBackgroundSchema traits_choices", () => {
  const privilegeTraitId = "507f1f77bcf86cd799439021";
  const retainersTraitId = "507f1f77bcf86cd799439022";

  it("accepts traits_choices with choose and options ids", () => {
    const result = UpdateBackgroundSchema.safeParse({
      traits_choices: [{ choose: 1, options: [privilegeTraitId, retainersTraitId] }]
    });

    expect(result.success).toBe(true);
  });

  it("rejects traits_choices when choose is less than 1", () => {
    const result = UpdateBackgroundSchema.safeParse({
      traits_choices: [{ choose: 0, options: [privilegeTraitId, retainersTraitId] }]
    });

    expect(result.success).toBe(false);
  });

  it("rejects traits_choices when options is empty", () => {
    const result = UpdateBackgroundSchema.safeParse({
      traits_choices: [{ choose: 1, options: [] }]
    });

    expect(result.success).toBe(false);
  });
});

describe("UpdateBackgroundSchema parentId", () => {
  it("accepts parentId", () => {
    const result = UpdateBackgroundSchema.safeParse({
      parentId: "507f1f77bcf86cd799439011"
    });

    expect(result.success).toBe(true);
  });
});
