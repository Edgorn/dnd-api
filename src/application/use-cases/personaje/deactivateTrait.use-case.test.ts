import { describe, it, expect, vi, beforeEach } from "vitest";
import DeactivateTrait from "./deactivateTrait.use-case";
import { ValidationError } from "../../../domain/errors/AppError";

describe("DeactivateTrait", () => {
  let personajeServiceMock: {
    deactivateTrait: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    personajeServiceMock = {
      deactivateTrait: vi.fn()
    };
  });

  const input = { id: "char1", traitId: "rage", userId: "user1" };

  it("delegates to personajeService.deactivateTrait", async () => {
    const useCase = new DeactivateTrait(personajeServiceMock as never);
    const expected = { id: "char1", activeTraitIds: [] };
    personajeServiceMock.deactivateTrait.mockResolvedValue(expected);

    await expect(useCase.execute(input)).resolves.toEqual(expected);
    expect(personajeServiceMock.deactivateTrait).toHaveBeenCalledWith(input);
  });

  it("propagates ValidationError when the stance is not active", async () => {
    const useCase = new DeactivateTrait(personajeServiceMock as never);
    personajeServiceMock.deactivateTrait.mockRejectedValue(
      new ValidationError("Este rasgo no está activo")
    );

    await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
  });
});
