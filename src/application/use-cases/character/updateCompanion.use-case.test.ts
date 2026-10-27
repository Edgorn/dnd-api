import { describe, it, expect, vi, beforeEach } from "vitest";
import UpdateCompanion from "./updateCompanion.use-case";
import { NotFoundError } from "../../../domain/errors/AppError";

const companionId = "507f1f77bcf86cd799439021";
const creatureId = "507f1f77bcf86cd799439011";

describe("UpdateCompanion", () => {
  let characterRepository: {
    getCompanionRoster: ReturnType<typeof vi.fn>;
    updateCompanion: ReturnType<typeof vi.fn>;
  };
  let creatureRepository: { getById: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    characterRepository = {
      getCompanionRoster: vi.fn().mockResolvedValue({
        companions: [{
          id: companionId,
          name: "Relámpago",
          kind: "mount",
          creatureId,
          hpCurrent: 19,
        }],
        systems: ["sys1"],
        inventory: [],
      }),
      updateCompanion: vi.fn().mockResolvedValue({ companions: [] }),
    };
    creatureRepository = {
      getById: vi.fn().mockResolvedValue({ id: creatureId, HPMax: 19 }),
    };
  });

  function useCase() {
    return new UpdateCompanion(characterRepository as never, creatureRepository as never);
  }

  it("clips hpCurrent to HPMax", async () => {
    await useCase().execute("char1", "user1", companionId, {
      name: "Relámpago II",
      hpCurrent: 40,
    });
    expect(characterRepository.updateCompanion).toHaveBeenCalledWith(
      "char1",
      "user1",
      companionId,
      { name: "Relámpago II", hpCurrent: 19 }
    );
  });

  it("does not go below 0", async () => {
    await useCase().execute("char1", "user1", companionId, { hpCurrent: -3 });
    expect(characterRepository.updateCompanion).toHaveBeenCalledWith(
      "char1",
      "user1",
      companionId,
      { hpCurrent: 0 }
    );
  });

  it("throws NotFoundError when the companion is missing", async () => {
    characterRepository.getCompanionRoster.mockResolvedValue({
      companions: [],
      systems: [],
      inventory: [],
    });
    await expect(
      useCase().execute("char1", "user1", companionId, { name: "X" })
    ).rejects.toThrow(NotFoundError);
  });
});
