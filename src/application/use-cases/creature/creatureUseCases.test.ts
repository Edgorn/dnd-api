import { describe, it, expect, vi, beforeEach } from "vitest";
import CreateCreatureUseCase from "./createCreature.use-case";
import UpdateCreatureUseCase from "./updateCreature.use-case";
import SoftDeleteCreature from "./softDeleteCreature.use-case";
import RestoreCreature from "./restoreCreature.use-case";
import GetCreaturesBySystems from "./getCreaturesBySystems.use-case";
import { AppError } from "../../../domain/errors/AppError";
import { CREATURE_ANY_RACE, CreateCreature } from "../../../domain/types/creature.types";

const priestInput: CreateCreature = {
  name: "Sacerdote",
  ruleset: "sys1",
  creatureTypeId: "type1",
  size: "Mediano",
  alignment: "cualquier alineamiento",
  HPMax: 27,
  speed: { walk: 25 },
  challenge_rating: 2,
  xp: 450,
  prof_bonus: 2,
  attributes: [{ key: "wis", value: 16 }],
  skill_bonuses: [{ skillId: "medicine", bonus: 5 }]
};

const sampleCreature = {
  id: "creature1",
  name: "Sacerdote",
  ruleset: "sys1",
  creatureType: { id: "type1", name: "Humanoide", ruleset: "sys1" }
};

