import { describe, expect, it } from "vitest";
import { SizeSchema } from "./size.schema";

describe("SizeSchema", () => {
  it("acepta texto legado y lo normaliza", () => {
    expect(SizeSchema.parse("Mediano")).toBe("medium");
    expect(SizeSchema.parse("Medium")).toBe("medium");
    expect(SizeSchema.parse("medium")).toBe("medium");
    expect(SizeSchema.parse("Grande")).toBe("large");
    expect(SizeSchema.parse("Large")).toBe("large");
  });

  it("rechaza valores desconocidos", () => {
    expect(SizeSchema.safeParse("colossal").success).toBe(false);
    expect(SizeSchema.safeParse("").success).toBe(false);
    expect(SizeSchema.safeParse(1).success).toBe(false);
  });
});
