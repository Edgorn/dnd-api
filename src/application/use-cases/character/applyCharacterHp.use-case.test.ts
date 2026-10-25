import { describe, it, expect, vi, beforeEach } from "vitest";
import ApplyCharacterHp from "./applyCharacterHp.use-case";
import { NotFoundError } from "../../../domain/errors/AppError";

describe("ApplyCharacterHp", () => {
  let characterServiceMock: {
    applyHp: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    characterServiceMock = {
      applyHp: vi.fn()
    };
  });

  const input = {
    id: "char1",
    amount: 7,
    kind: "damage" as const,
    userId: "user1"
  };

  it("delegates to characterService.applyHp", async () => {
    const useCase = new ApplyCharacterHp(characterServiceMock as never);
    const expected = { id: "char1", hpCurrent: 13 };
    characterServiceMock.applyHp.mockResolvedValue(expected);

    await expect(useCase.execute(input)).resolves.toEqual(expected);
    expect(characterServiceMock.applyHp).toHaveBeenCalledWith(input);
  });

  it("delegates heal with kind heal", async () => {
    const useCase = new ApplyCharacterHp(characterServiceMock as never);
    const heal = { ...input, kind: "heal" as const, amount: 8 };
    const expected = { id: "char1", hpCurrent: 21 };
    characterServiceMock.applyHp.mockResolvedValue(expected);

    await expect(useCase.execute(heal)).resolves.toEqual(expected);
    expect(characterServiceMock.applyHp).toHaveBeenCalledWith(heal);
  });

  it("propagates NotFoundError when the character does not exist", async () => {
    const useCase = new ApplyCharacterHp(characterServiceMock as never);
    characterServiceMock.applyHp.mockRejectedValue(
      new NotFoundError("Personaje no encontrado")
    );

    await expect(useCase.execute(input)).rejects.toThrow(NotFoundError);
  });
});
