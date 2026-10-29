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
      "recoverSpellSlots",
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

  it("documents conditionalConditionImmunities on Trait write and read schemas", () => {
    expect(schemas.Trait?.properties?.conditionalConditionImmunities).toBeDefined();
    expect(schemas.InputCreateTrait?.properties?.conditionalConditionImmunities).toBeDefined();
    expect(schemas.InputUpdateTrait?.properties?.conditionalConditionImmunities).toBeDefined();
    expect(schemas.Trait?.properties?.conditionalResistanceGroup?.description).toMatch(/inmunidades/i);
  });

  it("documents abilityScores on Trait write and read schemas", () => {
    expect(schemas.TraitAbilityScore?.required).toEqual(["key", "bonus"]);
    expect(schemas.Trait?.properties?.abilityScores).toBeDefined();
    expect(schemas.InputCreateTrait?.properties?.abilityScores).toBeDefined();
    expect(schemas.InputUpdateTrait?.properties?.abilityScores).toBeDefined();
  });

  it("documents recoverSpellSlots on TraitAction", () => {
    expect(schemas.TraitRecoverSpellSlots?.required).toEqual(["pool", "scope"]);
    expect(schemas.TraitAction?.properties?.recoverSpellSlots).toBeDefined();
    expect(schemas.TraitRecoverSpellSlots?.properties?.pool?.description).toMatch(/nivel fijo/i);
    expect(schemas.TraitRecoverSpellSlots?.properties?.scope?.description).toMatch(/otorga/i);
  });

  it("documents atLevel on SpellPrivilegeRule without requiring it", () => {
    expect(schemas.SpellPrivilegeRule?.properties?.atLevel).toBeDefined();
    expect(schemas.SpellPrivilegeRule?.required).not.toContain("atLevel");
    expect(schemas.SpellPrivilegeRule?.properties?.atLevel?.description).toMatch(/omite/i);
  });

  it("documents weaponBond on Trait write and read schemas", () => {
    expect(schemas.TraitWeaponBond?.required).toEqual(["melee", "grantsProficiency", "magical"]);
    expect(schemas.Trait?.properties?.weaponBond).toBeDefined();
    expect(schemas.InputCreateTrait?.properties?.weaponBond).toBeDefined();
    expect(schemas.InputUpdateTrait?.properties?.weaponBond).toBeDefined();
  });

  it("documents uniqueEquipmentGrant and anyClassList spell privileges", () => {
    expect(schemas.TraitUniqueEquipmentGrant?.required).toEqual(["equipmentId"]);
    expect(schemas.TraitUniqueEquipmentGrantApi?.required).toEqual(["id", "name"]);
    expect((schemas.Trait?.properties?.uniqueEquipmentGrant as { $ref?: string } | undefined)?.$ref)
      .toBe("#/components/schemas/TraitUniqueEquipmentGrantApi");
    expect(schemas.InputCreateTrait?.properties?.uniqueEquipmentGrant).toBeDefined();
    expect(schemas.InputUpdateTrait?.properties?.uniqueEquipmentGrant).toBeDefined();
    expect((schemas.SpellPrivilegeRule?.properties?.source as { enum?: string[] } | undefined)?.enum)
      .toEqual(expect.arrayContaining(["known", "classList", "anyClassList"]));
    expect(schemas.InputCreateTrait?.properties?.spellRepository).toBeDefined();
    expect(schemas.InputUpdateTrait?.properties?.spellRepository).toBeDefined();
    expect(schemas.Trait?.properties?.spellRepository).toBeDefined();
  });

  it("documents grantedSpells as TraitGrantedSpell on Trait GET", () => {
    expect(schemas.TraitGrantedSpell?.required).toEqual(["spellId", "ritualOnly"]);
    expect(schemas.TraitGrantedSpellInput?.required).toEqual(["spellId"]);
    expect((schemas.Trait?.properties?.grantedSpells as { items?: { $ref?: string } } | undefined)?.items?.$ref)
      .toBe("#/components/schemas/TraitGrantedSpell");
    expect((schemas.InputCreateTrait?.properties?.grantedSpells as { items?: { $ref?: string } } | undefined)?.items?.$ref)
      .toBe("#/components/schemas/TraitGrantedSpellInput");
    expect((schemas.InputUpdateTrait?.properties?.grantedSpells as { items?: { $ref?: string } } | undefined)?.items?.$ref)
      .toBe("#/components/schemas/TraitGrantedSpellInput");
  });

  it("documents skillProficiencies on Trait write and read schemas", () => {
    expect(schemas.TraitSkillProficiency?.required).toEqual(["value"]);
    expect(schemas.Trait?.properties?.skillProficiencies).toBeDefined();
    expect(schemas.InputCreateTrait?.properties?.skillProficiencies).toBeDefined();
    expect(schemas.InputUpdateTrait?.properties?.skillProficiencies).toBeDefined();
  });

  it("does not document skillProficiencyChoices on Trait schemas", () => {
    expect(schemas.TraitSkillProficiencyChoice).toBeUndefined();
    expect(schemas.Trait?.properties?.skillProficiencyChoices).toBeUndefined();
    expect(schemas.InputCreateTrait?.properties?.skillProficiencyChoices).toBeUndefined();
    expect(schemas.InputUpdateTrait?.properties?.skillProficiencyChoices).toBeUndefined();
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
    expect(schemas.TraitDamageChoiceInput?.required).toEqual(["key", "choose"]);
    expect(schemas.TraitDamageChoiceInput?.properties?.options?.items).toEqual({
      $ref: "#/components/schemas/TraitDamageChoiceOptionInput"
    });
    expect(option.properties).not.toHaveProperty("label");
    expect(schemas.TraitDamageChoiceOption?.properties?.label?.readOnly).toBe(true);
  });
});

