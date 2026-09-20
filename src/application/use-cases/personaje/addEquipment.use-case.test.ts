import { describe, it, expect, vi, beforeEach } from "vitest";
import AddEquipment from "./addEquipment.use-case";
import { NotFoundError } from "../../../domain/errors/AppError";

describe("AddEquipment", () => {
  let personajeServiceMock: {
    addEquipment: ReturnType<typeof vi.fn>;
  };
  let equipmentRepositoryMock: {
    getById: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    personajeServiceMock = {
      addEquipment: vi.fn(),
    };
    equipmentRepositoryMock = {
      getById: vi.fn(),
    };
  });

  it("should copy isMagic from the catalog and delegate to personajeService.addEquipment", async () => {
    const useCase = new AddEquipment(personajeServiceMock as any, equipmentRepositoryMock as any);
    const input = {
      id: "char1",
      equipmentId: "eq1",
      quantity: 2,
    };
    const expected = {
      equipment: [
        {
          instanceId: "inst1",
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
    equipmentRepositoryMock.getById.mockResolvedValue({ id: "eq1", isMagic: true });
    personajeServiceMock.addEquipment.mockResolvedValue(expected);

    const result = await useCase.execute(input);

    expect(result).toEqual(expected);
    expect(equipmentRepositoryMock.getById).toHaveBeenCalledWith("eq1");
    expect(personajeServiceMock.addEquipment).toHaveBeenCalledWith({
      ...input,
      isMagic: true,
    });
  });

  it("should propagate NotFoundError when character does not exist", async () => {
    const useCase = new AddEquipment(personajeServiceMock as any, equipmentRepositoryMock as any);
    equipmentRepositoryMock.getById.mockResolvedValue({ id: "eq1", isMagic: false });
    personajeServiceMock.addEquipment.mockRejectedValue(
      new NotFoundError("No se encontró el personaje con id: char1")
    );

    await expect(
      useCase.execute({
        id: "char1",
        equipmentId: "eq1",
        quantity: 1,
      })
    ).rejects.toThrow(NotFoundError);
  });

  it("should throw NotFoundError when the catalog equipment does not exist", async () => {
    const useCase = new AddEquipment(personajeServiceMock as any, equipmentRepositoryMock as any);
    equipmentRepositoryMock.getById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        id: "char1",
        equipmentId: "eq1",
        quantity: 1,
      })
    ).rejects.toThrow(NotFoundError);
    expect(personajeServiceMock.addEquipment).not.toHaveBeenCalled();
  });
});
