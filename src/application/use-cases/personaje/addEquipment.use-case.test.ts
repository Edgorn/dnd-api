import { describe, it, expect, vi, beforeEach } from "vitest";
import AddEquipment from "./addEquipment.use-case";
import { NotFoundError } from "../../../domain/errors/AppError";

describe("AddEquipment", () => {
  let personajeServiceMock: {
    addEquipment: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    personajeServiceMock = {
      addEquipment: vi.fn(),
    };
  });

  it("should delegate to personajeService.addEquipment and return formatted equipment", async () => {
    const useCase = new AddEquipment(personajeServiceMock as any);
    const input = {
      id: "char1",
      equip: "eq1",
      quantity: 2,
      isMagic: false,
      isBond: false,
    };
    const expected = {
      equipment: [
        {
          id: "eq1",
          ruleset: "sys1",
          name: "Espada larga",
          description: "",
          cost: { quantity: 15, unit: "gp" },
          weight: 3,
          category: "Arma",
          subcategory: "Marcial",
          quantity: 2,
        },
      ],
    };
    personajeServiceMock.addEquipment.mockResolvedValue(expected);

    const result = await useCase.execute(input);

    expect(result).toEqual(expected);
    expect(personajeServiceMock.addEquipment).toHaveBeenCalledWith(input);
  });

  it("should propagate NotFoundError when character does not exist", async () => {
    const useCase = new AddEquipment(personajeServiceMock as any);
    personajeServiceMock.addEquipment.mockRejectedValue(
      new NotFoundError("No se encontró el personaje con id: char1")
    );

    await expect(
      useCase.execute({
        id: "char1",
        equip: "eq1",
        quantity: 1,
        isMagic: false,
        isBond: false,
      })
    ).rejects.toThrow(NotFoundError);
  });
});
