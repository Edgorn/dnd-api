import { describe, it, expect, vi, beforeEach } from "vitest";
import UpdateCharacterCondition from "./updateCharacterCondition.use-case";
import { ValidationError } from "../../../domain/errors/AppError";

describe("UpdateCharacterCondition", () => {
  let characterServiceMock: {
    updateCharacterCondition: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    characterServiceMock = {
      updateCharacterCondition: vi.fn()
    };
  });

  const input = {
    id: "char1",
    conditionId: "507f1f77bcf86cd799439011",
    delta: -1,
    userId: "user1"
  };

  it("delegates to characterService.updateCharacterCondition", async () => {
    const useCase = new UpdateCharacterCondition(characterServiceMock as never);
    const expected = { id: "char1" };
    characterServiceMock.updateCharacterCondition.mockResolvedValue(expected);

    await expect(useCase.execute(input)).resolves.toEqual(expected);
    expect(characterServiceMock.updateCharacterCondition).toHaveBeenCalledWith(input);
  });

  it("propagates when the condition is not active", async () => {
    const useCase = new UpdateCharacterCondition(characterServiceMock as never);
    characterServiceMock.updateCharacterCondition.mockRejectedValue(
      new ValidationError("El personaje no tiene este estado")
    );

    await expect(useCase.execute(input)).rejects.toMatchObject({
      message: "El personaje no tiene este estado",
      statusCode: 400
    });
  });
});
