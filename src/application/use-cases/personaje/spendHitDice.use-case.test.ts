import { describe, it, expect, vi, beforeEach } from "vitest";
import SpendHitDice from "./spendHitDice.use-case";
import { NotFoundError, ValidationError } from "../../../domain/errors/AppError";

describe("SpendHitDice", () => {
  let personajeServiceMock: {
    spendHitDice: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    personajeServiceMock = {
      spendHitDice: vi.fn()
    };
  });

  const input = {
    id: "char1",
    classId: "507f1f77bcf86cd799439011",
    count: 2,
    hpGained: 11,
    userId: "user1"
  };

  it("delegates to personajeService.spendHitDice", async () => {
    const useCase = new SpendHitDice(personajeServiceMock as never);
    const expected = { id: "char1", HPActual: 20 };
    personajeServiceMock.spendHitDice.mockResolvedValue(expected);

    await expect(useCase.execute(input)).resolves.toEqual(expected);
    expect(personajeServiceMock.spendHitDice).toHaveBeenCalledWith(input);
  });

  it("propagates when no hit dice remain", async () => {
    const useCase = new SpendHitDice(personajeServiceMock as never);
    personajeServiceMock.spendHitDice.mockRejectedValue(
      new ValidationError("No quedan dados de golpe de esta clase")
    );

    await expect(useCase.execute(input)).rejects.toMatchObject({
      message: "No quedan dados de golpe de esta clase",
      statusCode: 400
    });
  });

  it("propagates NotFoundError when the character does not exist", async () => {
    const useCase = new SpendHitDice(personajeServiceMock as never);
    personajeServiceMock.spendHitDice.mockRejectedValue(
      new NotFoundError("Personaje no encontrado")
    );

    await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
  });
});
