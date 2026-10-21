import { describe, it, expect, vi, beforeEach } from "vitest";
import ApplyCharacterCondition from "./applyCharacterCondition.use-case";
import { NotFoundError, ValidationError } from "../../../domain/errors/AppError";

describe("ApplyCharacterCondition", () => {
  let personajeServiceMock: {
    applyCharacterCondition: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    personajeServiceMock = {
      applyCharacterCondition: vi.fn()
    };
  });

  const input = {
    id: "char1",
    conditionId: "507f1f77bcf86cd799439011",
    level: 1,
    userId: "user1"
  };

  it("delegates to personajeService.applyCharacterCondition", async () => {
    const useCase = new ApplyCharacterCondition(personajeServiceMock as never);
    const expected = { id: "char1" };
    personajeServiceMock.applyCharacterCondition.mockResolvedValue(expected);

    await expect(useCase.execute(input)).resolves.toEqual(expected);
    expect(personajeServiceMock.applyCharacterCondition).toHaveBeenCalledWith(input);
  });

  it("propagates immunity rejection", async () => {
    const useCase = new ApplyCharacterCondition(personajeServiceMock as never);
    personajeServiceMock.applyCharacterCondition.mockRejectedValue(
      new ValidationError("El personaje es inmune a este estado")
    );

    await expect(useCase.execute(input)).rejects.toMatchObject({
      message: "El personaje es inmune a este estado",
      statusCode: 400
    });
  });

  it("propagates NotFoundError when the character does not exist", async () => {
    const useCase = new ApplyCharacterCondition(personajeServiceMock as never);
    personajeServiceMock.applyCharacterCondition.mockRejectedValue(
      new NotFoundError("Personaje no encontrado")
    );

    await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
  });
});
