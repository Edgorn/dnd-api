import { describe, it, expect, vi, beforeEach } from "vitest";
import PrepareSpells from "./prepareSpells.use-case";
import { AppError, NotFoundError, ValidationError } from "../../../domain/errors/AppError";

describe("PrepareSpells", () => {
  let personajeServiceMock: {
    prepareSpells: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    personajeServiceMock = {
      prepareSpells: vi.fn(),
    };
  });

  const input = {
    id: "char1",
    classId: "class1",
    spells: ["507f1f77bcf86cd799439011"],
    userId: "user1",
  };

  it("should delegate to personajeService.prepareSpells", async () => {
    const useCase = new PrepareSpells(personajeServiceMock as never);
    const expected = { id: "char1", spells: {} };
    personajeServiceMock.prepareSpells.mockResolvedValue(expected);

    const result = await useCase.execute(input);

    expect(personajeServiceMock.prepareSpells).toHaveBeenCalledWith(input);
    expect(result).toEqual(expected);
  });

  it("should propagate NotFoundError when the character does not exist", async () => {
    const useCase = new PrepareSpells(personajeServiceMock as never);
    personajeServiceMock.prepareSpells.mockRejectedValue(
      new NotFoundError("No se encontró el personaje con id: char1")
    );

    await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
  });

  it("should propagate 403 when the user cannot access the character", async () => {
    const useCase = new PrepareSpells(personajeServiceMock as never);
    personajeServiceMock.prepareSpells.mockRejectedValue(
      new AppError("No tienes permiso para consultar este personaje", 403)
    );

    await expect(useCase.execute({ ...input, userId: "user2" })).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it("should propagate ValidationError when the class does not prepare spells", async () => {
    const useCase = new PrepareSpells(personajeServiceMock as never);
    personajeServiceMock.prepareSpells.mockRejectedValue(
      new ValidationError("Esta clase no prepara conjuros")
    );

    await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
  });
});
