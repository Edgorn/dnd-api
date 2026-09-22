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
  });

  const createUseCase = () => new CreateTraitUseCase(
    traitServiceMock,
    systemServiceMock,
    armorTypeServiceMock,
    languageServiceMock,
    damageServiceMock
  );

  const updateUseCase = () => new UpdateTraitUseCase(
    traitServiceMock,
    systemServiceMock,
    armorTypeServiceMock,
    languageServiceMock,
    damageServiceMock
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
  });

  describe("catalog languages and damage", () => {
    const damageId = "507f1f77bcf86cd799439012";
    const languageId = "common";

    beforeEach(() => {
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });
      systemServiceMock.getSystemsAndAncestors.mockResolvedValue(["sys1", "parent"]);
      traitServiceMock.create.mockResolvedValue({ id: "trait1" });
      traitServiceMock.update.mockResolvedValue({ id: "trait1" });
    });

    it("stores languages with the public id of the catalog", async () => {
      languageServiceMock.getById.mockResolvedValue({ id: "draconic", ruleset: "parent" });

      await createUseCase().execute({
        ...baseTrait,
        languages: { speaks: ["507f1f77bcf86cd799439013"], understands: ["draconic"] }
      }, "user1");

      expect(traitServiceMock.create).toHaveBeenCalledWith(expect.objectContaining({
        languages: { speaks: ["draconic"], understands: ["draconic"] }
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
  });
});
