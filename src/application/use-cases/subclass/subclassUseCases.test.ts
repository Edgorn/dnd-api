import { describe, it, expect, vi, beforeEach } from "vitest";
import CreateSubclass from "./createSubclass.use-case";
import UpdateSubclass from "./updateSubclass.use-case";
import GetSubclassesBySystems from "./getSubclassesBySystems.use-case";
import SoftDeleteSubclass from "./softDeleteSubclass.use-case";
import RestoreSubclass from "./restoreSubclass.use-case";
import { AppError } from "../../../domain/errors/AppError";

const classId = "507f1f77bcf86cd799439011";

describe("Subclass Use Cases", () => {
  let subclassServiceMock: {
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    getBySystems: ReturnType<typeof vi.fn>;
    getById: ReturnType<typeof vi.fn>;
    softDelete: ReturnType<typeof vi.fn>;
    restore: ReturnType<typeof vi.fn>;
  };
  let systemServiceMock: {
    getById: ReturnType<typeof vi.fn>;
    getSystemsAndAncestors: ReturnType<typeof vi.fn>;
  };
  let characterClassServiceMock: {
    getById: ReturnType<typeof vi.fn>;
  };

  const createdSubclass = {
    id: "sub1",
    ruleset: "sys-child",
    classId,
    name: "Escuela de Evocación",
    description: [],
    img: "",
    levels: []
  };

  beforeEach(() => {
    subclassServiceMock = {
      create: vi.fn(),
      update: vi.fn(),
      getBySystems: vi.fn(),
      getById: vi.fn(),
      softDelete: vi.fn(),
      restore: vi.fn()
    };
    systemServiceMock = {
      getById: vi.fn(),
      getSystemsAndAncestors: vi.fn()
    };
    characterClassServiceMock = {
      getById: vi.fn()
    };
  });

  describe("CreateSubclass", () => {
    it("creates a subclass when the user publishes the ruleset and the class is in the tree", async () => {
      const useCase = new CreateSubclass(
        subclassServiceMock as never,
        systemServiceMock as never,
        characterClassServiceMock as never
      );
      systemServiceMock.getById.mockResolvedValue({ id: "sys-child", publisher: "user1" });
      characterClassServiceMock.getById.mockResolvedValue({ id: classId, ruleset: "sys-parent" });
      systemServiceMock.getSystemsAndAncestors.mockResolvedValue(["sys-child", "sys-parent"]);
      subclassServiceMock.create.mockResolvedValue(createdSubclass);

      const input = { ruleset: "sys-child", classId, name: "Escuela de Evocación" };
      const result = await useCase.execute(input, "user1");

      expect(result).toEqual(createdSubclass);
      expect(subclassServiceMock.create).toHaveBeenCalledWith(input);
    });

    it("throws 403 when the user is not the system publisher", async () => {
      const useCase = new CreateSubclass(
        subclassServiceMock as never,
        systemServiceMock as never,
        characterClassServiceMock as never
      );
      systemServiceMock.getById.mockResolvedValue({ id: "sys-child", publisher: "other" });

      await expect(
        useCase.execute({ ruleset: "sys-child", classId, name: "Evocación" }, "user1")
      ).rejects.toBeInstanceOf(AppError);
      expect(subclassServiceMock.create).not.toHaveBeenCalled();
    });

    it("throws 404 when the class does not exist", async () => {
      const useCase = new CreateSubclass(
        subclassServiceMock as never,
        systemServiceMock as never,
        characterClassServiceMock as never
      );
      systemServiceMock.getById.mockResolvedValue({ id: "sys-child", publisher: "user1" });
      characterClassServiceMock.getById.mockResolvedValue(null);

      await expect(
        useCase.execute({ ruleset: "sys-child", classId, name: "Evocación" }, "user1")
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it("throws 400 when the class is outside the subclass ruleset tree", async () => {
      const useCase = new CreateSubclass(
        subclassServiceMock as never,
        systemServiceMock as never,
        characterClassServiceMock as never
      );
      systemServiceMock.getById.mockResolvedValue({ id: "sys-child", publisher: "user1" });
      characterClassServiceMock.getById.mockResolvedValue({ id: classId, ruleset: "sys-other" });
      systemServiceMock.getSystemsAndAncestors.mockResolvedValue(["sys-child", "sys-parent"]);

      await expect(
        useCase.execute({ ruleset: "sys-child", classId, name: "Evocación" }, "user1")
      ).rejects.toMatchObject({ statusCode: 400 });
      expect(subclassServiceMock.create).not.toHaveBeenCalled();
    });
  });

  describe("UpdateSubclass", () => {
    it("updates when the user publishes the existing ruleset", async () => {
      const useCase = new UpdateSubclass(
        subclassServiceMock as never,
        systemServiceMock as never,
        characterClassServiceMock as never
      );
      subclassServiceMock.getById.mockResolvedValue({ id: "sub1", ruleset: "sys-child", classId });
      systemServiceMock.getById.mockResolvedValue({ id: "sys-child", publisher: "user1" });
      subclassServiceMock.update.mockResolvedValue({ ...createdSubclass, name: "Evocación" });

      const result = await useCase.execute({ id: "sub1", name: "Evocación" }, "user1");
      expect(result.name).toBe("Evocación");
    });
  });

  describe("GetSubclassesBySystems", () => {
    it("returns an empty list when no rulesets are provided", async () => {
      const useCase = new GetSubclassesBySystems(subclassServiceMock as never);
      const result = await useCase.execute([]);
      expect(result).toEqual([]);
      expect(subclassServiceMock.getBySystems).not.toHaveBeenCalled();
    });

    it("forwards rulesets and classId to the service", async () => {
      const useCase = new GetSubclassesBySystems(subclassServiceMock as never);
      subclassServiceMock.getBySystems.mockResolvedValue([createdSubclass]);

      const result = await useCase.execute(["sys-child"], classId);
      expect(result).toEqual([createdSubclass]);
      expect(subclassServiceMock.getBySystems).toHaveBeenCalledWith(["sys-child"], classId);
    });
  });

  describe("SoftDeleteSubclass", () => {
    it("soft deletes when the user is the publisher", async () => {
      const useCase = new SoftDeleteSubclass(subclassServiceMock as never, systemServiceMock as never);
      subclassServiceMock.getById.mockResolvedValue({ id: "sub1", ruleset: "sys-child" });
      systemServiceMock.getById.mockResolvedValue({ id: "sys-child", publisher: "user1" });

      await useCase.execute("sub1", "user1");
      expect(subclassServiceMock.softDelete).toHaveBeenCalledWith("sub1");
    });
  });

  describe("RestoreSubclass", () => {
    it("restores when the user is the publisher", async () => {
      const useCase = new RestoreSubclass(subclassServiceMock as never, systemServiceMock as never);
      subclassServiceMock.getById.mockResolvedValue({ id: "sub1", ruleset: "sys-child" });
      systemServiceMock.getById.mockResolvedValue({ id: "sys-child", publisher: "user1" });

      await useCase.execute("sub1", "user1");
      expect(subclassServiceMock.restore).toHaveBeenCalledWith("sub1");
    });
  });
});
