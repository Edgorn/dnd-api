import { describe, it, expect, vi, beforeEach } from "vitest";
import UseTrait from "./useTrait.use-case";
import { NotFoundError, ValidationError } from "../../../domain/errors/AppError";

describe("UseTrait", () => {
  let personajeServiceMock: {
    useTrait: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    personajeServiceMock = {
      useTrait: vi.fn()
    };
  });

  const input = { id: "char1", traitId: "rage", userId: "user1" };

  it("delegates to personajeService.useTrait", async () => {
    const useCase = new UseTrait(personajeServiceMock as never);
    const expected = { id: "char1", activeTraitIds: ["rage"] };
    personajeServiceMock.useTrait.mockResolvedValue(expected);

    await expect(useCase.execute(input)).resolves.toEqual(expected);
    expect(personajeServiceMock.useTrait).toHaveBeenCalledWith(input);
  });

  it("propagates ValidationError when no uses remain", async () => {
    const useCase = new UseTrait(personajeServiceMock as never);
    personajeServiceMock.useTrait.mockRejectedValue(
      new ValidationError("No quedan usos de este rasgo")
    );

    await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
  });

  it("propagates NotFoundError when the character does not exist", async () => {
    const useCase = new UseTrait(personajeServiceMock as never);
    personajeServiceMock.useTrait.mockRejectedValue(
      new NotFoundError("No se encontró el personaje con id: char1")
    );

    await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
  });
});
