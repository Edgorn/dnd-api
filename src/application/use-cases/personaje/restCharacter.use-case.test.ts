import { describe, it, expect, vi, beforeEach } from "vitest";
import RestCharacter from "./restCharacter.use-case";
import { NotFoundError } from "../../../domain/errors/AppError";

describe("RestCharacter", () => {
  let personajeServiceMock: {
    restCharacter: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    personajeServiceMock = {
      restCharacter: vi.fn()
    };
  });

  const input = { id: "char1", type: "longRest" as const, userId: "user1" };

  it("delegates to personajeService.restCharacter", async () => {
    const useCase = new RestCharacter(personajeServiceMock as never);
    const expected = { id: "char1", traitResources: [], activeTraitIds: [] };
    personajeServiceMock.restCharacter.mockResolvedValue(expected);

    await expect(useCase.execute(input)).resolves.toEqual(expected);
    expect(personajeServiceMock.restCharacter).toHaveBeenCalledWith(input);
  });

  it("propagates NotFoundError when the character does not exist", async () => {
    const useCase = new RestCharacter(personajeServiceMock as never);
    personajeServiceMock.restCharacter.mockRejectedValue(
      new NotFoundError("No se encontró el personaje con id: char1")
    );

    await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
  });
});
