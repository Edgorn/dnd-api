import { describe, it, expect, vi, beforeEach } from "vitest";
import RemoveCompanion from "./removeCompanion.use-case";
import { ConflictError, NotFoundError } from "../../../domain/errors/AppError";

const companionId = "507f1f77bcf86cd799439021";

describe("RemoveCompanion", () => {
  let characterRepository: {
    getCompanionRoster: ReturnType<typeof vi.fn>;
    removeCompanion: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    characterRepository = {
      getCompanionRoster: vi.fn().mockResolvedValue({
        companions: [{ id: companionId, name: "Relámpago", kind: "mount" }],
        systems: [],
        inventory: [],
      }),
      removeCompanion: vi.fn().mockResolvedValue({ companions: [] }),
    };
  });

  function useCase() {
    return new RemoveCompanion(characterRepository as never);
  }

  it("removes a companion that holds no inventory", async () => {
    await useCase().execute("char1", "user1", companionId);
    expect(characterRepository.removeCompanion).toHaveBeenCalledWith("char1", "user1", companionId);
  });

  it("returns 409 when the companion holds items", async () => {
    characterRepository.getCompanionRoster.mockResolvedValue({
      companions: [{ id: companionId, name: "Relámpago", kind: "mount" }],
      systems: [],
      inventory: [{ holderId: companionId }],
    });
    await expect(useCase().execute("char1", "user1", companionId)).rejects.toThrow(ConflictError);
    expect(characterRepository.removeCompanion).not.toHaveBeenCalled();
  });

  it("returns 409 when the companion draws a vehicle", async () => {
    characterRepository.getCompanionRoster.mockResolvedValue({
      companions: [{ id: companionId, name: "Relámpago", kind: "mount" }],
      systems: [],
      inventory: [{ drawnBy: [companionId] }],
    });
    await expect(useCase().execute("char1", "user1", companionId)).rejects.toThrow(ConflictError);
  });

  it("throws NotFoundError when the companion is missing", async () => {
    characterRepository.getCompanionRoster.mockResolvedValue({
      companions: [],
      systems: [],
      inventory: [],
    });
    await expect(useCase().execute("char1", "user1", companionId)).rejects.toThrow(NotFoundError);
  });
});
