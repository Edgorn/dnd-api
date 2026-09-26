import { describe, it, expect, vi, beforeEach } from "vitest";
import CreateCreatureType from "./createCreatureType.use-case";
import UpdateCreatureType from "./updateCreatureType.use-case";
import SoftDeleteCreatureType from "./softDeleteCreatureType.use-case";
import RestoreCreatureType from "./restoreCreatureType.use-case";
import GetCreatureTypesBySystem from "./getCreatureTypesBySystem.use-case";
import { AppError } from "../../../domain/errors/AppError";

const sampleType = {
  id: "type1",
  name: "Humanoide",
  ruleset: "sys1",
  description: "Forma humana"
};

describe("CreatureType use cases", () => {
  let creatureTypeServiceMock: {
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    getBySystems: ReturnType<typeof vi.fn>;
    getById: ReturnType<typeof vi.fn>;
    softDelete: ReturnType<typeof vi.fn>;
    restore: ReturnType<typeof vi.fn>;
  };
  let systemServiceMock: {
    getById: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    creatureTypeServiceMock = {
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

  describe("CreateCreatureType", () => {
    it("crea el tipo cuando el usuario es el publicador del sistema", async () => {
      const useCase = new CreateCreatureType(creatureTypeServiceMock as never, systemServiceMock as never);
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });
      creatureTypeServiceMock.create.mockResolvedValue(sampleType);

      const input = { name: "Humanoide", ruleset: "sys1", description: "Forma humana" };
      const result = await useCase.execute(input, "user1");

      expect(result).toEqual(sampleType);
      expect(creatureTypeServiceMock.create).toHaveBeenCalledWith(input);
    });

    it("rechaza el alta si el usuario no es el publicador", async () => {
      const useCase = new CreateCreatureType(creatureTypeServiceMock as never, systemServiceMock as never);
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "other" });

      await expect(useCase.execute({ name: "Bestia", ruleset: "sys1" }, "user1"))
        .rejects.toThrow("No tienes permisos");
      expect(creatureTypeServiceMock.create).not.toHaveBeenCalled();
    });
  });

  describe("UpdateCreatureType", () => {
    it("actualiza el tipo cuando el usuario es el publicador", async () => {
      const useCase = new UpdateCreatureType(creatureTypeServiceMock as never, systemServiceMock as never);
      creatureTypeServiceMock.getById.mockResolvedValue(sampleType);
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });
      creatureTypeServiceMock.update.mockResolvedValue({ ...sampleType, name: "Monstruosidad" });

      const result = await useCase.execute({ id: "type1", name: "Monstruosidad" }, "user1");

      expect(result.name).toBe("Monstruosidad");
    });

    it("lanza 404 si el tipo no existe", async () => {
      const useCase = new UpdateCreatureType(creatureTypeServiceMock as never, systemServiceMock as never);
      creatureTypeServiceMock.getById.mockResolvedValue(null);

      await expect(useCase.execute({ id: "missing", name: "Bestia" }, "user1"))
        .rejects.toBeInstanceOf(AppError);
    });
  });

  describe("SoftDeleteCreatureType", () => {
    it("borra el tipo cuando el usuario es el publicador", async () => {
      const useCase = new SoftDeleteCreatureType(creatureTypeServiceMock as never, systemServiceMock as never);
      creatureTypeServiceMock.getById.mockResolvedValue(sampleType);
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });

      await useCase.execute("type1", "user1");

      expect(creatureTypeServiceMock.softDelete).toHaveBeenCalledWith("type1");
    });
  });

  describe("RestoreCreatureType", () => {
    it("restaura el tipo cuando el usuario es el publicador", async () => {
      const useCase = new RestoreCreatureType(creatureTypeServiceMock as never, systemServiceMock as never);
      creatureTypeServiceMock.getById.mockResolvedValue(sampleType);
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });

      await useCase.execute("type1", "user1");

      expect(creatureTypeServiceMock.restore).toHaveBeenCalledWith("type1");
    });
  });

  describe("GetCreatureTypesBySystem", () => {
    it("delega el listado en el servicio con el usuario autenticado", async () => {
      const useCase = new GetCreatureTypesBySystem(creatureTypeServiceMock as never);
      creatureTypeServiceMock.getBySystems.mockResolvedValue([sampleType]);

      const result = await useCase.execute(["sys1"], "user1");

      expect(result).toEqual([sampleType]);
      expect(creatureTypeServiceMock.getBySystems).toHaveBeenCalledWith(["sys1"], "user1");
    });
  });
});
