import { describe, it, expect, vi, beforeEach } from "vitest";
import ApplyCharacterCondition from "./applyCharacterCondition.use-case";
import { NotFoundError, ValidationError } from "../../../domain/errors/AppError";

describe("ApplyCharacterCondition", () => {
  let characterServiceMock: {
    applyCharacterCondition: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    characterServiceMock = {
      applyCharacterCondition: vi.fn()
    };
  });

  const input = {
    id: "char1",
    conditionId: "507f1f77bcf86cd799439011",
    level: 1,
    userId: "user1"
  };

  it("delegates to characterService.applyCharacterCondition", async () => {
    const useCase = new ApplyCharacterCondition(characterServiceMock as never);
    const expected = { id: "char1" };
    characterServiceMock.applyCharacterCondition.mockResolvedValue(expected);

    await expect(useCase.execute(input)).resolves.toEqual(expected);
    expect(characterServiceMock.applyCharacterCondition).toHaveBeenCalledWith(input);
  });

  it("propagates immunity rejection", async () => {
    const useCase = new ApplyCharacterCondition(characterServiceMock as never);
    characterServiceMock.applyCharacterCondition.mockRejectedValue(
      new ValidationError("El personaje es inmune a este estado")
    );

    await expect(useCase.execute(input)).rejects.toMatchObject({
      message: "El personaje es inmune a este estado",
      statusCode: 400
    });
  });

  it("propagates NotFoundError when the character does not exist", async () => {
    const useCase = new ApplyCharacterCondition(characterServiceMock as never);
    characterServiceMock.applyCharacterCondition.mockRejectedValue(
      new NotFoundError("Personaje no encontrado")
    );

    await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
  });
});