describe("OpenAPI restRules hitDiceSpending", () => {
  const spec = generateSwaggerSpec() as OpenApiSpec;
  const schemas = spec.components.schemas;

  it("documents hitDiceSpending on SystemRestRules", () => {
    expect(schemas.SystemRestRules?.properties?.hitDiceSpending).toBeDefined();
    expect(schemas.SystemHitDiceSpending?.required).toEqual(["on"]);
    expect(schemas.CharacterHitDice?.required).toEqual(expect.arrayContaining(["bonusPerDie"]));
  });
});

describe("OpenAPI without Feat", () => {
  const spec = generateSwaggerSpec() as OpenApiSpec & { paths: Record<string, unknown> };

  it("does not expose Feat schemas or /feats paths", () => {
    expect(spec.components.schemas).not.toHaveProperty("Feat");
    expect(spec.components.schemas).not.toHaveProperty("FeatRequirements");
    expect(spec.components.schemas).toHaveProperty("AttributeRequirements");
    expect(spec.paths).not.toHaveProperty("/feats");
    expect(spec.paths).not.toHaveProperty("/feats/{id}");
  });
});

describe("OpenAPI character spell mutation slices", () => {
  const spec = generateSwaggerSpec() as OpenApiSpec & { paths: Record<string, unknown> };

  const jsonSchema = (path: string, method: "put" | "post") => {
    const item = spec.paths[path] as {
      put?: { responses?: { "200"?: { content?: { "application/json"?: { schema?: Record<string, unknown> } } } } };
      post?: { responses?: { "200"?: { content?: { "application/json"?: { schema?: Record<string, unknown> } } } } };
    };
    return item[method]?.responses?.["200"]?.content?.["application/json"]?.schema;
  };

  it("documents CharacterSpellStateResponse for spell mutations", () => {
    expect(spec.components.schemas.CharacterSpellStateResponse?.required).toEqual(["spells", "spellsById"]);
    expect(jsonSchema("/character/{id}/prepared-spells", "put")?.$ref)
      .toBe("#/components/schemas/CharacterSpellStateResponse");
    expect(jsonSchema("/character/{id}/known-spells", "post")?.$ref)
      .toBe("#/components/schemas/CharacterSpellStateResponse");
    expect(jsonSchema("/character/{id}/copied-spells", "post")?.$ref)
      .toBe("#/components/schemas/CharacterSpellStateResponse");
    expect(jsonSchema("/character/{id}/spell-privileges/{traitId}", "put")?.$ref)
      .toBe("#/components/schemas/CharacterSpellStateResponse");
  });

  it("documents level-up full as CharacterSheet", () => {
    const schema = jsonSchema("/character/{id}/level-up", "post");
    expect((schema?.properties as { full?: { $ref?: string } } | undefined)?.full?.$ref)
      .toBe("#/components/schemas/CharacterSheet");
  });

  it("documents alwaysPreparedSpells on GET level-up-data", () => {
    const item = spec.paths["/character/{id}/level-up-data"] as {
      get?: {
        responses?: {
          "200"?: {
            content?: {
              "application/json"?: {
                schema?: {
                  properties?: Record<string, { description?: string; items?: { $ref?: string } }>;
                };
              };
            };
          };
        };
      };
    };
    const props = item.get?.responses?.["200"]?.content?.["application/json"]?.schema?.properties ?? {};
    expect(props.alwaysPreparedSpells?.items?.$ref).toBe("#/components/schemas/AlwaysPreparedSpellRow");
    expect(props.alwaysPreparedSpells?.description).toMatch(/atLevel/);
    expect(spec.components.schemas.AlwaysPreparedSpellRowRef).toBeDefined();
  });
});

