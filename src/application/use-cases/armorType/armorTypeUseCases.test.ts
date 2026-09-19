import { describe, it, expect, vi, beforeEach } from "vitest";
import CreateArmorType from "./createArmorType.use-case";
import UpdateArmorType from "./updateArmorType.use-case";
import GetArmorTypeById from "./getArmorTypeById.use-case";
import GetArmorTypesBySystems from "./getArmorTypesBySystems.use-case";
import SoftDeleteArmorType from "./softDeleteArmorType.use-case";
import RestoreArmorType from "./restoreArmorType.use-case";
import { AppError, NotFoundError } from "../../../domain/errors/AppError";

const sampleType = {
  id: "type1",
  ruleset: "sys1",
  name: "Pesada",
  description: "Armaduras pesadas",
  don: { value: 10, unit: "minute" },
  doff: { value: 5, unit: "minute" }
};

describe("ArmorType Use Cases", () => {
  let armorTypeServiceMock: any;
  let systemServiceMock: any;

  beforeEach(() => {
    armorTypeServiceMock = {
      create: vi.fn(),
      update: vi.fn(),
      getBySystems: vi.fn(),
      getById: vi.fn(),
      softDelete: vi.fn(),
      restore: vi.fn()
    };

    systemServiceMock = {
      getById: vi.fn()
    };
  });

  describe("CreateArmorType", () => {
    it("creates an armor type when the user is the system publisher", async () => {
      const useCase = new CreateArmorType(armorTypeServiceMock, systemServiceMock);
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });
      armorTypeServiceMock.create.mockResolvedValue(sampleType);

      const input = {
        ruleset: "sys1",
        name: "Pesada",
        description: "Armaduras pesadas",
        don: { value: 10, unit: "minute" },
        doff: { value: 5, unit: "minute" }
      };
      const result = await useCase.execute(input, "user1");

      expect(result).toEqual(sampleType);
      expect(armorTypeServiceMock.create).toHaveBeenCalledWith(input);
    });

    it("throws if the system does not exist", async () => {
      const useCase = new CreateArmorType(armorTypeServiceMock, systemServiceMock);
      systemServiceMock.getById.mockResolvedValue(null);

      await expect(useCase.execute({
        ruleset: "sys1",
        name: "Pesada",
        description: "Armaduras pesadas",
        don: { value: 10, unit: "minute" },
        doff: { value: 5, unit: "minute" }
      }, "user1")).rejects.toThrow(AppError);
    });

    it("throws 403 if the user is not the publisher", async () => {
      const useCase = new CreateArmorType(armorTypeServiceMock, systemServiceMock);
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "otherUser" });

      await expect(useCase.execute({
        ruleset: "sys1",
        name: "Pesada",
        description: "Armaduras pesadas",
        don: { value: 10, unit: "minute" },
        doff: { value: 5, unit: "minute" }
      }, "user1")).rejects.toThrow("No tienes permisos");
    });
  });

  describe("GetArmorTypeById", () => {
    it("returns the armor type if it exists", async () => {
      const useCase = new GetArmorTypeById(armorTypeServiceMock);
      armorTypeServiceMock.getById.mockResolvedValue(sampleType);

      const result = await useCase.execute("type1");
      expect(result).toEqual(sampleType);
    });

    it("throws NotFoundError if it does not exist", async () => {
      const useCase = new GetArmorTypeById(armorTypeServiceMock);
      armorTypeServiceMock.getById.mockResolvedValue(null);

      await expect(useCase.execute("type1")).rejects.toThrow(NotFoundError);
    });
  });

  describe("GetArmorTypesBySystems", () => {
    it("requests armor types and strips deletedAt", async () => {
      const useCase = new GetArmorTypesBySystems(armorTypeServiceMock);
      armorTypeServiceMock.getBySystems.mockResolvedValue([{ ...sampleType, deletedAt: null }]);

      const result = await useCase.execute(["sys1"]);
      expect(result).toEqual([sampleType]);
      expect(armorTypeServiceMock.getBySystems).toHaveBeenCalledWith(["sys1"]);
    });
  });

  describe("UpdateArmorType", () => {
    it("updates when the user has permission", async () => {
      const useCase = new UpdateArmorType(armorTypeServiceMock, systemServiceMock);
      armorTypeServiceMock.getById.mockResolvedValue(sampleType);
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });
      armorTypeServiceMock.update.mockResolvedValue({ ...sampleType, name: "Pesada modificada" });

      const result = await useCase.execute({ id: "type1", name: "Pesada modificada" }, "user1");
      expect(result.name).toBe("Pesada modificada");
    });

    it("throws if the armor type does not exist", async () => {
      const useCase = new UpdateArmorType(armorTypeServiceMock, systemServiceMock);
      armorTypeServiceMock.getById.mockResolvedValue(null);

      await expect(useCase.execute({ id: "type1", name: "Test" }, "user1")).rejects.toThrow(AppError);
    });
  });

  describe("SoftDeleteArmorType", () => {
    it("soft deletes when the user has permission", async () => {
      const useCase = new SoftDeleteArmorType(armorTypeServiceMock, systemServiceMock);
      armorTypeServiceMock.getById.mockResolvedValue(sampleType);
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });

      await useCase.execute("type1", "user1");
      expect(armorTypeServiceMock.softDelete).toHaveBeenCalledWith("type1");
    });
  });

  describe("RestoreArmorType", () => {
    it("restores when the user has permission", async () => {
      const useCase = new RestoreArmorType(armorTypeServiceMock, systemServiceMock);
      armorTypeServiceMock.getById.mockResolvedValue(sampleType);
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });

      await useCase.execute("type1", "user1");
      expect(armorTypeServiceMock.restore).toHaveBeenCalledWith("type1");
    });
  });
});
