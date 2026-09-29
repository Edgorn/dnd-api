import { describe, it, expect, vi, beforeEach } from "vitest";
import CreateCondition from "./createCondition.use-case";
import UpdateCondition from "./updateCondition.use-case";
import SoftDeleteCondition from "./softDeleteCondition.use-case";
import RestoreCondition from "./restoreCondition.use-case";
import GetConditionsBySystem from "./getConditionsBySystem.use-case";
import { AppError } from "../../../domain/errors/AppError";

const sampleCondition = {
  id: "cond1",
  name: "Envenenado",
  ruleset: "sys1",
  description: "El objetivo sufre desventaja"
};

describe("Condition use cases", () => {
  let conditionServiceMock: {
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
    conditionServiceMock = {
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

  describe("CreateCondition", () => {
    it("crea el estado cuando el usuario es el publicador del sistema", async () => {
      const useCase = new CreateCondition(conditionServiceMock as never, systemServiceMock as never);
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });
      conditionServiceMock.create.mockResolvedValue(sampleCondition);

      const input = { name: "Envenenado", ruleset: "sys1", description: "El objetivo sufre desventaja" };
      const result = await useCase.execute(input, "user1");

      expect(result).toEqual(sampleCondition);
      expect(conditionServiceMock.create).toHaveBeenCalledWith(input);
    });

    it("rechaza el alta si el usuario no es el publicador", async () => {
      const useCase = new CreateCondition(conditionServiceMock as never, systemServiceMock as never);
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "other" });

      await expect(useCase.execute({ name: "Aturdido", ruleset: "sys1" }, "user1"))
        .rejects.toThrow("No tienes permisos");
      expect(conditionServiceMock.create).not.toHaveBeenCalled();
    });
  });

  describe("UpdateCondition", () => {
    it("actualiza el estado cuando el usuario es el publicador", async () => {
      const useCase = new UpdateCondition(conditionServiceMock as never, systemServiceMock as never);
      conditionServiceMock.getById.mockResolvedValue(sampleCondition);
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });
      conditionServiceMock.update.mockResolvedValue({ ...sampleCondition, name: "Paralizado" });

      const result = await useCase.execute({ id: "cond1", name: "Paralizado" }, "user1");

      expect(result.name).toBe("Paralizado");
    });

    it("lanza 404 si el identificador no corresponde a un estado", async () => {
      const useCase = new UpdateCondition(conditionServiceMock as never, systemServiceMock as never);
      conditionServiceMock.getById.mockResolvedValue(null);

      await expect(useCase.execute({ id: "missing", name: "Aturdido" }, "user1"))
        .rejects.toBeInstanceOf(AppError);
    });
  });

  describe("SoftDeleteCondition", () => {
    it("borra el estado cuando el usuario es el publicador", async () => {
      const useCase = new SoftDeleteCondition(conditionServiceMock as never, systemServiceMock as never);
      conditionServiceMock.getById.mockResolvedValue(sampleCondition);
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });

      await useCase.execute("cond1", "user1");

      expect(conditionServiceMock.softDelete).toHaveBeenCalledWith("cond1");
    });
  });

  describe("RestoreCondition", () => {
    it("restaura el estado cuando el usuario es el publicador", async () => {
      const useCase = new RestoreCondition(conditionServiceMock as never, systemServiceMock as never);
      conditionServiceMock.getById.mockResolvedValue(sampleCondition);
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });

      await useCase.execute("cond1", "user1");

      expect(conditionServiceMock.restore).toHaveBeenCalledWith("cond1");
    });
  });

  describe("GetConditionsBySystem", () => {
    it("delega el listado en el servicio con el usuario autenticado", async () => {
      const useCase = new GetConditionsBySystem(conditionServiceMock as never);
      conditionServiceMock.getBySystems.mockResolvedValue([sampleCondition]);

      const result = await useCase.execute(["sys1"], "user1");

      expect(result).toEqual([sampleCondition]);
      expect(conditionServiceMock.getBySystems).toHaveBeenCalledWith(["sys1"], "user1");
    });
  });
});
