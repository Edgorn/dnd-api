import { describe, expect, it, vi } from "vitest";
import GetCharacterClassById from "./getCharacterClassById.use-case";
import CharacterClassService from "../../../domain/services/characterClass.service";
import SubclassService from "../../../domain/services/subclass.service";
import SystemService from "../../../domain/services/system.service";
import { NotFoundError } from "../../../domain/errors/AppError";
import { CharacterClassApi } from "../../../domain/types/characterClass.types";
import { SubclassSummaryDraft } from "../../../domain/types/subclass.types";

const wizard: CharacterClassApi = {
  id: "class1",
  ruleset: "parent",
  name: "Mago",
  description: ["Lanza conjuros"],
  img: "wizard.png",
  hit_die: 6,
  proficiencies: [],
  saving_throws: [],
  traits: [],
  traits_data: {},
  prof_bonus: 2,
  god: false
};

const evocation: SubclassSummaryDraft = {
  id: "sub1",
  name: "Evocación",
  img: "evo.png",
  description: ["Especialista en daño"],
  ruleset: "parent",
  classId: "class1"
};

describe("GetCharacterClassById", () => {
  it("returns the hydrated class with subclass summaries", async () => {
    const characterClassService = {
      getById: vi.fn().mockResolvedValue(wizard)
    } as unknown as CharacterClassService;
    const subclassService = {
      getSummariesByClassAndSystems: vi.fn().mockResolvedValue([evocation])
    } as unknown as SubclassService;
    const systemService = {
      getSystemsAndAncestors: vi.fn().mockResolvedValue(["parent"]),
      getResolvedCatalogExclusions: vi.fn()
    } as unknown as SystemService;

    const useCase = new GetCharacterClassById(characterClassService, subclassService, systemService);
    const result = await useCase.execute("class1");

    expect(systemService.getSystemsAndAncestors).toHaveBeenCalledWith(["parent"]);
    expect(subclassService.getSummariesByClassAndSystems).toHaveBeenCalledWith("class1", ["parent"]);
    expect(result.subclasses).toEqual([{
      id: "sub1",
      name: "Evocación",
      img: "evo.png",
      descriptionTeaser: "Especialista en daño",
      ruleset: "parent",
      classId: "class1"
    }]);
    expect(result.subclasses?.[0]).not.toHaveProperty("levels");
    expect(result.subclasses?.[0]).not.toHaveProperty("traits");
    expect(result.subclasses?.[0]).not.toHaveProperty("description");
  });

  it("throws 404 when the class is outside the viewed ruleset ancestry", async () => {
    const characterClassService = {
      getById: vi.fn().mockResolvedValue(wizard)
    } as unknown as CharacterClassService;
    const subclassService = {
      getSummariesByClassAndSystems: vi.fn()
    } as unknown as SubclassService;
    const systemService = {
      getSystemsAndAncestors: vi.fn().mockResolvedValue(["child", "other"]),
      getResolvedCatalogExclusions: vi.fn()
    } as unknown as SystemService;

    const useCase = new GetCharacterClassById(characterClassService, subclassService, systemService);

    await expect(useCase.execute("class1", "child")).rejects.toBeInstanceOf(NotFoundError);
    expect(subclassService.getSummariesByClassAndSystems).not.toHaveBeenCalled();
  });

  it("throws 404 when the class is soft-deleted", async () => {
    const characterClassService = {
      getById: vi.fn().mockResolvedValue({ ...wizard, deletedAt: new Date() })
    } as unknown as CharacterClassService;
    const subclassService = {
      getSummariesByClassAndSystems: vi.fn()
    } as unknown as SubclassService;
    const systemService = {
      getSystemsAndAncestors: vi.fn()
    } as unknown as SystemService;

    const useCase = new GetCharacterClassById(characterClassService, subclassService, systemService);

    await expect(useCase.execute("class1")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("throws 404 when the class is excluded in the viewed ruleset", async () => {
    const characterClassService = {
      getById: vi.fn().mockResolvedValue(wizard)
    } as unknown as CharacterClassService;
    const subclassService = {
      getSummariesByClassAndSystems: vi.fn()
    } as unknown as SubclassService;
    const systemService = {
      getSystemsAndAncestors: vi.fn().mockResolvedValue(["child", "parent"]),
      getResolvedCatalogExclusions: vi.fn().mockResolvedValue({ raceIds: new Set(), classIds: new Set(["class1"]) })
    } as unknown as SystemService;

    const useCase = new GetCharacterClassById(characterClassService, subclassService, systemService);

    await expect(useCase.execute("class1", "child")).rejects.toBeInstanceOf(NotFoundError);
    expect(subclassService.getSummariesByClassAndSystems).not.toHaveBeenCalled();
  });
});
