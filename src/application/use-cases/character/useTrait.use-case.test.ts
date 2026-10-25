import { describe, it, expect, vi, beforeEach } from "vitest";
import UseTrait from "./useTrait.use-case";
import { NotFoundError, ValidationError } from "../../../domain/errors/AppError";

describe("UseTrait", () => {
  let characterServiceMock: {
    useTrait: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    characterServiceMock = {
      useTrait: vi.fn()
    };
  });

  const input = { id: "char1", traitId: "rage", userId: "user1" };

  it("delegates to characterService.useTrait", async () => {
    const useCase = new UseTrait(characterServiceMock as never);
    const expected = { id: "char1", activeTraitIds: ["rage"] };
    characterServiceMock.useTrait.mockResolvedValue(expected);

    await expect(useCase.execute(input)).resolves.toEqual(expected);
    expect(characterServiceMock.useTrait).toHaveBeenCalledWith(input);
  });

  it("forwards equipmentId for a pact weapon form", async () => {
    const useCase = new UseTrait(characterServiceMock as never);
    const withForm = { ...input, equipmentId: "507f1f77bcf86cd799439011" };
    characterServiceMock.useTrait.mockResolvedValue({ id: "char1" });

    await useCase.execute(withForm);
    expect(characterServiceMock.useTrait).toHaveBeenCalledWith(withForm);
  });

  it("propagates ValidationError when no uses remain", async () => {
    const useCase = new UseTrait(characterServiceMock as never);
    characterServiceMock.useTrait.mockRejectedValue(
      new ValidationError("No quedan usos de este rasgo")
    );

    await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
  });

  it("propagates NotFoundError when the character does not exist", async () => {
    const useCase = new UseTrait(characterServiceMock as never);
    characterServiceMock.useTrait.mockRejectedValue(
      new NotFoundError("No se encontró el personaje con id: char1")
    );

    await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
  });
});
