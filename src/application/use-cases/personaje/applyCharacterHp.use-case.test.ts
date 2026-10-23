import { describe, it, expect, vi, beforeEach } from "vitest";
import ApplyCharacterHp from "./applyCharacterHp.use-case";
import { NotFoundError } from "../../../domain/errors/AppError";

describe("ApplyCharacterHp", () => {
  let personajeServiceMock: {
    applyHp: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    personajeServiceMock = {
      applyHp: vi.fn()
    };
  });

  const input = {
    id: "char1",
    amount: 7,
    kind: "damage" as const,
    userId: "user1"
  };

  it("delegates to personajeService.applyHp", async () => {
    const useCase = new ApplyCharacterHp(personajeServiceMock as never);
    const expected = { id: "char1", HPActual: 13 };
    personajeServiceMock.applyHp.mockResolvedValue(expected);

    await expect(useCase.execute(input)).resolves.toEqual(expected);
    expect(personajeServiceMock.applyHp).toHaveBeenCalledWith(input);
  });

  it("delegates heal with kind heal", async () => {
    const useCase = new ApplyCharacterHp(personajeServiceMock as never);
    const heal = { ...input, kind: "heal" as const, amount: 8 };
    const expected = { id: "char1", HPActual: 21 };
    personajeServiceMock.applyHp.mockResolvedValue(expected);

    await expect(useCase.execute(heal)).resolves.toEqual(expected);
    expect(personajeServiceMock.applyHp).toHaveBeenCalledWith(heal);
  });

  it("propagates NotFoundError when the character does not exist", async () => {
    const useCase = new ApplyCharacterHp(personajeServiceMock as never);
    personajeServiceMock.applyHp.mockRejectedValue(
      new NotFoundError("Personaje no encontrado")
    );

    await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
  });
});
