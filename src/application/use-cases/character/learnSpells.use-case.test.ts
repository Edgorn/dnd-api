import { describe, it, expect, vi, beforeEach } from "vitest";
import LearnSpells from "./learnSpells.use-case";
import { AppError, NotFoundError, ValidationError } from "../../../domain/errors/AppError";

describe("LearnSpells", () => {
  let characterServiceMock: {
    learnSpells: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    characterServiceMock = {
      learnSpells: vi.fn(),
    };
  });

  const input = {
    id: "char1",
    classId: "class1",
    spells: ["507f1f77bcf86cd799439011"],
    userId: "user1",
  };

  it("should delegate to characterService.learnSpells", async () => {
    const useCase = new LearnSpells(characterServiceMock as never);
    const expected = { spells: {}, spellsById: {} };
    characterServiceMock.learnSpells.mockResolvedValue(expected);

    const result = await useCase.execute(input);

    expect(characterServiceMock.learnSpells).toHaveBeenCalledWith(input);
    expect(result).toEqual(expected);
  });

  it("should propagate NotFoundError when the character does not exist", async () => {
    const useCase = new LearnSpells(characterServiceMock as never);
    characterServiceMock.learnSpells.mockRejectedValue(
      new NotFoundError("No se encontró el personaje con id: char1")
    );

    await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
  });

  it("should propagate 403 when the user cannot access the character", async () => {
    const useCase = new LearnSpells(characterServiceMock as never);
    characterServiceMock.learnSpells.mockRejectedValue(
      new AppError("No tienes permiso para consultar este personaje", 403)
    );

    await expect(useCase.execute({ ...input, userId: "user2" })).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it("should propagate ValidationError when the class cannot learn spells", async () => {
    const useCase = new LearnSpells(characterServiceMock as never);
    characterServiceMock.learnSpells.mockRejectedValue(
      new ValidationError("Esta clase no puede aprender conjuros a este nivel")
    );

    await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
  });
});
