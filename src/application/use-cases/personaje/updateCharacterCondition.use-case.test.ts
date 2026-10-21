import { describe, it, expect, vi, beforeEach } from "vitest";
import UpdateCharacterCondition from "./updateCharacterCondition.use-case";
import { ValidationError } from "../../../domain/errors/AppError";

describe("UpdateCharacterCondition", () => {
  let personajeServiceMock: {
    updateCharacterCondition: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    personajeServiceMock = {
      updateCharacterCondition: vi.fn()
    };
  });

  const input = {
    id: "char1",
    conditionId: "507f1f77bcf86cd799439011",
    delta: -1,
    userId: "user1"
  };

  it("delegates to personajeService.updateCharacterCondition", async () => {
    const useCase = new UpdateCharacterCondition(personajeServiceMock as never);
    const expected = { id: "char1" };
    personajeServiceMock.updateCharacterCondition.mockResolvedValue(expected);

    await expect(useCase.execute(input)).resolves.toEqual(expected);
    expect(personajeServiceMock.updateCharacterCondition).toHaveBeenCalledWith(input);
  });

  it("propagates when the condition is not active", async () => {
    const useCase = new UpdateCharacterCondition(personajeServiceMock as never);
    personajeServiceMock.updateCharacterCondition.mockRejectedValue(
      new ValidationError("El personaje no tiene este estado")
    );

    await expect(useCase.execute(input)).rejects.toMatchObject({
      message: "El personaje no tiene este estado",
      statusCode: 400
    });
  });
});
