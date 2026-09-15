import { describe, it, expect } from "vitest";
import { BindSpellPrivilegesSchema, BindSpellPrivilegesParamsSchema } from "../../../infrastructure/http/schemas/personaje.schema";

const validId = "507f1f77bcf86cd799439011";
const traitId = "spell-mastery";

describe("BindSpellPrivilegesSchema", () => {
  it("accepts a class and selections without id in the body", () => {
    const result = BindSpellPrivilegesSchema.safeParse({
      class: validId,
      selections: [[validId], [validId]],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect("id" in result.data).toBe(false);
      expect("traitId" in result.data).toBe(false);
    }
  });

  it("rejects invalid ObjectIds", () => {
    expect(BindSpellPrivilegesSchema.safeParse({
      class: "not-an-id",
      selections: [[validId]],
    }).success).toBe(false);

    expect(BindSpellPrivilegesSchema.safeParse({
      class: validId,
      selections: [["not-an-id"]],
    }).success).toBe(false);
  });
});

describe("BindSpellPrivilegesParamsSchema", () => {
  it("accepts character ObjectId and a trait id or index", () => {
    expect(BindSpellPrivilegesParamsSchema.safeParse({
      id: validId,
      traitId,
    }).success).toBe(true);
  });

  it("rejects a missing traitId", () => {
    expect(BindSpellPrivilegesParamsSchema.safeParse({
      id: validId,
    }).success).toBe(false);
  });
});
