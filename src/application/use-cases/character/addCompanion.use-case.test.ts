import { describe, it, expect, vi, beforeEach } from "vitest";
import AddCompanion from "./addCompanion.use-case";
import { NotFoundError, ValidationError } from "../../../domain/errors/AppError";

const horseId = "507f1f77bcf86cd799439011";
const ruleset = "sys1";

const horse = {
  id: horseId,
  name: "Caballo de monta",
  ruleset,
  HPMax: 19,
  canBeMount: true,
  deletedAt: null,
};

describe("AddCompanion", () => {
  let characterRepository: {
    getCompanionRoster: ReturnType<typeof vi.fn>;
    addCompanion: ReturnType<typeof vi.fn>;
  };
  let creatureRepository: { getById: ReturnType<typeof vi.fn> };
  let systemRepository: { getSystemsAndAncestors: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    characterRepository = {
      getCompanionRoster: vi.fn().mockResolvedValue({
        companions: [],
        systems: [ruleset],
        inventory: [],
      }),
      addCompanion: vi.fn().mockResolvedValue({
        companions: [{ id: "c1", name: "Relámpago", kind: "mount", creatureId: horseId, hpCurrent: 19 }],
      }),
    };
    creatureRepository = { getById: vi.fn().mockResolvedValue(horse) };
    systemRepository = { getSystemsAndAncestors: vi.fn().mockResolvedValue([ruleset]) };
  });

  function useCase() {
    return new AddCompanion(
      characterRepository as never,
      creatureRepository as never,
      systemRepository as never
    );
  }

  it("validates the creature system and initializes hpCurrent from HPMax", async () => {
    const result = await useCase().execute("char1", "user1", {
      name: "Relámpago",
      kind: "mount",
      creatureId: horseId,
      source: "purchase",
    });

    expect(creatureRepository.getById).toHaveBeenCalledWith(horseId);
    expect(systemRepository.getSystemsAndAncestors).toHaveBeenCalledWith([ruleset]);
    expect(characterRepository.addCompanion).toHaveBeenCalledWith("char1", "user1", {
      name: "Relámpago",
      kind: "mount",
      creatureId: horseId,
      source: "purchase",
      hpCurrent: 19,
    });
    expect(result.companions[0].hpCurrent).toBe(19);
  });

  it("rejects a mount without creatureId", async () => {
    await expect(
      useCase().execute("char1", "user1", { name: "Relámpago", kind: "mount" })
    ).rejects.toThrow(ValidationError);
    expect(characterRepository.addCompanion).not.toHaveBeenCalled();
  });

  it("rejects a creature from another ruleset", async () => {
    creatureRepository.getById.mockResolvedValue({ ...horse, ruleset: "other" });
    await expect(
      useCase().execute("char1", "user1", {
        name: "Relámpago",
        kind: "mount",
        creatureId: horseId,
      })
    ).rejects.toThrow(ValidationError);
  });

  it("throws NotFoundError when the creature is missing", async () => {
    creatureRepository.getById.mockResolvedValue(null);
    await expect(
      useCase().execute("char1", "user1", {
        name: "Relámpago",
        kind: "mount",
        creatureId: horseId,
      })
    ).rejects.toThrow(NotFoundError);
  });

  it("adds an animal even if the creature cannot be ridden", async () => {
    creatureRepository.getById.mockResolvedValue({ ...horse, canBeMount: false });
    characterRepository.addCompanion.mockResolvedValue({
      companions: [{ id: "c1", name: "Lobo", kind: "animal", creatureId: horseId, hpCurrent: 19 }],
    });
    await useCase().execute("char1", "user1", {
      name: "Lobo",
      kind: "animal",
      creatureId: horseId,
    });
    expect(characterRepository.addCompanion).toHaveBeenCalledWith(
      "char1",
      "user1",
      expect.objectContaining({ kind: "animal", hpCurrent: 19 })
    );
  });

  it("rejects a mount whose creature cannot be ridden", async () => {
    creatureRepository.getById.mockResolvedValue({ ...horse, canBeMount: false });
    await expect(
      useCase().execute("char1", "user1", {
        name: "Relámpago",
        kind: "mount",
        creatureId: horseId,
      })
    ).rejects.toThrow(ValidationError);
    expect(characterRepository.addCompanion).not.toHaveBeenCalled();
  });

  it("adds a narrative companion without looking up a creature", async () => {
    characterRepository.addCompanion.mockResolvedValue({
      companions: [{ id: "c1", name: "Aldric", kind: "narrative" }],
    });
    await useCase().execute("char1", "user1", { name: "Aldric" });
    expect(creatureRepository.getById).not.toHaveBeenCalled();
    expect(characterRepository.addCompanion).toHaveBeenCalledWith(
      "char1",
      "user1",
      expect.objectContaining({ name: "Aldric", kind: "narrative" })
    );
  });
});
