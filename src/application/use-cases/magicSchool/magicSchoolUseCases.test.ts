import { describe, it, expect, vi, beforeEach } from "vitest";
import CreateMagicSchool from "./createMagicSchool.use-case";
import UpdateMagicSchool from "./updateMagicSchool.use-case";
import GetMagicSchoolsBySystems from "./getMagicSchoolsBySystems.use-case";
import SoftDeleteMagicSchool from "./softDeleteMagicSchool.use-case";
import RestoreMagicSchool from "./restoreMagicSchool.use-case";
import { AppError } from "../../../domain/errors/AppError";

describe("MagicSchool Use Cases", () => {
  let magicSchoolServiceMock: any;
  let systemServiceMock: any;

  beforeEach(() => {
    magicSchoolServiceMock = {
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

  describe("CreateMagicSchool", () => {
    it("debe crear una escuela de magia si el sistema existe y el usuario es el creador", async () => {
      const useCase = new CreateMagicSchool(magicSchoolServiceMock, systemServiceMock);
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });
      magicSchoolServiceMock.create.mockResolvedValue({ id: "ms1", name: "Evocación", color: "#FF0000" });

      const input = { ruleset: "sys1", name: "Evocación", description: "Magia elemental", color: "#FF0000" };
      const result = await useCase.execute(input, "user1");

      expect(result).toEqual({ id: "ms1", name: "Evocación", color: "#FF0000" });
      expect(magicSchoolServiceMock.create).toHaveBeenCalledWith(input);
    });

    it("debe lanzar error si el sistema no existe", async () => {
      const useCase = new CreateMagicSchool(magicSchoolServiceMock, systemServiceMock);
      systemServiceMock.getById.mockResolvedValue(null);

      const input = { ruleset: "sys1", name: "Evocación", description: "Magia elemental", color: "#FF0000" };
      await expect(useCase.execute(input, "user1")).rejects.toThrow(AppError);
    });

    it("debe lanzar error 403 si el usuario no es el creador del sistema", async () => {
      const useCase = new CreateMagicSchool(magicSchoolServiceMock, systemServiceMock);
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "otherUser" });

      const input = { ruleset: "sys1", name: "Evocación", description: "Magia elemental", color: "#FF0000" };
      await expect(useCase.execute(input, "user1")).rejects.toThrow("No tienes permisos");
    });
  });

  describe("GetMagicSchoolsBySystems", () => {
    it("debe devolver una lista vacía si no se pasan sistemas", async () => {
      const useCase = new GetMagicSchoolsBySystems(magicSchoolServiceMock);
      const result = await useCase.execute([]);
      expect(result).toEqual([]);
      expect(magicSchoolServiceMock.getBySystems).not.toHaveBeenCalled();
    });

    it("debe solicitar las escuelas de magia al servicio", async () => {
      const useCase = new GetMagicSchoolsBySystems(magicSchoolServiceMock);
      magicSchoolServiceMock.getBySystems.mockResolvedValue([{ id: "ms1", name: "Evocación" }]);

      const result = await useCase.execute(["sys1"]);
      expect(result).toEqual([{ id: "ms1", name: "Evocación" }]);
      expect(magicSchoolServiceMock.getBySystems).toHaveBeenCalledWith(["sys1"]);
    });
  });

  describe("UpdateMagicSchool", () => {
    it("debe actualizar con éxito si el usuario tiene permisos", async () => {
      const useCase = new UpdateMagicSchool(magicSchoolServiceMock, systemServiceMock);
      magicSchoolServiceMock.getById.mockResolvedValue({ id: "ms1", ruleset: "sys1" });
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });
      magicSchoolServiceMock.update.mockResolvedValue({ id: "ms1", name: "Evocación Modificada" });

      const result = await useCase.execute({ id: "ms1", name: "Evocación Modificada" }, "user1");
      expect(result).toEqual({ id: "ms1", name: "Evocación Modificada" });
    });
  });

  describe("SoftDeleteMagicSchool", () => {
    it("debe realizar el borrado lógico si el usuario tiene permisos", async () => {
      const useCase = new SoftDeleteMagicSchool(magicSchoolServiceMock, systemServiceMock);
      magicSchoolServiceMock.getById.mockResolvedValue({ id: "ms1", ruleset: "sys1" });
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });

      await useCase.execute("ms1", "user1");
      expect(magicSchoolServiceMock.softDelete).toHaveBeenCalledWith("ms1");
    });
  });

  describe("RestoreMagicSchool", () => {
    it("debe restaurar la escuela de magia si el usuario tiene permisos", async () => {
      const useCase = new RestoreMagicSchool(magicSchoolServiceMock, systemServiceMock);
      magicSchoolServiceMock.getById.mockResolvedValue({ id: "ms1", ruleset: "sys1" });
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });

      await useCase.execute("ms1", "user1");
      expect(magicSchoolServiceMock.restore).toHaveBeenCalledWith("ms1");
    });
  });
});
