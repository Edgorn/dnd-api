import { describe, it, expect, vi, beforeEach } from "vitest";
import CreateProperty from "./createProperty.use-case";
import UpdateProperty from "./updateProperty.use-case";
import GetPropertyById from "./getPropertyById.use-case";
import GetPropertiesBySystems from "./getPropertiesBySystems.use-case";
import SoftDeleteProperty from "./softDeleteProperty.use-case";
import RestoreProperty from "./restoreProperty.use-case";
import { AppError, NotFoundError } from "../../../domain/errors/AppError";

describe("Property Use Cases", () => {
  let propertyServiceMock: any;
  let systemServiceMock: any;

  beforeEach(() => {
    propertyServiceMock = {
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

  describe("CreateProperty", () => {
    it("debe crear una propiedad si el sistema existe y el usuario es el creador", async () => {
      const useCase = new CreateProperty(propertyServiceMock, systemServiceMock);
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });
      propertyServiceMock.create.mockResolvedValue({ id: "prop1", name: "Sutileza", description: "Permite usar Destreza" });

      const input = { ruleset: "sys1", name: "Sutileza", description: "Permite usar Destreza" };
      const result = await useCase.execute(input, "user1");

      expect(result).toEqual({ id: "prop1", name: "Sutileza", description: "Permite usar Destreza" });
      expect(propertyServiceMock.create).toHaveBeenCalledWith(input);
    });

    it("debe lanzar error si el sistema no existe", async () => {
      const useCase = new CreateProperty(propertyServiceMock, systemServiceMock);
      systemServiceMock.getById.mockResolvedValue(null);

      const input = { ruleset: "sys1", name: "Sutileza", description: "Permite usar Destreza" };
      await expect(useCase.execute(input, "user1")).rejects.toThrow(AppError);
    });

    it("debe lanzar error 403 si el usuario no es el creador del sistema", async () => {
      const useCase = new CreateProperty(propertyServiceMock, systemServiceMock);
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "otherUser" });

      const input = { ruleset: "sys1", name: "Sutileza", description: "Permite usar Destreza" };
      await expect(useCase.execute(input, "user1")).rejects.toThrow("No tienes permisos");
    });
  });

  describe("GetPropertyById", () => {
    it("debe retornar la propiedad si existe", async () => {
      const useCase = new GetPropertyById(propertyServiceMock);
      propertyServiceMock.getById.mockResolvedValue({ id: "prop1", name: "Sutileza", description: "Permite usar Destreza" });

      const result = await useCase.execute("prop1");
      expect(result).toEqual({ id: "prop1", name: "Sutileza", description: "Permite usar Destreza" });
    });

    it("debe lanzar NotFoundError si no existe", async () => {
      const useCase = new GetPropertyById(propertyServiceMock);
      propertyServiceMock.getById.mockResolvedValue(null);

      await expect(useCase.execute("prop1")).rejects.toThrow(NotFoundError);
    });
  });

  describe("GetPropertiesBySystems", () => {
    it("debe solicitar las propiedades al servicio y excluir deletedAt", async () => {
      const useCase = new GetPropertiesBySystems(propertyServiceMock);
      propertyServiceMock.getBySystems.mockResolvedValue([
        { id: "prop1", name: "Sutileza", description: "Desc", deletedAt: null }
      ]);

      const result = await useCase.execute(["sys1"]);
      expect(result).toEqual([{ id: "prop1", name: "Sutileza", description: "Desc" }]);
      expect(propertyServiceMock.getBySystems).toHaveBeenCalledWith(["sys1"]);
    });
  });

  describe("UpdateProperty", () => {
    it("debe actualizar con éxito si el usuario tiene permisos", async () => {
      const useCase = new UpdateProperty(propertyServiceMock, systemServiceMock);
      propertyServiceMock.getById.mockResolvedValue({ id: "prop1", ruleset: "sys1" });
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });
      propertyServiceMock.update.mockResolvedValue({ id: "prop1", name: "Sutileza Modificada" });

      const result = await useCase.execute({ id: "prop1", name: "Sutileza Modificada" }, "user1");
      expect(result).toEqual({ id: "prop1", name: "Sutileza Modificada" });
    });

    it("debe lanzar NotFoundError si la propiedad no existe", async () => {
      const useCase = new UpdateProperty(propertyServiceMock, systemServiceMock);
      propertyServiceMock.getById.mockResolvedValue(null);

      await expect(useCase.execute({ id: "prop1", name: "Test" }, "user1")).rejects.toThrow(AppError);
    });
  });

  describe("SoftDeleteProperty", () => {
    it("debe realizar el borrado lógico si el usuario tiene permisos", async () => {
      const useCase = new SoftDeleteProperty(propertyServiceMock, systemServiceMock);
      propertyServiceMock.getById.mockResolvedValue({ id: "prop1", ruleset: "sys1" });
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });

      await useCase.execute("prop1", "user1");
      expect(propertyServiceMock.softDelete).toHaveBeenCalledWith("prop1");
    });
  });

  describe("RestoreProperty", () => {
    it("debe restaurar la propiedad si el usuario tiene permisos", async () => {
      const useCase = new RestoreProperty(propertyServiceMock, systemServiceMock);
      propertyServiceMock.getById.mockResolvedValue({ id: "prop1", ruleset: "sys1" });
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });

      await useCase.execute("prop1", "user1");
      expect(propertyServiceMock.restore).toHaveBeenCalledWith("prop1");
    });
  });
});
