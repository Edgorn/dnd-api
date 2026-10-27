import { describe, it, expect, vi, beforeEach } from "vitest";
import UpdateCompanions from "./updateCompanions.use-case";
import { AppError, NotFoundError, ValidationError } from "../../../domain/errors/AppError";

const horseId = "507f1f77bcf86cd799439011";
const companionId = "507f1f77bcf86cd799439021";

describe("UpdateCompanions", () => {
  let characterRepository: {
    getCompanionRoster: ReturnType<typeof vi.fn>;
    saveCompanions: ReturnType<typeof vi.fn>;
  };
  let creatureRepository: { getById: ReturnType<typeof vi.fn> };
  let systemRepository: { getSystemsAndAncestors: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    characterRepository = {
      getCompanionRoster: vi.fn().mockResolvedValue({
        companions: [],
        systems: ["sys1"],
        inventory: [],
      }),
      saveCompanions: vi.fn().mockResolvedValue({ companions: [] }),
    };
    creatureRepository = {
      getById: vi.fn().mockResolvedValue({
        id: horseId,
        ruleset: "sys1",
        HPMax: 19,
        canBeMount: true,
        deletedAt: null,
      }),
    };
    systemRepository = {
      getSystemsAndAncestors: vi.fn().mockResolvedValue(["sys1"]),
    };
  });

  function useCase() {
    return new UpdateCompanions(
      characterRepository as never,
      creatureRepository as never,
      systemRepository as never
    );
  }

  it("merges, validates creatures and persists the roster", async () => {
    const expected = {
      companions: [{ id: companionId, name: "Relámpago", kind: "mount", creatureId: horseId }],
    };
    characterRepository.saveCompanions.mockResolvedValue(expected);

    const result = await useCase().execute(
      "char1",
      [{ name: "Relámpago", kind: "mount", creatureId: horseId }],
      "user1"
    );

    expect(systemRepository.getSystemsAndAncestors).toHaveBeenCalledWith(["sys1"]);
    expect(creatureRepository.getById).toHaveBeenCalledWith(horseId);
    expect(characterRepository.saveCompanions).toHaveBeenCalled();
    expect(result).toEqual(expected);
  });

  it("rejects a mount that cannot be ridden", async () => {
    creatureRepository.getById.mockResolvedValue({
      id: horseId,
      ruleset: "sys1",
      canBeMount: false,
      deletedAt: null,
    });

    await expect(
      useCase().execute(
        "char1",
        [{ name: "Lobo", kind: "mount", creatureId: horseId }],
        "user1"
      )
    ).rejects.toThrow(ValidationError);
    expect(characterRepository.saveCompanions).not.toHaveBeenCalled();
  });

  it("should propagate NotFoundError when character does not exist", async () => {
    characterRepository.getCompanionRoster.mockRejectedValue(
      new NotFoundError("No se encontró el personaje con id: char1")
    );

    await expect(useCase().execute("char1", [], "user1")).rejects.toThrow(NotFoundError);
  });

  it("should propagate 403 when user cannot access the character", async () => {
    characterRepository.getCompanionRoster.mockRejectedValue(
      new AppError("No tienes permiso para consultar este personaje", 403)
    );

    await expect(useCase().execute("char1", [], "user2")).rejects.toThrow(AppError);
    await expect(useCase().execute("char1", [], "user2")).rejects.toMatchObject({
      statusCode: 403,
    });
  });
});
