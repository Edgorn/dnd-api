import { describe, it, expect, vi, beforeEach } from "vitest";
import AddCharacterForm from "./addCharacterForm.use-case";
import { AppError, NotFoundError } from "../../../domain/errors/AppError";

const owlId = "507f1f77bcf86cd799439011";
const spellId = "507f1f77bcf86cd799439012";
const impId = "507f1f77bcf86cd799439013";
const chainTraitId = "507f1f77bcf86cd799439014";
const ruleset = "sys1";

const familiarSpell = {
  id: spellId,
  name: "Encontrar familiar",
  ruleset,
  creatureForm: {
    purpose: "companion" as const,
    choose: 1,
    replaceOnRecast: true,
    pool: { mode: "ids" as const, creatureIds: [owlId], creatures: [] }
  }
};

const truePolymorphSpell = {
  id: spellId,
  name: "Polimorfar verdadero",
  ruleset,
  creatureForm: {
    purpose: "target" as const,
    choose: 1,
    replaceOnRecast: true,
    pool: { mode: "filter" as const }
  }
};

const owl = {
  id: owlId,
  name: "Lechuza",
  ruleset,
  challenge_rating: 0,
  size: "Tiny",
  tags: ["familiar"],
  creatureType: { id: "beast" }
};

const imp = {
  id: impId,
  name: "Diablillo",
  ruleset,
  challenge_rating: 1,
  size: "Tiny",
  tags: [],
  creatureType: { id: "fiend" }
};

describe("AddCharacterForm", () => {
  let characterService: { addForm: ReturnType<typeof vi.fn>; getOwnedTraitIds: ReturnType<typeof vi.fn> };
  let spellService: { getById: ReturnType<typeof vi.fn> };
  let creatureService: { getById: ReturnType<typeof vi.fn> };
  let systemService: { getSystemsAndAncestors: ReturnType<typeof vi.fn> };
  let traitService: { getTraitsByIndexes: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    characterService = {
      addForm: vi.fn().mockResolvedValue({ id: "char1" }),
      getOwnedTraitIds: vi.fn().mockResolvedValue([])
    };
    spellService = { getById: vi.fn().mockResolvedValue(familiarSpell) };
    creatureService = { getById: vi.fn().mockResolvedValue(owl) };
    systemService = { getSystemsAndAncestors: vi.fn().mockResolvedValue([ruleset]) };
    traitService = { getTraitsByIndexes: vi.fn().mockResolvedValue([]) };
  });

  function useCase() {
    return new AddCharacterForm(
      characterService as never,
      spellService as never,
      creatureService as never,
      systemService as never,
      traitService as never
    );
  }

  it("persists a creature allowed by the spell pool", async () => {
    await useCase().execute({ id: "char1", userId: "user1", creatureId: owlId, spellId });

    expect(characterService.addForm).toHaveBeenCalledWith({
      id: "char1",
      userId: "user1",
      entry: { creatureId: owlId, spellId, purpose: "companion" },
      choose: 1,
      replaceOnRecast: true
    });
  });

  it("accepts any creature of the system when the filter is empty", async () => {
    spellService.getById.mockResolvedValue(truePolymorphSpell);

    await useCase().execute({ id: "char1", userId: "user1", creatureId: owlId, spellId });

    expect(characterService.addForm).toHaveBeenCalledWith({
      id: "char1",
      userId: "user1",
      entry: { creatureId: owlId, spellId, purpose: "target" },
      choose: 1,
      replaceOnRecast: true
    });
  });

  it("rejects a creature from another system", async () => {
    creatureService.getById.mockResolvedValue({ ...owl, ruleset: "other" });

    await expect(useCase().execute({
      id: "char1",
      userId: "user1",
      creatureId: owlId,
      spellId
    })).rejects.toThrow("La criatura no pertenece a este sistema ni a sus ancestros");
    expect(characterService.addForm).not.toHaveBeenCalled();
  });

  it("rejects a creature outside the pool", async () => {
    creatureService.getById.mockResolvedValue({ ...owl, id: "wolf" });

    await expect(useCase().execute({
      id: "char1",
      userId: "user1",
      creatureId: "wolf",
      spellId
    })).rejects.toThrow("La criatura no está permitida por este conjuro");
    expect(characterService.addForm).not.toHaveBeenCalled();
  });

  it("rejects a spell without creatureForm", async () => {
    spellService.getById.mockResolvedValue({ id: spellId, name: "Fireball", ruleset });

    await expect(useCase().execute({
      id: "char1",
      userId: "user1",
      creatureId: owlId,
      spellId
    })).rejects.toBeInstanceOf(AppError);
  });

  it("rejects a missing spell", async () => {
    spellService.getById.mockResolvedValue(null);

    await expect(useCase().execute({
      id: "char1",
      userId: "user1",
      creatureId: owlId,
      spellId
    })).rejects.toBeInstanceOf(NotFoundError);
  });

  it("accepts a special familiar when a trait extends the pool", async () => {
    creatureService.getById.mockResolvedValue(imp);
    characterService.getOwnedTraitIds.mockResolvedValue([chainTraitId]);
    traitService.getTraitsByIndexes.mockResolvedValue([{
      id: chainTraitId,
      creatureFormExtensions: [{
        spellId,
        extraPool: { mode: "ids", creatureIds: [impId], creatures: [] }
      }]
    }]);

    await useCase().execute({ id: "char1", userId: "user1", creatureId: impId, spellId });

    expect(characterService.addForm).toHaveBeenCalledWith({
      id: "char1",
      userId: "user1",
      entry: { creatureId: impId, spellId, purpose: "companion" },
      choose: 1,
      replaceOnRecast: true
    });
  });

  it("rejects a special familiar when the character lacks the extending trait", async () => {
    creatureService.getById.mockResolvedValue(imp);

    await expect(useCase().execute({
      id: "char1",
      userId: "user1",
      creatureId: impId,
      spellId
    })).rejects.toThrow("La criatura no está permitida por este conjuro");
    expect(characterService.addForm).not.toHaveBeenCalled();
  });
});
