import { describe, expect, it, vi } from "vitest";
import GetCharacterClassCatalog from "./getCharacterClassCatalog.use-case";
import CharacterClassService from "../../../domain/services/characterClass.service";

const catalog = [
  { id: "class1", name: "Mago", ruleset: "sys1" }
];

describe("GetCharacterClassCatalog", () => {
  it("returns an empty list when no ruleset is provided", async () => {
    const characterClassService = {
      getCatalog: vi.fn()
    } as unknown as CharacterClassService;

    const useCase = new GetCharacterClassCatalog(characterClassService);
    const result = await useCase.execute();

    expect(result).toEqual([]);
    expect(characterClassService.getCatalog).not.toHaveBeenCalled();
  });

  it("requests the catalog without multiclass by default", async () => {
    const characterClassService = {
      getCatalog: vi.fn().mockResolvedValue(catalog)
    } as unknown as CharacterClassService;

    const useCase = new GetCharacterClassCatalog(characterClassService);
    const result = await useCase.execute(["sys1"]);

    expect(characterClassService.getCatalog).toHaveBeenCalledWith(["sys1"], false);
    expect(result).toEqual(catalog);
  });

  it("forwards includeMulticlass", async () => {
    const characterClassService = {
      getCatalog: vi.fn().mockResolvedValue(catalog)
    } as unknown as CharacterClassService;

    const useCase = new GetCharacterClassCatalog(characterClassService);
    await useCase.execute(["sys1"], true);

    expect(characterClassService.getCatalog).toHaveBeenCalledWith(["sys1"], true);
  });
});
