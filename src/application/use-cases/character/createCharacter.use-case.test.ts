import { describe, it, expect, vi, beforeEach } from "vitest";
import CreateCharacter from "./createCharacter.use-case";
import SystemService from "../../../domain/services/system.service";
import CharacterService from "../../../domain/services/character.service";
import IEquipmentRepository from "../../../domain/repositories/IEquipmentRepository";
import { AppError } from "../../../domain/errors/AppError";

describe("CreateCharacter systems", () => {
  const characterService = {
    create: vi.fn().mockResolvedValue({ id: "char-1" }),
  };
  const systemService = {
    assertSingleBase: vi.fn().mockResolvedValue(undefined),
    assertRaceAllowed: vi.fn().mockResolvedValue(undefined),
    assertClassAllowed: vi.fn().mockResolvedValue(undefined),
  };
  const equipmentRepository = {
    getById: vi.fn(),
  };
  let useCase: CreateCharacter;

  beforeEach(() => {
    vi.clearAllMocks();
    characterService.create.mockResolvedValue({ id: "char-1" });
    systemService.assertSingleBase.mockResolvedValue(undefined);
    systemService.assertRaceAllowed.mockResolvedValue(undefined);
    systemService.assertClassAllowed.mockResolvedValue(undefined);
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

  it("rejects a capped race", async () => {
    systemService.assertRaceAllowed.mockRejectedValue(new AppError("La raza no está disponible en este sistema", 400));

    await expect(useCase.execute({
      name: "Astarion",
      user: "user-1",
      systems: ["phb"],
      raceId: "elf",
      classId: "rogue",
      equipment: [],
    } as never)).rejects.toMatchObject({ statusCode: 400 });
    expect(characterService.create).not.toHaveBeenCalled();
  });

  it("rejects a capped class", async () => {
    systemService.assertClassAllowed.mockRejectedValue(new AppError("La clase no está disponible en este sistema", 400));

    await expect(useCase.execute({
      name: "Astarion",
      user: "user-1",
      systems: ["phb"],
      raceId: "elf",
      classId: "wizard",
      equipment: [],
    } as never)).rejects.toMatchObject({ statusCode: 400 });
    expect(characterService.create).not.toHaveBeenCalled();
  });
});
