import { describe, expect, it } from "vitest";
import { generateSwaggerSpec } from "./swagger";

type SchemaNode = {
  description?: string;
  properties?: Record<string, { description?: string; required?: string[] }>;
  required?: string[];
  allOf?: unknown[];
  items?: { $ref?: string; required?: string[]; properties?: Record<string, unknown> };
};

type OpenApiSpec = {
  components: {
    schemas: Record<string, SchemaNode>;
  };
};

describe("OpenAPI trait action schemas", () => {
  const spec = generateSwaggerSpec() as OpenApiSpec;
  const schemas = spec.components.schemas;

  it("keeps TraitAction write fields and omits sheet-only keys", () => {
    const props = schemas.TraitAction?.properties ?? {};
    expect(Object.keys(props)).toEqual(expect.arrayContaining([
      "uses",
      "usesByClassLevel",
      "recharge",
      "saveDcFormula"
    ]));
    expect(props).not.toHaveProperty("remaining");
    expect(props).not.toHaveProperty("active");
    expect(props).not.toHaveProperty("saveDc");
    expect(props.saveDcFormula?.description).toContain("@attributes.{key}.modifier");
  });

  it("exposes remaining, active and saveDc only on TraitActionSheet", () => {
    expect(schemas.TraitActionSheet?.allOf).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ $ref: "#/components/schemas/TraitAction" })
      ])
    );
    const sheetProps = (schemas.TraitActionSheet?.allOf as Array<{ properties?: Record<string, unknown> }> | undefined)
      ?.find(item => item.properties)?.properties ?? {};
    expect(sheetProps).toHaveProperty("remaining");
    expect(sheetProps).toHaveProperty("active");
    expect(sheetProps).toHaveProperty("saveDc");
  });

  it("documents that catalog GET does not copy description into summary", () => {
    expect(schemas.Trait?.properties?.summary?.description).toMatch(/array vacío/i);
    expect(schemas.InputCreateTrait?.properties?.summary?.description).toMatch(/no se copia description/i);
  });

  it("documents trait ids as MongoDB ids without the legacy index key", () => {
    expect(schemas.Trait?.properties?.id?.description).toMatch(/MongoDB/i);
    expect(schemas.Trait?.properties?.id?.description).not.toMatch(/index/i);
    expect(schemas.TraitDamageChoiceRef?.properties?.traitId?.description).toMatch(/MongoDB/i);
    expect(schemas.TraitDamageChoiceRef?.properties?.traitId?.description).not.toMatch(/index/i);
  });

  it("documents abilityScores on Trait write and read schemas", () => {
    expect(schemas.TraitAbilityScore?.required).toEqual(["key", "bonus"]);
    expect(schemas.Trait?.properties?.abilityScores).toBeDefined();
    expect(schemas.InputCreateTrait?.properties?.abilityScores).toBeDefined();
    expect(schemas.InputUpdateTrait?.properties?.abilityScores).toBeDefined();
  });

  it("defines write schemas instead of leaving dangling InputCreateTrait refs", () => {
    expect(schemas.InputCreateTrait).toBeDefined();
    expect(schemas.InputUpdateTrait).toBeDefined();
    expect(schemas.InputCreateTrait.description).toMatch(/IDs/i);
    expect(schemas.InputUpdateTrait.description).toMatch(/hidratados/i);
  });

  it("does not require id on damage choice write options", () => {
    const option = schemas.TraitDamageChoiceOptionInput;
    expect(option.required).toEqual(["name", "damageTypeId"]);
    expect(option.properties).not.toHaveProperty("id");
    expect(schemas.TraitDamageChoiceInput?.properties?.options?.items).toEqual({
      $ref: "#/components/schemas/TraitDamageChoiceOptionInput"
    });
  });
});
