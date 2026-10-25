import { describe, it, expect, vi, beforeEach } from "vitest";
import AddEquipment from "./addEquipment.use-case";
import { NotFoundError } from "../../../domain/errors/AppError";

describe("AddEquipment", () => {
  let characterServiceMock: {
    addEquipment: ReturnType<typeof vi.fn>;
  };
  let equipmentRepositoryMock: {
    getById: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    characterServiceMock = {
      addEquipment: vi.fn(),
    };
    equipmentRepositoryMock = {
      getById: vi.fn(),
    };
  });

  it("should copy isMagic from the catalog and delegate to characterService.addEquipment", async () => {
    const useCase = new AddEquipment(characterServiceMock as any, equipmentRepositoryMock as any);
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
    characterServiceMock.addEquipment.mockResolvedValue(expected);

    const result = await useCase.execute(input);

    expect(result).toEqual(expected);
    expect(equipmentRepositoryMock.getById).toHaveBeenCalledWith("eq1");
    expect(characterServiceMock.addEquipment).toHaveBeenCalledWith({
      ...input,
      isMagic: true,
    });
  });

  it("should propagate NotFoundError when character does not exist", async () => {
    const useCase = new AddEquipment(characterServiceMock as any, equipmentRepositoryMock as any);
    equipmentRepositoryMock.getById.mockResolvedValue({ id: "eq1", isMagic: false });
    characterServiceMock.addEquipment.mockRejectedValue(
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
    const useCase = new AddEquipment(characterServiceMock as any, equipmentRepositoryMock as any);
    equipmentRepositoryMock.getById.mockResolvedValue(null);

    await expect(
      useCase.execute({
        id: "char1",
        equipmentId: "eq1",
        quantity: 1,
      })
    ).rejects.toThrow(NotFoundError);
    expect(characterServiceMock.addEquipment).not.toHaveBeenCalled();
  });
});
