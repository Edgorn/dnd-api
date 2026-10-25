import { describe, it, expect, vi, beforeEach } from "vitest";
import SpendHitDice from "./spendHitDice.use-case";
import { NotFoundError, ValidationError } from "../../../domain/errors/AppError";

describe("SpendHitDice", () => {
  let characterServiceMock: {
    spendHitDice: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    characterServiceMock = {
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

  it("delegates to characterService.spendHitDice", async () => {
    const useCase = new SpendHitDice(characterServiceMock as never);
    const expected = { id: "char1", hpCurrent: 20 };
    characterServiceMock.spendHitDice.mockResolvedValue(expected);

    await expect(useCase.execute(input)).resolves.toEqual(expected);
    expect(characterServiceMock.spendHitDice).toHaveBeenCalledWith(input);
  });

  it("propagates when no hit dice remain", async () => {
    const useCase = new SpendHitDice(characterServiceMock as never);
    characterServiceMock.spendHitDice.mockRejectedValue(
      new ValidationError("No quedan dados de golpe de esta clase")
    );

    await expect(useCase.execute(input)).rejects.toMatchObject({
      message: "No quedan dados de golpe de esta clase",
      statusCode: 400
    });
  });

  it("propagates NotFoundError when the character does not exist", async () => {
    const useCase = new SpendHitDice(characterServiceMock as never);
    characterServiceMock.spendHitDice.mockRejectedValue(
      new NotFoundError("Personaje no encontrado")
    );

    await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
  });
});
