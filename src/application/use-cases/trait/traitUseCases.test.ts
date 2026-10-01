import { describe, it, expect, vi, beforeEach } from "vitest";
import CreateTraitUseCase from "./createTrait.use-case";
import UpdateTraitUseCase from "./updateTrait.use-case";
import { AppError } from "../../../domain/errors/AppError";

const typeId = "507f1f77bcf86cd799439011";

describe("Trait Use Cases armor type suppression", () => {
  let traitServiceMock: any;
  let systemServiceMock: any;
  let armorTypeServiceMock: any;
  let languageServiceMock: any;
  let damageServiceMock: any;
  let creatureTypeServiceMock: any;
  let attributeServiceMock: any;
  let spellServiceMock: any;

  beforeEach(() => {
    traitServiceMock = {
      create: vi.fn(),
      update: vi.fn(),
      getById: vi.fn(),
      getTraitsByIndexes: vi.fn()
    };
    systemServiceMock = {
      getById: vi.fn(),
      getSystemsAndAncestors: vi.fn()
    };
    armorTypeServiceMock = {
      getById: vi.fn()
    };
    languageServiceMock = {
      getById: vi.fn()
    };
    damageServiceMock = {
      getById: vi.fn()
    };
    creatureTypeServiceMock = {
      getById: vi.fn()
    };
    attributeServiceMock = {
      getById: vi.fn()
    };
    spellServiceMock = {
      getById: vi.fn()
    };
  });

  const createUseCase = () => new CreateTraitUseCase(
    traitServiceMock,
    systemServiceMock,
    armorTypeServiceMock,
    languageServiceMock,
    damageServiceMock,
    creatureTypeServiceMock,
    attributeServiceMock,
    spellServiceMock
  );

  const updateUseCase = () => new UpdateTraitUseCase(
    traitServiceMock,
    systemServiceMock,
    armorTypeServiceMock,
    languageServiceMock,
    damageServiceMock,
    creatureTypeServiceMock,
    attributeServiceMock,
    spellServiceMock
  );

  const baseTrait = {
    name: "Rasgo",
    description: [],
    summary: [],
    ruleset: "sys1",
    incompatible_traits: []
  };

  describe("CreateTraitUseCase", () => {
    it("creates a trait after validating armor type ids against the ruleset ancestors", async () => {
      const useCase = createUseCase();
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });
      systemServiceMock.getSystemsAndAncestors.mockResolvedValue(["sys1", "parent"]);
      armorTypeServiceMock.getById.mockResolvedValue({ id: typeId, ruleset: "parent" });
      traitServiceMock.create.mockResolvedValue({ id: "trait1" });

      const input = {
        name: "Defensa sin armadura",
        description: [],
        summary: [],
        ruleset: "sys1",
        incompatible_traits: [],
        suppressedByArmorTypeIds: [typeId]
      };
      await useCase.execute(input, "user1");

      expect(traitServiceMock.create).toHaveBeenCalledWith(input);
      expect(armorTypeServiceMock.getById).toHaveBeenCalledWith(typeId);
    });

    it("forwards ignoresArmorSpeedPenaltyForTypeIds after validating the armor type", async () => {
      const useCase = createUseCase();
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });
      systemServiceMock.getSystemsAndAncestors.mockResolvedValue(["sys1", "parent"]);
      armorTypeServiceMock.getById.mockResolvedValue({ id: typeId, ruleset: "parent" });
      traitServiceMock.create.mockResolvedValue({ id: "trait1" });

      const input = {
        name: "Velocidad",
        description: [],
        summary: [],
        ruleset: "sys1",
        incompatible_traits: [],
        ignoresArmorSpeedPenaltyForTypeIds: [typeId]
      };
      await useCase.execute(input, "user1");

      expect(traitServiceMock.create).toHaveBeenCalledWith(input);
      expect(armorTypeServiceMock.getById).toHaveBeenCalledWith(typeId);
    });

    it("throws if an armor type does not belong to the system or its ancestors", async () => {
      const useCase = createUseCase();
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });
      systemServiceMock.getSystemsAndAncestors.mockResolvedValue(["sys1"]);
      armorTypeServiceMock.getById.mockResolvedValue({ id: typeId, ruleset: "other" });

      await expect(useCase.execute({
        name: "Rasgo",
        description: [],
        summary: [],
        ruleset: "sys1",
        incompatible_traits: [],
        suppressedByArmorTypeIds: [typeId]
      }, "user1")).rejects.toThrow(AppError);
      expect(traitServiceMock.create).not.toHaveBeenCalled();
    });
  });

  describe("UpdateTraitUseCase", () => {
    it("validates armor type ids against the existing trait ruleset", async () => {
      const useCase = updateUseCase();
      traitServiceMock.getById.mockResolvedValue({ id: "trait1", ruleset: "sys1" });
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });
      systemServiceMock.getSystemsAndAncestors.mockResolvedValue(["sys1"]);
      armorTypeServiceMock.getById.mockResolvedValue({ id: typeId, ruleset: "sys1" });
      traitServiceMock.update.mockResolvedValue({ id: "trait1" });

      await useCase.execute({ id: "trait1", suppressedByArmorTypeIds: [typeId] }, "user1");
      expect(traitServiceMock.update).toHaveBeenCalled();
    });

    it("forwards ignoresArmorSpeedPenaltyForTypeIds after validating the armor type", async () => {
      const useCase = updateUseCase();
      traitServiceMock.getById.mockResolvedValue({ id: "trait1", ruleset: "sys1" });
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });
      systemServiceMock.getSystemsAndAncestors.mockResolvedValue(["sys1"]);
      armorTypeServiceMock.getById.mockResolvedValue({ id: typeId, ruleset: "sys1" });
      traitServiceMock.update.mockResolvedValue({ id: "trait1" });

      const input = { id: "trait1", ignoresArmorSpeedPenaltyForTypeIds: [typeId] };
      await useCase.execute(input, "user1");

      expect(armorTypeServiceMock.getById).toHaveBeenCalledWith(typeId);
      expect(traitServiceMock.update).toHaveBeenCalledWith(input);
    });
  });

  describe("catalog languages and damage", () => {
    const damageId = "507f1f77bcf86cd799439012";
    const languageId = "507f1f77bcf86cd799439013";

    beforeEach(() => {
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });
      systemServiceMock.getSystemsAndAncestors.mockResolvedValue(["sys1", "parent"]);
      traitServiceMock.create.mockResolvedValue({ id: "trait1" });
      traitServiceMock.update.mockResolvedValue({ id: "trait1" });
    });

    it("stores languages with the public id of the catalog", async () => {
      languageServiceMock.getById.mockResolvedValue({ id: languageId, ruleset: "parent" });

      await createUseCase().execute({
        ...baseTrait,
        languages: { speaks: [languageId], understands: [languageId] }
      }, "user1");

      expect(traitServiceMock.create).toHaveBeenCalledWith(expect.objectContaining({
        languages: { speaks: [languageId], understands: [languageId] }
      }));
    });

    it("rejects a language outside the system and its ancestors", async () => {
      languageServiceMock.getById.mockResolvedValue({ id: languageId, ruleset: "other" });

      await expect(createUseCase().execute({
        ...baseTrait,
        languages: { speaks: [languageId], understands: [] }
      }, "user1")).rejects.toMatchObject({
        message: "El idioma no pertenece a este sistema ni a sus ancestros",
        statusCode: 400
      });
      expect(traitServiceMock.create).not.toHaveBeenCalled();
    });

    it("persists resistances when the damage type belongs to the system or an ancestor", async () => {
      damageServiceMock.getById.mockResolvedValue({ id: damageId, ruleset: "parent" });

      await createUseCase().execute({
        ...baseTrait,
        resistances: [damageId]
      }, "user1");

      expect(damageServiceMock.getById).toHaveBeenCalledWith(damageId);
      expect(traitServiceMock.create).toHaveBeenCalledWith(expect.objectContaining({
        resistances: [damageId]
      }));
    });

    it("rejects resistances when the damage type is outside the system and its ancestors", async () => {
      damageServiceMock.getById.mockResolvedValue({ id: damageId, ruleset: "other" });

      await expect(createUseCase().execute({
        ...baseTrait,
        resistances: [damageId]
      }, "user1")).rejects.toMatchObject({
        message: "El tipo de daño no pertenece a este sistema ni a sus ancestros",
        statusCode: 400
      });
      expect(traitServiceMock.create).not.toHaveBeenCalled();
    });

    it("updates resistances when the damage type belongs to the trait system", async () => {
      traitServiceMock.getById.mockResolvedValue({ id: "trait1", ruleset: "sys1" });
      damageServiceMock.getById.mockResolvedValue({ id: damageId, ruleset: "sys1" });

      await updateUseCase().execute({
        id: "trait1",
        resistances: [damageId]
      }, "user1");

      expect(traitServiceMock.update).toHaveBeenCalledWith(expect.objectContaining({
        resistances: [damageId]
      }));
    });

    it("rejects a damage type outside the system and its ancestors", async () => {
      damageServiceMock.getById.mockResolvedValue({ id: damageId, ruleset: "other" });

      await expect(createUseCase().execute({
        ...baseTrait,
        damageChoices: [{
          key: "ancestor",
          choose: 1,
          options: [{ name: "Rojo", damageTypeId: damageId }]
        }]
      }, "user1")).rejects.toMatchObject({
        message: "El tipo de daño no pertenece a este sistema ni a sus ancestros",
        statusCode: 400
      });
      expect(traitServiceMock.create).not.toHaveBeenCalled();
    });

    it("stores the referenced trait id returned by the catalog", async () => {
      traitServiceMock.getTraitsByIndexes.mockResolvedValue([{
        id: "draconic-ancestry",
        damageChoices: [{ key: "ancestor", choose: 1, options: [] }]
      }]);

      await createUseCase().execute({
        ...baseTrait,
        damageChoiceRef: {
          traitId: "507f1f77bcf86cd799439011",
          choiceKey: "ancestor",
          grantsResistance: true
        }
      }, "user1");

      expect(traitServiceMock.create).toHaveBeenCalledWith(expect.objectContaining({
        damageChoiceRef: {
          traitId: "draconic-ancestry",
          choiceKey: "ancestor",
          grantsResistance: true
        }
      }));
    });

    it("rejects a damage choice key that the referenced trait does not define", async () => {
      traitServiceMock.getById.mockResolvedValue({ id: "trait1", ruleset: "sys1" });
      traitServiceMock.getTraitsByIndexes.mockResolvedValue([{
        id: "draconic-ancestry",
        damageChoices: [{ key: "ancestor", choose: 1, options: [] }]
      }]);

      await expect(updateUseCase().execute({
        id: "trait1",
        damageChoiceRef: { traitId: "draconic-ancestry", choiceKey: "missing" }
      }, "user1")).rejects.toMatchObject({ statusCode: 400 });
      expect(traitServiceMock.update).not.toHaveBeenCalled();
    });

    const favoredEnemy = {
      catalogChoices: [{
        key: "favoredEnemy",
        options: [{ name: "Dragones", creatureTypeId: typeId }],
        grants: [{ atLevel: 1, choose: 1 }]
      }]
    };

    it("rejects a missing creature type", async () => {
      creatureTypeServiceMock.getById.mockResolvedValue(null);

      await expect(createUseCase().execute({
        ...baseTrait,
        ...favoredEnemy
      }, "user1")).rejects.toMatchObject({
        message: "Tipo de criatura no encontrado",
        statusCode: 404
      });
      expect(traitServiceMock.create).not.toHaveBeenCalled();
    });

    it("rejects a deleted creature type", async () => {
      creatureTypeServiceMock.getById.mockResolvedValue({
        id: typeId,
        ruleset: "sys1",
        deletedAt: new Date()
      });

      await expect(createUseCase().execute({
        ...baseTrait,
        ...favoredEnemy
      }, "user1")).rejects.toMatchObject({
        message: "Tipo de criatura no encontrado",
        statusCode: 404
      });
      expect(traitServiceMock.create).not.toHaveBeenCalled();
    });

    it("rejects a creature type outside the system and its ancestors", async () => {
      creatureTypeServiceMock.getById.mockResolvedValue({ id: typeId, ruleset: "other" });

      await expect(createUseCase().execute({
        ...baseTrait,
        ...favoredEnemy
      }, "user1")).rejects.toMatchObject({
        message: "El tipo de criatura no pertenece a este sistema ni a sus ancestros",
        statusCode: 400
      });
      expect(traitServiceMock.create).not.toHaveBeenCalled();
    });

    it("rejects creatureTypeRaces from another system", async () => {
      creatureTypeServiceMock.getById.mockResolvedValue({ id: typeId, ruleset: "other" });

      await expect(createUseCase().execute({
        ...baseTrait,
        catalogChoices: [{
          key: "favoredEnemy",
          source: "creatureTypes",
          options: [],
          creatureTypeRaces: [{
            creatureTypeId: typeId,
            races: 2,
            label: "{0} y {1}"
          }],
          grants: [{ atLevel: 1, choose: 1 }]
        }]
      }, "user1")).rejects.toMatchObject({
        message: "El tipo de criatura no pertenece a este sistema ni a sus ancestros",
        statusCode: 400
      });
      expect(traitServiceMock.create).not.toHaveBeenCalled();
    });

    it("rejects a missing save attribute on a damage choice", async () => {
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });
      systemServiceMock.getSystemsAndAncestors.mockResolvedValue(["sys1"]);
      damageServiceMock.getById.mockResolvedValue({ id: typeId, ruleset: "sys1" });
      attributeServiceMock.getById.mockResolvedValue(null);

      await expect(createUseCase().execute({
        ...baseTrait,
        damageChoices: [{
          key: "ancestor",
          choose: 1,
          options: [{ name: "Rojo", damageTypeId: typeId, saveAttributeId: typeId }]
        }]
      }, "user1")).rejects.toMatchObject({
        message: "Atributo no encontrado",
        statusCode: 404
      });
      expect(traitServiceMock.create).not.toHaveBeenCalled();
    });

    it("accepts a save attribute that belongs to an ancestor system", async () => {
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });
      systemServiceMock.getSystemsAndAncestors.mockResolvedValue(["sys1", "parent"]);
      damageServiceMock.getById.mockResolvedValue({ id: typeId, ruleset: "sys1" });
      attributeServiceMock.getById.mockResolvedValue({ id: typeId, ruleset: "parent" });
      traitServiceMock.create.mockResolvedValue({ id: "trait1" });

      await createUseCase().execute({
        ...baseTrait,
        damageChoices: [{
          key: "ancestor",
          choose: 1,
          options: [{ name: "Rojo", damageTypeId: typeId, saveAttributeId: typeId }]
        }]
      }, "user1");

      expect(traitServiceMock.create).toHaveBeenCalled();
    });
  });

  describe("innate spells", () => {
    const abilityId = "507f1f77bcf86cd799439021";
    const thaumaturgyId = "507f1f77bcf86cd799439022";
    const hellishRebukeId = "507f1f77bcf86cd799439023";

    const innateSpells = {
      abilityId,
      grants: [
        {
          spellId: thaumaturgyId,
          atLevel: 1,
          slotLevel: "spellLevel" as const,
          uses: "unlimited" as const,
          recharge: null
        },
        {
          spellId: hellishRebukeId,
          atLevel: 3,
          slotLevel: 2,
          uses: 1,
          recharge: "longRest" as const
        }
      ]
    };

    beforeEach(() => {
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });
      systemServiceMock.getSystemsAndAncestors.mockResolvedValue(["sys1", "parent"]);
      traitServiceMock.getById.mockResolvedValue({ id: "trait1", ruleset: "sys1" });
      traitServiceMock.create.mockResolvedValue({ id: "trait1" });
      traitServiceMock.update.mockResolvedValue({ id: "trait1" });
    });

    it("persists innate spells when the ability and spells belong to the system or an ancestor", async () => {
      attributeServiceMock.getById.mockResolvedValue({ id: abilityId, ruleset: "parent" });
      spellServiceMock.getById.mockImplementation(async (id: string) => {
        if (id === thaumaturgyId) return { id, ruleset: "sys1", level: 0 };
        if (id === hellishRebukeId) return { id, ruleset: "parent", level: 1 };
        return null;
      });

      await createUseCase().execute({
        ...baseTrait,
        innateSpells
      }, "user1");

      expect(traitServiceMock.create).toHaveBeenCalledWith(expect.objectContaining({ innateSpells }));
    });

    it("rejects a missing innate spell", async () => {
      attributeServiceMock.getById.mockResolvedValue({ id: abilityId, ruleset: "sys1" });
      spellServiceMock.getById.mockResolvedValue(null);

      await expect(createUseCase().execute({
        ...baseTrait,
        innateSpells
      }, "user1")).rejects.toMatchObject({
        message: "Conjuro no encontrado",
        statusCode: 404
      });
      expect(traitServiceMock.create).not.toHaveBeenCalled();
    });

    it("rejects a deleted innate spell", async () => {
      attributeServiceMock.getById.mockResolvedValue({ id: abilityId, ruleset: "sys1" });
      spellServiceMock.getById.mockResolvedValue({
        id: thaumaturgyId,
        ruleset: "sys1",
        level: 0,
        deletedAt: new Date()
      });

      await expect(createUseCase().execute({
        ...baseTrait,
        innateSpells
      }, "user1")).rejects.toMatchObject({
        message: "Conjuro no encontrado",
        statusCode: 404
      });
      expect(traitServiceMock.create).not.toHaveBeenCalled();
    });

    it("rejects an innate spell outside the system and its ancestors", async () => {
      attributeServiceMock.getById.mockResolvedValue({ id: abilityId, ruleset: "sys1" });
      spellServiceMock.getById.mockResolvedValue({ id: thaumaturgyId, ruleset: "other", level: 0 });

      await expect(createUseCase().execute({
        ...baseTrait,
        innateSpells
      }, "user1")).rejects.toMatchObject({
        message: "El conjuro no pertenece a este sistema ni a sus ancestros",
        statusCode: 400
      });
      expect(traitServiceMock.create).not.toHaveBeenCalled();
    });

    it("rejects a cantrip whose slotLevel is not spellLevel", async () => {
      attributeServiceMock.getById.mockResolvedValue({ id: abilityId, ruleset: "sys1" });
      spellServiceMock.getById.mockResolvedValue({ id: thaumaturgyId, ruleset: "sys1", level: 0 });

      await expect(createUseCase().execute({
        ...baseTrait,
        innateSpells: {
          abilityId,
          grants: [{
            spellId: thaumaturgyId,
            atLevel: 1,
            slotLevel: 1,
            uses: 1,
            recharge: "longRest"
          }]
        }
      }, "user1")).rejects.toMatchObject({
        message: "Los trucos innatos deben usar slotLevel spellLevel",
        statusCode: 400
      });
      expect(traitServiceMock.create).not.toHaveBeenCalled();
    });

    it("rejects a missing innate ability", async () => {
      attributeServiceMock.getById.mockResolvedValue(null);
      spellServiceMock.getById.mockResolvedValue({ id: thaumaturgyId, ruleset: "sys1", level: 0 });

      await expect(updateUseCase().execute({
        id: "trait1",
        innateSpells
      }, "user1")).rejects.toMatchObject({
        message: "Atributo no encontrado",
        statusCode: 404
      });
      expect(traitServiceMock.update).not.toHaveBeenCalled();
    });
  });
});