describe("Creature use cases", () => {
  let creatureService: {
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    getBySystems: ReturnType<typeof vi.fn>;
    getById: ReturnType<typeof vi.fn>;
    softDelete: ReturnType<typeof vi.fn>;
    restore: ReturnType<typeof vi.fn>;
  };
  let systemService: { getById: ReturnType<typeof vi.fn>; getSystemsAndAncestors: ReturnType<typeof vi.fn> };
  let creatureTypeService: { getById: ReturnType<typeof vi.fn> };
  let raceService: { obtenerPorId: ReturnType<typeof vi.fn> };
  let attributeService: { getBySystems: ReturnType<typeof vi.fn> };
  let skillService: { getById: ReturnType<typeof vi.fn> };
  let spellService: { getById: ReturnType<typeof vi.fn> };
  let damageService: { getById: ReturnType<typeof vi.fn> };
  let languageService: { getById: ReturnType<typeof vi.fn> };
  let equipmentService: { getById: ReturnType<typeof vi.fn> };
  let estadoRepository: { obtenerEstadosPorIndices: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    creatureService = {
      create: vi.fn(),
      update: vi.fn(),
      getBySystems: vi.fn(),
      getById: vi.fn(),
      softDelete: vi.fn(),
      restore: vi.fn()
    };
    systemService = {
      getById: vi.fn().mockResolvedValue({ id: "sys1", publisher: "user1" }),
      getSystemsAndAncestors: vi.fn().mockResolvedValue(["sys1"])
    };
    creatureTypeService = {
      getById: vi.fn().mockResolvedValue({ id: "type1", name: "Humanoide", ruleset: "sys1", deletedAt: null })
    };
    raceService = { obtenerPorId: vi.fn() };
    attributeService = {
      getBySystems: vi.fn().mockResolvedValue([{ id: "wis", key: "wis", name: "Sabiduría", ruleset: "sys1" }])
    };
    skillService = { getById: vi.fn() };
    spellService = { getById: vi.fn() };
    damageService = { getById: vi.fn() };
    languageService = { getById: vi.fn() };
    equipmentService = { getById: vi.fn() };
    estadoRepository = { obtenerEstadosPorIndices: vi.fn() };
  });

  function createUseCase() {
    return new CreateCreatureUseCase(
      creatureService as never,
      systemService as never,
      creatureTypeService as never,
      raceService as never,
      attributeService as never,
      skillService as never,
      spellService as never,
      damageService as never,
      languageService as never,
      equipmentService as never,
      estadoRepository as never
    );
  }

  describe("CreateCreature", () => {
    it("crea la criatura cuando el usuario es el publicador y las referencias existen", async () => {
      skillService.getById.mockResolvedValue({ id: "medicine", ruleset: "sys1", deletedAt: null });
      creatureService.create.mockResolvedValue(sampleCreature);
      const useCase = createUseCase();

      const result = await useCase.execute(priestInput, "user1");

      expect(result).toEqual(sampleCreature);
      expect(creatureService.create).toHaveBeenCalledWith(priestInput);
    });

    it("rechaza el alta si el usuario no es el publicador", async () => {
      systemService.getById.mockResolvedValue({ id: "sys1", publisher: "other" });
      const useCase = createUseCase();

      await expect(useCase.execute(priestInput, "user1")).rejects.toThrow("No tienes permisos");
      expect(creatureService.create).not.toHaveBeenCalled();
    });

    it("no consulta el catálogo de razas con raza cualquiera o sin raza", async () => {
      skillService.getById.mockResolvedValue({ id: "medicine", ruleset: "sys1", deletedAt: null });
      creatureService.create.mockResolvedValue(sampleCreature);
      const useCase = createUseCase();

      await useCase.execute({ ...priestInput, race: CREATURE_ANY_RACE }, "user1");
      await useCase.execute({ ...priestInput, race: null }, "user1");
      await useCase.execute(priestInput, "user1");

      expect(raceService.obtenerPorId).not.toHaveBeenCalled();
    });

    it("rechaza el alta si la raza no existe", async () => {
      raceService.obtenerPorId.mockResolvedValue(undefined);
      const useCase = createUseCase();

      await expect(useCase.execute({ ...priestInput, race: "missing" }, "user1"))
        .rejects.toMatchObject({ message: "Raza no encontrada", statusCode: 404 });
      expect(creatureService.create).not.toHaveBeenCalled();
    });

    it("acepta el alta si la raza pertenece al sistema", async () => {
      skillService.getById.mockResolvedValue({ id: "medicine", ruleset: "sys1", deletedAt: null });
      raceService.obtenerPorId.mockResolvedValue({ id: "elf", name: "Elfo", ruleset: "sys1" });
      creatureService.create.mockResolvedValue(sampleCreature);
      const useCase = createUseCase();
      const input = { ...priestInput, race: "elf" };

      await useCase.execute(input, "user1");

      expect(raceService.obtenerPorId).toHaveBeenCalledWith("elf");
      expect(creatureService.create).toHaveBeenCalledWith(input);
    });

    it("rechaza el alta si la aptitud mágica no pertenece al sistema", async () => {
      skillService.getById.mockResolvedValue({ id: "medicine", ruleset: "sys1", deletedAt: null });
      const useCase = createUseCase();

      await expect(useCase.execute({
        ...priestInput,
        spellcasting: {
          abilityId: "attr-int",
          slots: {},
          spells: []
        }
      }, "user1")).rejects.toMatchObject({
        message: "La aptitud mágica no pertenece a este sistema ni a sus ancestros",
        statusCode: 400
      });
      expect(creatureService.create).not.toHaveBeenCalled();
    });

    it("rechaza el alta si un conjuro innato no existe", async () => {
      skillService.getById.mockResolvedValue({ id: "medicine", ruleset: "sys1", deletedAt: null });
      spellService.getById.mockImplementation(async (id: string) =>
        id === "detect-magic" ? { id, ruleset: "sys1", deletedAt: null } : null
      );
      const useCase = createUseCase();

      await expect(useCase.execute({
        ...priestInput,
        innateSpellcasting: {
          spells: [{ usage: { type: "perDay", value: 3 }, spells: ["detect-magic", "missing"] }]
        }
      }, "user1")).rejects.toMatchObject({ message: "Conjuro no encontrado", statusCode: 404 });
      expect(spellService.getById).toHaveBeenCalledWith("missing");
      expect(creatureService.create).not.toHaveBeenCalled();
    });

    it("rechaza el alta si la aptitud mágica innata no pertenece al sistema", async () => {
      skillService.getById.mockResolvedValue({ id: "medicine", ruleset: "sys1", deletedAt: null });
      const useCase = createUseCase();

      await expect(useCase.execute({
        ...priestInput,
        innateSpellcasting: { abilityId: "attr-int", spells: [] }
      }, "user1")).rejects.toMatchObject({
        message: "La aptitud mágica no pertenece a este sistema ni a sus ancestros",
        statusCode: 400
      });
      expect(creatureService.create).not.toHaveBeenCalled();
    });

    it("crea la criatura con conjuros innatos del sistema", async () => {
      skillService.getById.mockResolvedValue({ id: "medicine", ruleset: "sys1", deletedAt: null });
      spellService.getById.mockImplementation(async (id: string) => ({ id, ruleset: "sys1", deletedAt: null }));
      creatureService.create.mockResolvedValue(sampleCreature);
      const useCase = createUseCase();
      const input: CreateCreature = {
        ...priestInput,
        innateSpellcasting: {
          abilityId: "wis",
          spells: [{ usage: { type: "perDay", value: 1 }, spells: ["levitate"] }]
        }
      };

      await useCase.execute(input, "user1");

      expect(spellService.getById).toHaveBeenCalledWith("levitate");
      expect(creatureService.create).toHaveBeenCalledWith(input);
    });

    it("rechaza el alta si una habilidad no existe", async () => {
      skillService.getById.mockResolvedValue(null);
      const useCase = createUseCase();

      await expect(useCase.execute(priestInput, "user1")).rejects.toBeInstanceOf(AppError);
      expect(creatureService.create).not.toHaveBeenCalled();
    });
  });

  describe("UpdateCreature", () => {
    it("lanza 404 si la criatura no existe", async () => {
      const useCase = new UpdateCreatureUseCase(
        creatureService as never,
        systemService as never,
        creatureTypeService as never,
        raceService as never,
        attributeService as never,
        skillService as never,
        spellService as never,
        damageService as never,
        languageService as never,
        equipmentService as never,
        estadoRepository as never
      );
      creatureService.getById.mockResolvedValue(null);

      await expect(useCase.execute({ id: "missing", name: "Sacerdote" }, "user1"))
        .rejects.toBeInstanceOf(AppError);
    });

    it("revalida la raza guardada cuando cambia el sistema y no se envía race", async () => {
      const useCase = new UpdateCreatureUseCase(
        creatureService as never,
        systemService as never,
        creatureTypeService as never,
        raceService as never,
        attributeService as never,
        skillService as never,
        spellService as never,
        damageService as never,
        languageService as never,
        equipmentService as never,
        estadoRepository as never
      );
      creatureService.getById.mockResolvedValue({
        ...sampleCreature,
        race: { id: "elf", name: "Elfo", ruleset: "sys1", creatureTypeId: "type1" }
      });
      systemService.getById.mockImplementation(async (id: string) => ({ id, publisher: "user1" }));
      raceService.obtenerPorId.mockResolvedValue(undefined);

      await expect(useCase.execute({ id: "creature1", ruleset: "sys2" }, "user1"))
        .rejects.toMatchObject({ message: "Raza no encontrada", statusCode: 404 });
      expect(raceService.obtenerPorId).toHaveBeenCalledWith("elf");
      expect(creatureService.update).not.toHaveBeenCalled();
    });
  });

  describe("SoftDeleteCreature", () => {
    it("borra la criatura cuando el usuario es el publicador", async () => {
      const useCase = new SoftDeleteCreature(creatureService as never, systemService as never);
      creatureService.getById.mockResolvedValue(sampleCreature);

      await useCase.execute("creature1", "user1");

      expect(creatureService.softDelete).toHaveBeenCalledWith("creature1");
    });
  });

  describe("RestoreCreature", () => {
    it("restaura la criatura cuando el usuario es el publicador", async () => {
      const useCase = new RestoreCreature(creatureService as never, systemService as never);
      creatureService.getById.mockResolvedValue(sampleCreature);

      await useCase.execute("creature1", "user1");

      expect(creatureService.restore).toHaveBeenCalledWith("creature1");
    });
  });

  describe("GetCreaturesBySystems", () => {
    it("delega el listado filtrado por tipo", async () => {
      const useCase = new GetCreaturesBySystems(creatureService as never);
      creatureService.getBySystems.mockResolvedValue([sampleCreature]);

      const result = await useCase.execute(["sys1"], { creatureTypeId: "type1" }, "user1");

      expect(result).toEqual([sampleCreature]);
      expect(creatureService.getBySystems).toHaveBeenCalledWith(["sys1"], { creatureTypeId: "type1" }, "user1");
    });
  });
});
