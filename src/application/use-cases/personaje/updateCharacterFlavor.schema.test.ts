import { describe, it, expect } from "vitest";
import { PatchCharacterFlavorSchema } from "../../../infrastructure/http/schemas/personaje.schema";

describe("PatchCharacterFlavorSchema", () => {
  it("rejects an empty body", () => {
    const result = PatchCharacterFlavorSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("accepts img only", () => {
    const result = PatchCharacterFlavorSchema.safeParse({ img: "https://cdn/char.png" });
    expect(result.success).toBe(true);
  });

  it("accepts a partial appearance", () => {
    const result = PatchCharacterFlavorSchema.safeParse({
      appearance: { hair: "blanco" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts background history as string", () => {
    const result = PatchCharacterFlavorSchema.safeParse({
      background: { history: "Línea 1\nLínea 2" },
    });
    expect(result.success).toBe(true);
  });

  it("accepts background history as array", () => {
    const result = PatchCharacterFlavorSchema.safeParse({
      background: { history: ["Línea 1", "Línea 2"] },
    });
    expect(result.success).toBe(true);
  });

  it("rejects unknown keys", () => {
    const result = PatchCharacterFlavorSchema.safeParse({
      img: "x",
      HPActual: 12,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty appearance object", () => {
    const result = PatchCharacterFlavorSchema.safeParse({
      appearance: {},
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty background object", () => {
    const result = PatchCharacterFlavorSchema.safeParse({
      background: {},
    });
    expect(result.success).toBe(false);
  });

  it("rejects background.name", () => {
    const result = PatchCharacterFlavorSchema.safeParse({
      background: { name: "Soldado" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects background.type", () => {
    const result = PatchCharacterFlavorSchema.safeParse({
      background: { type: { name: "origen", values: [] } },
    });
    expect(result.success).toBe(false);
  });
});
