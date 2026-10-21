import { describe, it, expect } from "vitest";
import { ValidationError } from "../../../domain/errors/AppError";
import { requiredPathId } from "./optionGroup.controller";

describe("requiredPathId", () => {
  it("returns a string param", () => {
    expect(requiredPathId("abc", "faltante")).toBe("abc");
  });

  it("returns the first value when Express gives an array", () => {
    expect(requiredPathId(["abc", "def"], "faltante")).toBe("abc");
  });

  it("throws when the param is missing", () => {
    expect(() => requiredPathId(undefined, "El ID del grupo de opciones es obligatorio")).toThrow(ValidationError);
  });
});
