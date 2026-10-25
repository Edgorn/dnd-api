import { describe, it, expect, vi, beforeEach } from "vitest";
import DeactivateTrait from "./deactivateTrait.use-case";
import { ValidationError } from "../../../domain/errors/AppError";

describe("DeactivateTrait", () => {
  let characterServiceMock: {
    deactivateTrait: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    characterServiceMock = {
      deactivateTrait: vi.fn()
    };
  });

  const input = { id: "char1", traitId: "rage", userId: "user1" };

  it("delegates to characterService.deactivateTrait", async () => {
    const useCase = new DeactivateTrait(characterServiceMock as never);
    const expected = { id: "char1", activeTraitIds: [] };
    characterServiceMock.deactivateTrait.mockResolvedValue(expected);

    await expect(useCase.execute(input)).resolves.toEqual(expected);
    expect(characterServiceMock.deactivateTrait).toHaveBeenCalledWith(input);
  });

  it("propagates ValidationError when the stance is not active", async () => {
    const useCase = new DeactivateTrait(characterServiceMock as never);
    characterServiceMock.deactivateTrait.mockRejectedValue(
      new ValidationError("Este rasgo no está activo")
    );

    await expect(useCase.execute(input)).rejects.toThrow(ValidationError);
  });
});
