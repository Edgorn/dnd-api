import { describe, expect, it } from "vitest";
import { formatSize, normalizeSize, sizeMeetsMinimum } from "./size.types";

describe("normalizeSize", () => {
  it("acepta inglés, español y distinta capitalización", () => {
    expect(normalizeSize("tiny")).toBe("tiny");
    expect(normalizeSize("Diminuto")).toBe("tiny");
    expect(normalizeSize("Small")).toBe("small");
    expect(normalizeSize("pequeño")).toBe("small");
    expect(normalizeSize("medium")).toBe("medium");
    expect(normalizeSize("Mediano")).toBe("medium");
    expect(normalizeSize("Medium")).toBe("medium");
    expect(normalizeSize("Large")).toBe("large");
    expect(normalizeSize("Grande")).toBe("large");
    expect(normalizeSize("Huge")).toBe("huge");
    expect(normalizeSize("Enorme")).toBe("huge");
    expect(normalizeSize("Gargantuan")).toBe("gargantuan");
    expect(normalizeSize("Gargantuesco")).toBe("gargantuan");
  });

  it("rechaza valores desconocidos y no cadenas", () => {
    expect(normalizeSize("colossal")).toBeNull();
    expect(normalizeSize("")).toBeNull();
    expect(normalizeSize("  ")).toBeNull();
    expect(normalizeSize(null)).toBeNull();
    expect(normalizeSize(4)).toBeNull();
  });
});

describe("formatSize", () => {
  it("devuelve el canónico o el valor original si no se reconoce", () => {
    expect(formatSize("Mediano")).toBe("medium");
    expect(formatSize("colossal")).toBe("colossal");
    expect(formatSize(undefined)).toBe("");
  });
});

describe("sizeMeetsMinimum", () => {
  it("compara tamaños canónicos y etiquetas legado", () => {
    expect(sizeMeetsMinimum("large", "large")).toBe(true);
    expect(sizeMeetsMinimum("huge", "large")).toBe(true);
    expect(sizeMeetsMinimum("medium", "large")).toBe(false);
    expect(sizeMeetsMinimum("Grande", "Large")).toBe(true);
  });

  it("devuelve null si algún valor no se reconoce", () => {
    expect(sizeMeetsMinimum("colossal", "large")).toBeNull();
    expect(sizeMeetsMinimum("large", "colossal")).toBeNull();
  });
});
