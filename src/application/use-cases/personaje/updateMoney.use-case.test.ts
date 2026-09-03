import { describe, it, expect, vi, beforeEach } from "vitest";
import UpdateMoney from "./updateMoney.use-case";
import { NotFoundError } from "../../../domain/errors/AppError";

describe("UpdateMoney", () => {
  let personajeServiceMock: {
    updateMoney: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    personajeServiceMock = {
      updateMoney: vi.fn(),
    };
  });

  it("should delegate to personajeService.updateMoney and return formatted money", async () => {
    const useCase = new UpdateMoney(personajeServiceMock as any);
    const moneyInput = [{ unit: "coin1", quantity: 10 }];
    const expected = {
      money: [
        {
          id: "coin1",
          ruleset: "sys1",
          name: "Oro",
          abbreviation: "po",
          isBase: true,
          multiplier: 1,
          weight: 0.02,
          color: "#FFD700",
          quantity: 10,
        },
      ],
    };
    personajeServiceMock.updateMoney.mockResolvedValue(expected);

    const result = await useCase.execute("char1", moneyInput);

    expect(result).toEqual(expected);
    expect(personajeServiceMock.updateMoney).toHaveBeenCalledWith("char1", moneyInput);
  });

  it("should propagate NotFoundError when character does not exist", async () => {
    const useCase = new UpdateMoney(personajeServiceMock as any);
    personajeServiceMock.updateMoney.mockRejectedValue(
      new NotFoundError("No se encontró el personaje con id: char1")
    );

    await expect(
      useCase.execute("char1", [{ unit: "coin1", quantity: 5 }])
    ).rejects.toThrow(NotFoundError);
  });
});
