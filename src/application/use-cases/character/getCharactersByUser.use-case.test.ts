import { describe, it, expect, vi } from "vitest";
import GetCharactersByUser from "./getCharactersByUser.use-case";
import CharacterService from "../../../domain/services/character.service";
import { CharacterListItem } from "../../../domain/types/character.types";

const card: CharacterListItem = {
  id: "1",
  img: "",
  name: "Ada",
  race: "Humano",
  user: "Edgar",
  campaign: null,
  classes: [{ name: "Guerrero", level: 1 }],
  subclasses: [],
  ac: 12,
  hpMax: 12,
  hpCurrent: 12,
  xp: 0,
  xpMax: 300
};

describe("GetCharactersByUser", () => {
  it("delegates without combat seed by default", async () => {
    const characterService = {
      getByUser: vi.fn().mockResolvedValue([card])
    } as unknown as CharacterService;
    const useCase = new GetCharactersByUser(characterService);

    const result = await useCase.execute("user-1");

    expect(characterService.getByUser).toHaveBeenCalledWith("user-1", undefined);
    expect(result).toEqual([card]);
  });

  it("forwards includeCombatSeed", async () => {
    const withSeed: CharacterListItem = {
      ...card,
      attributes: [{ key: "dex", value: 14 }],
      systems: ["5e"],
      speed: { walk: 9 }
    };
    const characterService = {
      getByUser: vi.fn().mockResolvedValue([withSeed])
    } as unknown as CharacterService;
    const useCase = new GetCharactersByUser(characterService);

    const result = await useCase.execute("user-1", { includeCombatSeed: true });

    expect(characterService.getByUser).toHaveBeenCalledWith("user-1", { includeCombatSeed: true });
    expect(result[0].attributes).toEqual([{ key: "dex", value: 14 }]);
  });
});
