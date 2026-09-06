import { describe, it, expect, vi, beforeEach } from "vitest";
import LevelUp from "./levelUp.use-case";
import { AppError, NotFoundError, ValidationError } from "../../../domain/errors/AppError";

describe("LevelUp", () => {
  let personajeServiceMock: {
    levelUp: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    personajeServiceMock = {
      levelUp: vi.fn(),
    };
  });

  it("should delegate to personajeService.levelUp", async () => {
    const useCase = new LevelUp(personajeServiceMock as any);
    const expected = { completo: { id: "char1" }, basico: { id: "char1" } };
    personajeServiceMock.levelUp.mockResolvedValue(expected);

    const input = {
      id: "char1",
      classId: "class1",
      hpIncrease: 5,
      userId: "user1",
    };
    const result = await useCase.execute(input);

    expect(personajeServiceMock.levelUp).toHaveBeenCalledWith(input);
    expect(result).toEqual(expected);
  });

  it("should propagate NotFoundError when character does not exist", async () => {
    const useCase = new LevelUp(personajeServiceMock as any);
    personajeServiceMock.levelUp.mockRejectedValue(
      new NotFoundError("No se encontró el personaje con id: char1")
    );

    await expect(
      useCase.execute({ id: "char1", classId: "class1", hpIncrease: 5, userId: "user1" })
    ).rejects.toThrow(NotFoundError);
  });

  it("should propagate 403 when user cannot access the character", async () => {
    const useCase = new LevelUp(personajeServiceMock as any);
    personajeServiceMock.levelUp.mockRejectedValue(
      new AppError("No tienes permiso para consultar este personaje", 403)
    );

    await expect(
      useCase.execute({ id: "char1", classId: "class1", hpIncrease: 5, userId: "user2" })
    ).rejects.toThrow(AppError);
    await expect(
      useCase.execute({ id: "char1", classId: "class1", hpIncrease: 5, userId: "user2" })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  it("should propagate ValidationError when formula is missing", async () => {
    const useCase = new LevelUp(personajeServiceMock as any);
    personajeServiceMock.levelUp.mockRejectedValue(
      new ValidationError(
        "El sistema del personaje no define hpLevelUpFormula; no se puede calcular el incremento de PG"
      )
    );

    await expect(
      useCase.execute({ id: "char1", classId: "class1", hpIncrease: 5, userId: "user1" })
    ).rejects.toThrow(ValidationError);
  });
});
