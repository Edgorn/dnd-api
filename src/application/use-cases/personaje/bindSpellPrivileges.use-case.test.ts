import { describe, it, expect, vi, beforeEach } from "vitest";
import BindSpellPrivileges from "./bindSpellPrivileges.use-case";
import { AppError, NotFoundError, ValidationError } from "../../../domain/errors/AppError";

describe("BindSpellPrivileges", () => {
  let personajeServiceMock: {
    bindSpellPrivileges: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    personajeServiceMock = {
      bindSpellPrivileges: vi.fn(),
    };
  });

  const input = {
    id: "char1",
    traitId: "spell-mastery",
    classId: "class1",
    selections: [["507f1f77bcf86cd799439011"], ["507f1f77bcf86cd799439012"]],
    userId: "user1",
  };

  it("should delegate to personajeService.bindSpellPrivileges", async () => {
    const useCase = new BindSpellPrivileges(personajeServiceMock as never);
    const expected = { id: "char1", spellPrivileges: [] };
    personajeServiceMock.bindSpellPrivileges.mockResolvedValue(expected);

    const result = await useCase.execute(input);

    expect(personajeServiceMock.bindSpellPrivileges).toHaveBeenCalledWith(input);
    expect(result).toEqual(expected);
  });

  it("should propagate NotFoundError when the character does not exist", async () => {
    const useCase = new BindSpellPrivileges(personajeServiceMock as never);
    personajeServiceMock.bindSpellPrivileges.mockRejectedValue(
      new NotFoundError("No se encontró el personaje con id: char1")
    );

    await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
  });

  it("should propagate 403 when the user cannot access the character", async () => {
    const useCase = new BindSpellPrivileges(personajeServiceMock as never);
    personajeServiceMock.bindSpellPrivileges.mockRejectedValue(
      new AppError("No tienes permiso para consultar este personaje", 403)
    );

    await expect(useCase.execute({ ...input, userId: "user2" })).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  it("should propagate ValidationError when the trait cannot be replaced", async () => {
    const useCase = new BindSpellPrivileges(personajeServiceMock as never);
    personajeServiceMock.bindSpellPrivileges.mockRejectedValue(
      new ValidationError("No se pueden cambiar los conjuros vinculados a este rasgo")
    );

    await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
  });
});
