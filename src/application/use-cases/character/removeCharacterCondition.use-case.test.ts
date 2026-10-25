import { describe, it, expect, vi, beforeEach } from "vitest";
import RemoveCharacterCondition from "./removeCharacterCondition.use-case";
import { ValidationError } from "../../../domain/errors/AppError";

describe("RemoveCharacterCondition", () => {
  let characterServiceMock: {
    removeCharacterCondition: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    characterServiceMock = {
      removeCharacterCondition: vi.fn()
    };
  });

  const input = {
    id: "char1",
    conditionId: "507f1f77bcf86cd799439011",
    userId: "user1"
  };

  it("delegates to characterService.removeCharacterCondition", async () => {
    const useCase = new RemoveCharacterCondition(characterServiceMock as never);
    const expected = { id: "char1" };
    characterServiceMock.removeCharacterCondition.mockResolvedValue(expected);

    await expect(useCase.execute(input)).resolves.toEqual(expected);
    expect(characterServiceMock.removeCharacterCondition).toHaveBeenCalledWith(input);
  });

  it("propagates when the condition is not active", async () => {
    const useCase = new RemoveCharacterCondition(characterServiceMock as never);
    characterServiceMock.removeCharacterCondition.mockRejectedValue(
      new ValidationError("El personaje no tiene este estado")
    );

    await expect(useCase.execute(input)).rejects.toMatchObject({
      message: "El personaje no tiene este estado",
      statusCode: 400
    });
  });
});
