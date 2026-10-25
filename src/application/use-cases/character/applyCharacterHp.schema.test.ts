import { describe, it, expect } from "vitest";
import { ApplyCharacterHpSchema } from "../../../infrastructure/http/schemas/character.schema";

describe("ApplyCharacterHpSchema", () => {
  it("accepts a positive integer amount", () => {
    expect(ApplyCharacterHpSchema.safeParse({ amount: 7 }).success).toBe(true);
  });

  it("does not require id in the body", () => {
    const result = ApplyCharacterHpSchema.safeParse({ id: "507f1f77bcf86cd799439011", amount: 1 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect("id" in result.data).toBe(false);
    }
  });

  it("rejects amount 0", () => {
    expect(ApplyCharacterHpSchema.safeParse({ amount: 0 }).success).toBe(false);
  });

  it("rejects a negative amount", () => {
    expect(ApplyCharacterHpSchema.safeParse({ amount: -3 }).success).toBe(false);
  });

  it("rejects a non-integer amount", () => {
    expect(ApplyCharacterHpSchema.safeParse({ amount: 1.5 }).success).toBe(false);
  });
});
