import { describe, it, expect, vi, beforeEach } from "vitest";
import CopySpells from "./copySpells.use-case";
import { AppError, NotFoundError, ValidationError } from "../../../domain/errors/AppError";

describe("CopySpells", () => {
  let personajeServiceMock: {
    copySpells: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    personajeServiceMock = {
      copySpells: vi.fn(),
    };
  });

  const input = {
    id: "char1",
    classId: "class1",
    spells: ["507f1f77bcf86cd799439011"],
    userId: "user1",
  };

  it("should delegate to personajeService.copySpells", async () => {
    const useCase = new CopySpells(personajeServiceMock as never);
    const expected = { id: "char1", extraSpells: {} };
    personajeServiceMock.copySpells.mockResolvedValue(expected);

    const result = await useCase.execute(input);

    expect(personajeServiceMock.copySpells).toHaveBeenCalledWith(input);
    expect(result).toEqual(expected);
  });

  it("should propagate NotFoundError when the character does not exist", async () => {
    const useCase = new CopySpells(personajeServiceMock as never);
    personajeServiceMock.copySpells.mockRejectedValue(
      new NotFoundError("Personaje no encontrado")
    );

    await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
  });

  it("should propagate 403 when the user cannot access the character", async () => {
    const useCase = new CopySpells(personajeServiceMock as never);
    personajeServiceMock.copySpells.mockRejectedValue(
      new AppError("No tienes permiso para consultar este personaje", 403)
    );

    await expect(useCase.execute({ ...input, userId: "user2" })).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it("should propagate ValidationError when the class has no spell repository", async () => {
    const useCase = new CopySpells(personajeServiceMock as never);
    personajeServiceMock.copySpells.mockRejectedValue(
      new ValidationError("Esta clase no define un repositorio de conjuros")
    );

    await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
  });
});
