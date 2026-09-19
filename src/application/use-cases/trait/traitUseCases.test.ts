import { describe, it, expect, vi, beforeEach } from "vitest";
import CreateTraitUseCase from "./createTrait.use-case";
import UpdateTraitUseCase from "./updateTrait.use-case";
import { AppError } from "../../../domain/errors/AppError";

const typeId = "507f1f77bcf86cd799439011";

describe("Trait Use Cases armor type suppression", () => {
  let traitServiceMock: any;
  let systemServiceMock: any;
  let armorTypeServiceMock: any;

  beforeEach(() => {
    traitServiceMock = {
      create: vi.fn(),
      update: vi.fn(),
      getById: vi.fn()
    };
    systemServiceMock = {
      getById: vi.fn(),
      getSystemsAndAncestors: vi.fn()
    };
    armorTypeServiceMock = {
      getById: vi.fn()
    };
  });

  describe("CreateTraitUseCase", () => {
    it("creates a trait after validating armor type ids against the ruleset ancestors", async () => {
      const useCase = new CreateTraitUseCase(traitServiceMock, systemServiceMock, armorTypeServiceMock);
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
      const useCase = new CreateTraitUseCase(traitServiceMock, systemServiceMock, armorTypeServiceMock);
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
      const useCase = new UpdateTraitUseCase(traitServiceMock, systemServiceMock, armorTypeServiceMock);
      traitServiceMock.getById.mockResolvedValue({ id: "trait1", ruleset: "sys1" });
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });
      systemServiceMock.getSystemsAndAncestors.mockResolvedValue(["sys1"]);
      armorTypeServiceMock.getById.mockResolvedValue({ id: typeId, ruleset: "sys1" });
      traitServiceMock.update.mockResolvedValue({ id: "trait1" });

      await useCase.execute({ id: "trait1", suppressedByArmorTypeIds: [typeId] }, "user1");
      expect(traitServiceMock.update).toHaveBeenCalled();
    });
  });
});
