import { describe, expect, it, vi } from "vitest";
import GetCharacterClassSummaries from "./getCharacterClassSummaries.use-case";
import CharacterClassService from "../../../domain/services/characterClass.service";
import SubclassService from "../../../domain/services/subclass.service";
import SystemService from "../../../domain/services/system.service";
import { CharacterClassSummaryDraft } from "../../../domain/types/characterClass.types";

const longParagraph = `${"A".repeat(210)} extra`;

const draft: CharacterClassSummaryDraft = {
  id: "class1",
  name: "Mago",
  img: "wizard.png",
  description: ["", "  Primer párrafo  ", longParagraph],
  ruleset: "sys1",
  hit_die: 6,
  hasSpellcasting: true,
  subclassChoice: { name: "Tradiciones arcanas", level: 2 }
};

describe("GetCharacterClassSummaries", () => {
  it("returns an empty list when no ruleset is provided", async () => {
    const characterClassService = {
      getSummaries: vi.fn()
    } as unknown as CharacterClassService;
    const subclassService = {
      countByClassIds: vi.fn()
    } as unknown as SubclassService;
    const systemService = {
      getResolvedCatalogExclusions: vi.fn()
    } as unknown as SystemService;

    const useCase = new GetCharacterClassSummaries(characterClassService, subclassService, systemService);
    const result = await useCase.execute();

    expect(result).toEqual([]);
    expect(characterClassService.getSummaries).not.toHaveBeenCalled();
    expect(subclassService.countByClassIds).not.toHaveBeenCalled();
  });

  it("maps teasers and subclass counts without hydrating class details", async () => {
    const characterClassService = {
      getSummaries: vi.fn().mockResolvedValue([draft])
    } as unknown as CharacterClassService;
    const subclassService = {
      countByClassIds: vi.fn().mockResolvedValue(new Map([["class1", 3]]))
    } as unknown as SubclassService;
    const systemService = {
      getResolvedCatalogExclusions: vi.fn().mockResolvedValue({ raceIds: new Set(), classIds: new Set() })
    } as unknown as SystemService;

    const useCase = new GetCharacterClassSummaries(characterClassService, subclassService, systemService);
    const [result] = await useCase.execute(["sys1"]);

    expect(characterClassService.getSummaries).toHaveBeenCalledWith(["sys1"]);
    expect(subclassService.countByClassIds).toHaveBeenCalledWith(["class1"], ["sys1"]);
    expect(result).toEqual({
      id: "class1",
      name: "Mago",
      img: "wizard.png",
      descriptionTeaser: "Primer párrafo",
      ruleset: "sys1",
      hit_die: 6,
      hasSpellcasting: true,
      subclassChoice: { name: "Tradiciones arcanas", level: 2 },
      subclassCount: 3
    });
    expect(result).not.toHaveProperty("description");
  });

  it("omits excluded classes", async () => {
    const characterClassService = {
      getSummaries: vi.fn().mockResolvedValue([draft, { ...draft, id: "class2", name: "Guerrero" }])
    } as unknown as CharacterClassService;
    const subclassService = {
      countByClassIds: vi.fn().mockResolvedValue(new Map([["class2", 1]]))
    } as unknown as SubclassService;
    const systemService = {
      getResolvedCatalogExclusions: vi.fn().mockResolvedValue({ raceIds: new Set(), classIds: new Set(["class1"]) })
    } as unknown as SystemService;

    const useCase = new GetCharacterClassSummaries(characterClassService, subclassService, systemService);
    const result = await useCase.execute(["sys1"]);

    expect(result.map((item) => item.id)).toEqual(["class2"]);
    expect(subclassService.countByClassIds).toHaveBeenCalledWith(["class2"], ["sys1"]);
  });
});
