import { describe, it, expect, vi, beforeEach } from "vitest";
import SpendSpellSlot from "./spendSpellSlot.use-case";
import { NotFoundError, ValidationError } from "../../../domain/errors/AppError";

describe("SpendSpellSlot", () => {
  let personajeServiceMock: {
    spendSpellSlot: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    personajeServiceMock = {
      spendSpellSlot: vi.fn()
    };
  });

  const input = {
    id: "char1",
    classId: "507f1f77bcf86cd799439011",
    pool: "standard" as const,
    level: 1,
    userId: "user1"
  };

  it("delegates to personajeService.spendSpellSlot", async () => {
    const useCase = new SpendSpellSlot(personajeServiceMock as never);
    const expected = { id: "char1" };
    personajeServiceMock.spendSpellSlot.mockResolvedValue(expected);

    await expect(useCase.execute(input)).resolves.toEqual(expected);
    expect(personajeServiceMock.spendSpellSlot).toHaveBeenCalledWith(input);
  });

  it("propagates when no slots remain", async () => {
    const useCase = new SpendSpellSlot(personajeServiceMock as never);
    personajeServiceMock.spendSpellSlot.mockRejectedValue(
      new ValidationError("No quedan ranuras de ese nivel")
    );

    await expect(useCase.execute(input)).rejects.toMatchObject({
      message: "No quedan ranuras de ese nivel",
      statusCode: 400
    });
  });

  it("propagates NotFoundError when the character does not exist", async () => {
    const useCase = new SpendSpellSlot(personajeServiceMock as never);
    personajeServiceMock.spendSpellSlot.mockRejectedValue(
      new NotFoundError("Personaje no encontrado")
    );

    await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
  });
});