describe("OpenAPI character combat mutation patches", () => {
  const spec = generateSwaggerSpec() as OpenApiSpec & { paths: Record<string, unknown> };

  const jsonSchema = (path: string, method: "put" | "post" | "patch" | "delete") => {
    const item = spec.paths[path] as Record<string, {
      responses?: { "200"?: { content?: { "application/json"?: { schema?: Record<string, unknown> } } } };
    }>;
    return item[method]?.responses?.["200"]?.content?.["application/json"]?.schema;
  };

  it("documents CharacterStatePatch for combat mutations", () => {
    expect(spec.components.schemas.CharacterStatePatch?.description).toMatch(/clave ausente/i);
    expect(jsonSchema("/character/{id}/hp/damage", "post")?.$ref)
      .toBe("#/components/schemas/CharacterStatePatch");
    expect(jsonSchema("/character/{id}/hp/heal", "post")?.$ref)
      .toBe("#/components/schemas/CharacterStatePatch");
    expect(jsonSchema("/character/{id}/hit-dice/spend", "post")?.$ref)
      .toBe("#/components/schemas/CharacterStatePatch");
    expect(jsonSchema("/character/{id}/spell-slots/spend", "post")?.$ref)
      .toBe("#/components/schemas/CharacterStatePatch");
    expect(jsonSchema("/character/{id}/conditions", "post")?.$ref)
      .toBe("#/components/schemas/CharacterStatePatch");
    expect(jsonSchema("/character/{id}/conditions/{conditionId}", "patch")?.$ref)
      .toBe("#/components/schemas/CharacterStatePatch");
    expect(jsonSchema("/character/{id}/conditions/{conditionId}", "delete")?.$ref)
      .toBe("#/components/schemas/CharacterStatePatch");
    expect(jsonSchema("/character/{id}/rest", "post")?.$ref)
      .toBe("#/components/schemas/CharacterStatePatch");
    expect(jsonSchema("/character/{id}/traits/{traitId}/use", "post")?.$ref)
      .toBe("#/components/schemas/CharacterStatePatch");
    expect(jsonSchema("/character/{id}/traits/{traitId}/deactivate", "post")?.$ref)
      .toBe("#/components/schemas/CharacterStatePatch");
    expect(jsonSchema("/character/{id}/addForm", "post")?.$ref)
      .toBe("#/components/schemas/CharacterStatePatch");
    expect(jsonSchema("/character/{id}/forms/{formId}/activate", "post")?.$ref)
      .toBe("#/components/schemas/CharacterStatePatch");
    expect(jsonSchema("/character/{id}/forms/{formId}/deactivate", "post")?.$ref)
      .toBe("#/components/schemas/CharacterStatePatch");
  });
});
