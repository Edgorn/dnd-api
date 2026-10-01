import { describe, expect, it } from "vitest";
import { LanguageApi } from "../domain/types/language.types";
import { hydrateLanguageGrants } from "./hydrateLanguageGrants";
import { isMongoObjectId } from "./mongoObjectId";

const catalogId = "507f1f77bcf86cd799439011";
const missingId = "507f1f77bcf86cd799439099";
const catalog: LanguageApi = {
  id: catalogId,
  name: "Común",
  ruleset: "sys1"
};

const catalogById = new Map([[catalogId, catalog]]);

describe("isMongoObjectId", () => {
  it("acepta un ObjectId de 24 hex y rechaza slugs", () => {
    expect(isMongoObjectId(catalogId)).toBe(true);
    expect(isMongoObjectId("draconic")).toBe(false);
    expect(isMongoObjectId("the languages of its creator")).toBe(false);
  });
});

describe("hydrateLanguageGrants", () => {
  it("mezcla ids de catálogo con etiquetas y conserva el orden", () => {
    expect(hydrateLanguageGrants(
      [catalogId, "the languages of its creator", catalogId],
      catalogById
    )).toEqual([
      catalog,
      { name: "the languages of its creator" },
      catalog
    ]);
  });

  it("omite un id de catálogo inexistente y no lo trata como etiqueta", () => {
    expect(hydrateLanguageGrants([missingId, "Homúnculo"], catalogById)).toEqual([
      { name: "Homúnculo" }
    ]);
  });
});
