import { describe, it, expect, vi, beforeEach } from "vitest";
import CreateEquipment from "./createEquipment.use-case";
import UpdateEquipment from "./updateEquipment.use-case";
import GetEquipmentById from "./getEquipmentById.use-case";
import GetEquipmentsBySystems from "./getEquipmentsBySystems.use-case";
import SoftDeleteEquipment from "./softDeleteEquipment.use-case";
import RestoreEquipment from "./restoreEquipment.use-case";
import GetEquipmentsByTypes from "./getEquipmentsByTypes.use-case";
import GetEquipmentsWeapons from "./getEquipmentsWeapons.use-case";
import { AppError, NotFoundError } from "../../../domain/errors/AppError";

describe("Equipment Use Cases", () => {
  let equipmentServiceMock: any;
  let systemServiceMock: any;

  beforeEach(() => {
    equipmentServiceMock = {
      create: vi.fn(),
      update: vi.fn(),
      getById: vi.fn(),
      getBySystems: vi.fn(),
      softDelete: vi.fn(),
      restore: vi.fn(),
      getEquipmentsByTypes: vi.fn(),
      getWeapons: vi.fn()
    };

    systemServiceMock = {
      getById: vi.fn()
    };
  });

  describe("CreateEquipment", () => {
    it("should create equipment successfully when user is system publisher", async () => {
      const useCase = new CreateEquipment(equipmentServiceMock, systemServiceMock);
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });
      equipmentServiceMock.create.mockResolvedValue({ id: "eq1", name: "Dagger" });

      const input = {
        ruleset: "sys1",
        name: "Backpack",
        description: "A leather backpack",
        cost: { quantity: 2, unit: "coin1" },
        weight: 5,
        category: "Adventuring Gear",
        subcategory: "Standard",
        storageTags: ["container", "backpack"],
        containerStats: {
          maxWeight: 30,
          maxItems: 20,
          acceptedStorageTags: [],
          maxLiquidCapacity: {
            value: 4,
            unit: "gallon" as const
          },
          maxSolidCapacity: {
            value: 1,
            unit: "cubic_foot" as const
          }
        }
      };

      const result = await useCase.execute(input, "user1");
      expect(result).toEqual({ id: "eq1", name: "Dagger" });
      expect(equipmentServiceMock.create).toHaveBeenCalledWith(input);
    });

    it("should create weapon equipment with proficiencies successfully", async () => {
      const useCase = new CreateEquipment(equipmentServiceMock, systemServiceMock);
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });
      equipmentServiceMock.create.mockResolvedValue({ id: "eq1", name: "Longsword" });

      const input = {
        ruleset: "sys1",
        name: "Longsword",
        description: "A versatile sword",
        cost: { quantity: 15, unit: "coin1" },
        weight: 3,
        category: "Weapon",
        subcategory: "Martial Melee",
        proficiencies: ["martial-weapons"],
        weapon: {
          category: "Martial Melee",
          damage: [{ dice: "1d8", type: "slashing" }],
          two_handed_damage: [{ dice: "1d10", type: "slashing" }],
          properties: ["versatile"],
          range: "Melee"
        }
      };

      const result = await useCase.execute(input, "user1");
      expect(result).toEqual({ id: "eq1", name: "Longsword" });
      expect(equipmentServiceMock.create).toHaveBeenCalledWith(input);
    });

    it("should create equipment with equipSlot successfully", async () => {
      const useCase = new CreateEquipment(equipmentServiceMock, systemServiceMock);
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });
      equipmentServiceMock.create.mockResolvedValue({ id: "eq1", name: "Iron Helmet", equipSlot: "head" });

      const input = {
        ruleset: "sys1",
        name: "Iron Helmet",
        description: "A sturdy iron helmet",
        cost: { quantity: 10, unit: "coin1" },
        weight: 2,
        category: "Armor",
        subcategory: "Helmet",
        equipSlot: "head" as const
      };

      const result = await useCase.execute(input, "user1");
      expect(result).toEqual({ id: "eq1", name: "Iron Helmet", equipSlot: "head" });
      expect(equipmentServiceMock.create).toHaveBeenCalledWith(input);
    });

    it("should throw error if system is not found", async () => {
      const useCase = new CreateEquipment(equipmentServiceMock, systemServiceMock);
      systemServiceMock.getById.mockResolvedValue(null);

      const input = {
        ruleset: "sys1",
        name: "Dagger",
        description: "A small sharp dagger",
        cost: { quantity: 2, unit: "coin1" },
        weight: 1,
        category: "Weapon",
        subcategory: "Simple Melee"
      };

      await expect(useCase.execute(input, "user1")).rejects.toThrow(AppError);
    });

    it("should throw 403 if user is not system publisher", async () => {
      const useCase = new CreateEquipment(equipmentServiceMock, systemServiceMock);
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "otherUser" });

      const input = {
        ruleset: "sys1",
        name: "Dagger",
        description: "A small sharp dagger",
        cost: { quantity: 2, unit: "coin1" },
        weight: 1,
        category: "Weapon",
        subcategory: "Simple Melee"
      };

      await expect(useCase.execute(input, "user1")).rejects.toThrow("No tienes permisos");
    });
  });

  describe("UpdateEquipment", () => {
    it("should update equipment successfully when user is system publisher", async () => {
      const useCase = new UpdateEquipment(equipmentServiceMock, systemServiceMock);
      equipmentServiceMock.getById.mockResolvedValue({ id: "eq1", ruleset: "sys1" });
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });
      equipmentServiceMock.update.mockResolvedValue({ id: "eq1", name: "Updated Dagger" });

      const input = {
        id: "eq1",
        ruleset: "sys1",
        name: "Updated Dagger",
        storageTags: ["weapon", "updated"],
        containerStats: {
          maxWeight: 40,
          maxLiquidCapacity: {
            value: 8,
            unit: "gallon" as const
          },
          maxSolidCapacity: {
            value: 2,
            unit: "cubic_foot" as const
          }
        },
        proficiencies: ["simple-weapons"],
        weapon: {
          category: "Simple Melee"
        }
      };

      const result = await useCase.execute(input, "user1");
      expect(result).toEqual({ id: "eq1", name: "Updated Dagger" });
      expect(equipmentServiceMock.update).toHaveBeenCalledWith(input);
    });

    it("should update equipment with pint liquid capacity unit", async () => {
      const useCase = new UpdateEquipment(equipmentServiceMock, systemServiceMock);
      equipmentServiceMock.getById.mockResolvedValue({ id: "eq1", ruleset: "sys1" });
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });
      equipmentServiceMock.update.mockResolvedValue({ id: "eq1", name: "Flask" });

      const input = {
        id: "eq1",
        containerStats: {
          maxLiquidCapacity: {
            value: 1,
            unit: "pint" as const
          }
        }
      };

      const result = await useCase.execute(input, "user1");
      expect(result).toEqual({ id: "eq1", name: "Flask" });
      expect(equipmentServiceMock.update).toHaveBeenCalledWith(input);
    });

    it("should update equipment with ounce liquid capacity unit", async () => {
      const useCase = new UpdateEquipment(equipmentServiceMock, systemServiceMock);
      equipmentServiceMock.getById.mockResolvedValue({ id: "eq1", ruleset: "sys1" });
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });
      equipmentServiceMock.update.mockResolvedValue({ id: "eq1", name: "Vial" });

      const input = {
        id: "eq1",
        containerStats: {
          maxLiquidCapacity: {
            value: 4,
            unit: "ounce" as const
          }
        }
      };

      const result = await useCase.execute(input, "user1");
      expect(result).toEqual({ id: "eq1", name: "Vial" });
      expect(equipmentServiceMock.update).toHaveBeenCalledWith(input);
    });

    it("should allow clearing storageTags and containerStats with null", async () => {
      const useCase = new UpdateEquipment(equipmentServiceMock, systemServiceMock);
      equipmentServiceMock.getById.mockResolvedValue({ id: "eq1", ruleset: "sys1" });
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });
      equipmentServiceMock.update.mockResolvedValue({ id: "eq1", name: "Cleared Dagger", storageTags: null, containerStats: null, weapon: null });

      const input = {
        id: "eq1",
        storageTags: null,
        containerStats: null,
        weapon: null
      };

      const result = await useCase.execute(input, "user1");
      expect(result).toEqual({ id: "eq1", name: "Cleared Dagger", storageTags: null, containerStats: null, weapon: null });
      expect(equipmentServiceMock.update).toHaveBeenCalledWith(input);
    });

    it("should allow updating and clearing equipSlot with null", async () => {
      const useCase = new UpdateEquipment(equipmentServiceMock, systemServiceMock);
      equipmentServiceMock.getById.mockResolvedValue({ id: "eq1", ruleset: "sys1" });
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });
      equipmentServiceMock.update.mockResolvedValue({ id: "eq1", name: "Boots", equipSlot: null });

      const input = {
        id: "eq1",
        equipSlot: null
      };

      const result = await useCase.execute(input, "user1");
      expect(result).toEqual({ id: "eq1", name: "Boots", equipSlot: null });
      expect(equipmentServiceMock.update).toHaveBeenCalledWith(input);
    });

    it("should throw 404 if equipment is not found", async () => {
      const useCase = new UpdateEquipment(equipmentServiceMock, systemServiceMock);
      equipmentServiceMock.getById.mockResolvedValue(null);

      await expect(useCase.execute({ id: "eq1", name: "Updated" }, "user1")).rejects.toThrow(AppError);
    });

    it("should throw 403 if user is not system publisher", async () => {
      const useCase = new UpdateEquipment(equipmentServiceMock, systemServiceMock);
      equipmentServiceMock.getById.mockResolvedValue({ id: "eq1", ruleset: "sys1" });
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "otherUser" });

      await expect(useCase.execute({ id: "eq1", name: "Updated" }, "user1")).rejects.toThrow("No tienes permisos");
    });
  });

  describe("GetEquipmentById", () => {
    it("should return equipment when found", async () => {
      const useCase = new GetEquipmentById(equipmentServiceMock);
      equipmentServiceMock.getById.mockResolvedValue({ id: "eq1", name: "Dagger" });

      const result = await useCase.execute("eq1");
      expect(result).toEqual({ id: "eq1", name: "Dagger" });
    });

    it("should throw NotFoundError when not found", async () => {
      const useCase = new GetEquipmentById(equipmentServiceMock);
      equipmentServiceMock.getById.mockResolvedValue(null);

      await expect(useCase.execute("eq1")).rejects.toThrow(NotFoundError);
    });
  });

  describe("GetEquipmentsBySystems", () => {
    it("should return list of equipments", async () => {
      const useCase = new GetEquipmentsBySystems(equipmentServiceMock);
      equipmentServiceMock.getBySystems.mockResolvedValue([{ id: "eq1" }, { id: "eq2" }]);

      const result = await useCase.execute(["sys1"]);
      expect(result).toEqual([{ id: "eq1" }, { id: "eq2" }]);
      expect(equipmentServiceMock.getBySystems).toHaveBeenCalledWith(["sys1"]);
    });
  });

  describe("SoftDeleteEquipment", () => {
    it("should soft delete equipment when user is system publisher", async () => {
      const useCase = new SoftDeleteEquipment(equipmentServiceMock, systemServiceMock);
      equipmentServiceMock.getById.mockResolvedValue({ id: "eq1", ruleset: "sys1" });
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });

      await useCase.execute("eq1", "user1");
      expect(equipmentServiceMock.softDelete).toHaveBeenCalledWith("eq1");
    });

    it("should throw 403 if user is not system publisher", async () => {
      const useCase = new SoftDeleteEquipment(equipmentServiceMock, systemServiceMock);
      equipmentServiceMock.getById.mockResolvedValue({ id: "eq1", ruleset: "sys1" });
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "otherUser" });

      await expect(useCase.execute("eq1", "user1")).rejects.toThrow("No tienes permisos");
    });
  });

  describe("RestoreEquipment", () => {
    it("should restore equipment when user is system publisher", async () => {
      const useCase = new RestoreEquipment(equipmentServiceMock, systemServiceMock);
      equipmentServiceMock.getById.mockResolvedValue({ id: "eq1", ruleset: "sys1" });
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });

      await useCase.execute("eq1", "user1");
      expect(equipmentServiceMock.restore).toHaveBeenCalledWith("eq1");
    });

    it("should throw 403 if user is not system publisher", async () => {
      const useCase = new RestoreEquipment(equipmentServiceMock, systemServiceMock);
      equipmentServiceMock.getById.mockResolvedValue({ id: "eq1", ruleset: "sys1" });
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "otherUser" });

      await expect(useCase.execute("eq1", "user1")).rejects.toThrow("No tienes permisos");
    });
  });

  describe("GetEquipmentsByTypes", () => {
    it("should return basic equipments by types", async () => {
      const useCase = new GetEquipmentsByTypes(equipmentServiceMock);
      equipmentServiceMock.getEquipmentsByTypes.mockResolvedValue([{ id: "eq1", name: "Dagger" }]);

      const result = await useCase.execute(["Weapon"]);
      expect(result).toEqual([{ id: "eq1", name: "Dagger" }]);
      expect(equipmentServiceMock.getEquipmentsByTypes).toHaveBeenCalledWith(["Weapon"]);
    });
  });

  describe("GetEquipmentsWeapons", () => {
    it("should return weapons filtered by weapon field", async () => {
      const useCase = new GetEquipmentsWeapons(equipmentServiceMock);
      equipmentServiceMock.getWeapons.mockResolvedValue([{ id: "eq1", name: "Longsword" }]);

      const result = await useCase.execute(["sys1"]);
      expect(result).toEqual([{ id: "eq1", name: "Longsword" }]);
      expect(equipmentServiceMock.getWeapons).toHaveBeenCalledWith(["sys1"]);
    });

    it("should default to empty rulesets when none provided", async () => {
      const useCase = new GetEquipmentsWeapons(equipmentServiceMock);
      equipmentServiceMock.getWeapons.mockResolvedValue([]);

      await useCase.execute(undefined);
      expect(equipmentServiceMock.getWeapons).toHaveBeenCalledWith([]);
    });
  });
});
