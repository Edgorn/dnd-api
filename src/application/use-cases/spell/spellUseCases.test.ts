import { describe, it, expect, vi, beforeEach } from "vitest";
import CreateSpell from "./createSpell.use-case";
import GetSpellsBySystems from "./getSpellsBySystems.use-case";
import GetSpellById from "./getSpellById.use-case";
import UpdateSpell from "./updateSpell.use-case";
import SoftDeleteSpell from "./softDeleteSpell.use-case";
import RestoreSpell from "./restoreSpell.use-case";
import GetSpellsByLevel from "./getSpellsByLevel.use-case";
import GetRitualSpells from "./getRitualSpells.use-case";
import { AppError, NotFoundError } from "../../../domain/errors/AppError";

describe("Spell Use Cases", () => {
  let spellServiceMock: any;
  let systemServiceMock: any;

  beforeEach(() => {
    spellServiceMock = {
      create: vi.fn(),
      update: vi.fn(),
      getBySystems: vi.fn(),
      getById: vi.fn(),
      softDelete: vi.fn(),
      restore: vi.fn(),
      getSpellsByLevel: vi.fn(),
      getRitualSpells: vi.fn()
    };

    systemServiceMock = {
      getById: vi.fn()
    };
  });

  describe("CreateSpell", () => {
    it("should create a spell successfully when system exists and user is publisher", async () => {
      const useCase = new CreateSpell(spellServiceMock, systemServiceMock);
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });
      spellServiceMock.create.mockResolvedValue({ id: "spell1", name: "Fireball" });

      const input = { ruleset: "sys1", name: "Fireball", level: 3, description: ["Boom"], classes: ["wizard"] };
      const result = await useCase.execute(input, "user1");

      expect(result).toEqual({ id: "spell1", name: "Fireball" });
      expect(spellServiceMock.create).toHaveBeenCalledWith(input);
    });

    it("should throw error if system is not found", async () => {
      const useCase = new CreateSpell(spellServiceMock, systemServiceMock);
      systemServiceMock.getById.mockResolvedValue(null);

      const input = { ruleset: "sys1", name: "Fireball", level: 3, description: ["Boom"], classes: [] };
      await expect(useCase.execute(input, "user1")).rejects.toThrow(AppError);
    });

    it("should throw 403 if user is not system publisher", async () => {
      const useCase = new CreateSpell(spellServiceMock, systemServiceMock);
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "otherUser" });

      const input = { ruleset: "sys1", name: "Fireball", level: 3, description: ["Boom"], classes: [] };
      await expect(useCase.execute(input, "user1")).rejects.toThrow("No tienes permisos");
    });
  });

  describe("GetSpellsBySystems", () => {
    it("should delegate call to spellService", async () => {
      const useCase = new GetSpellsBySystems(spellServiceMock);
      spellServiceMock.getBySystems.mockResolvedValue([{ id: "spell1" }]);

      const result = await useCase.execute(["sys1"]);
      expect(result).toEqual([{ id: "spell1" }]);
      expect(spellServiceMock.getBySystems).toHaveBeenCalledWith(["sys1"]);
    });
  });

  describe("GetSpellById", () => {
    it("should return spell if found", async () => {
      const useCase = new GetSpellById(spellServiceMock);
      spellServiceMock.getById.mockResolvedValue({ id: "spell1", name: "Fireball" });

      const result = await useCase.execute("spell1");
      expect(result).toEqual({ id: "spell1", name: "Fireball" });
    });

    it("should throw NotFoundError if spell does not exist", async () => {
      const useCase = new GetSpellById(spellServiceMock);
      spellServiceMock.getById.mockResolvedValue(null);

      await expect(useCase.execute("spell1")).rejects.toThrow(NotFoundError);
    });
  });

  describe("UpdateSpell", () => {
    it("should update spell when found and user has permission", async () => {
      const useCase = new UpdateSpell(spellServiceMock, systemServiceMock);
      spellServiceMock.getById.mockResolvedValue({ id: "spell1", ruleset: "sys1" });
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });
      spellServiceMock.update.mockResolvedValue({ id: "spell1", name: "Updated Fireball" });

      const result = await useCase.execute({ id: "spell1", name: "Updated Fireball" }, "user1");
      expect(result).toEqual({ id: "spell1", name: "Updated Fireball" });
    });
  });

  describe("SoftDeleteSpell", () => {
    it("should soft delete spell when authorized", async () => {
      const useCase = new SoftDeleteSpell(spellServiceMock, systemServiceMock);
      spellServiceMock.getById.mockResolvedValue({ id: "spell1", ruleset: "sys1" });
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });

      await useCase.execute("spell1", "user1");
      expect(spellServiceMock.softDelete).toHaveBeenCalledWith("spell1");
    });
  });

  describe("RestoreSpell", () => {
    it("should restore spell when authorized", async () => {
      const useCase = new RestoreSpell(spellServiceMock, systemServiceMock);
      spellServiceMock.getById.mockResolvedValue({ id: "spell1", ruleset: "sys1" });
      systemServiceMock.getById.mockResolvedValue({ id: "sys1", publisher: "user1" });

      await useCase.execute("spell1", "user1");
      expect(spellServiceMock.restore).toHaveBeenCalledWith("spell1");
    });
  });

  describe("GetSpellsByLevel", () => {
    it("should return spells filtered by level", async () => {
      const useCase = new GetSpellsByLevel(spellServiceMock);
      spellServiceMock.getSpellsByLevel.mockResolvedValue([{ id: "s1", level: 1 }]);

      const res = await useCase.execute(1, ["sys1"], "wizard");
      expect(res).toEqual([{ id: "s1", level: 1 }]);
      expect(spellServiceMock.getSpellsByLevel).toHaveBeenCalledWith(1, ["sys1"], "wizard");
    });
  });

  describe("GetRitualSpells", () => {
    it("should return ritual spells", async () => {
      const useCase = new GetRitualSpells(spellServiceMock);
      spellServiceMock.getRitualSpells.mockResolvedValue([{ id: "s1", ritual: true }]);

      const res = await useCase.execute(["sys1"]);
      expect(res).toEqual([{ id: "s1", ritual: true }]);
      expect(spellServiceMock.getRitualSpells).toHaveBeenCalledWith(["sys1"]);
    });
  });
});
