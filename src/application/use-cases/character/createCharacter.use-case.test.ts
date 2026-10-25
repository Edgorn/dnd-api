import { describe, it, expect, vi, beforeEach } from "vitest";
import CreateCharacter from "./createCharacter.use-case";
import SystemService from "../../../domain/services/system.service";
import CharacterService from "../../../domain/services/character.service";
import IEquipmentRepository from "../../../domain/repositories/IEquipmentRepository";

describe("CreateCharacter systems", () => {
  const characterService = {
    create: vi.fn().mockResolvedValue({ id: "char-1" }),
  };
  const systemService = {
    assertSingleBase: vi.fn().mockResolvedValue(undefined),
  };
  const equipmentRepository = {
    getById: vi.fn(),
  };
  let useCase: CreateCharacter;

  beforeEach(() => {
    vi.clearAllMocks();
    characterService.create.mockResolvedValue({ id: "char-1" });
    systemService.assertSingleBase.mockResolvedValue(undefined);
    useCase = new CreateCharacter(
      characterService as unknown as CharacterService,
      systemService as unknown as SystemService,
      equipmentRepository as unknown as IEquipmentRepository
    );
  });

  it("validates that character systems resolve to a single base", async () => {
    await useCase.execute({
      name: "Astarion",
      user: "user-1",
      systems: ["phb", "mm"],
      equipment: [],
    } as never);

    expect(systemService.assertSingleBase).toHaveBeenCalledWith(["phb", "mm"]);
    expect(characterService.create).toHaveBeenCalled();
  });
});
