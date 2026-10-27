import { describe, expect, it } from "vitest";
import { applyTraitDataTokens } from "./applyTraitDataTokens";

describe("applyTraitDataTokens", () => {
  it("replaces a bare key wrapped in square brackets without leaving them", () => {
    expect(
      applyTraitDataTokens(
        ["Puedes activar furia [USES] veces"],
        { USES: "3" },
      ),
    ).toEqual(["Puedes activar furia 3 veces"]);
  });

  it("replaces a square-bracket key in matching text", () => {
    expect(
      applyTraitDataTokens(
        ["Puedes activar furia [USES] veces"],
        { "[USES]": "3" },
      ),
    ).toEqual(["Puedes activar furia 3 veces"]);
  });

  it("replaces a curly-brace key in matching text", () => {
    expect(
      applyTraitDataTokens(
        ["El aliento inflige {dice} de daño"],
        { "{dice}": "2d6" },
      ),
    ).toEqual(["El aliento inflige 2d6 de daño"]);
  });

  it("does not leave [3] or {2d6} after substitution", () => {
    expect(
      applyTraitDataTokens(
        ["Furia [USES] veces y daño {dice}"],
        { USES: "3", dice: "2d6" },
      ),
    ).toEqual(["Furia 3 veces y daño 2d6"]);
  });

  it("does not replace a bare inner word when the stored key is wrapped", () => {
    expect(
      applyTraitDataTokens(
        ["El daño dice {dice} en el texto"],
        { "{dice}": "2d6" },
      ),
    ).toEqual(["El daño dice 2d6 en el texto"]);
  });

  it("returns texts unchanged when tokens are missing", () => {
    const texts = ["Sin cambios"];
    expect(applyTraitDataTokens(texts, undefined)).toBe(texts);
  });
});
