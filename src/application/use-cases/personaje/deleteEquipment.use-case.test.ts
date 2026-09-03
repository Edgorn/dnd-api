import { describe, it, expect, vi, beforeEach } from "vitest";
import DeleteEquipment from "./deleteEquipment.use-case";
import { ConflictError, NotFoundError } from "../../../domain/errors/AppError";

describe("DeleteEquipment", () => {
  let personajeServiceMock: {
    deleteEquipment: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    personajeServiceMock = {
      deleteEquipment: vi.fn(),
    };
  });

  it("should delegate to personajeService.deleteEquipment and return formatted equipment", async () => {
    const useCase = new DeleteEquipment(personajeServiceMock as any);
    const input = {
      id: "char1",
      equip: "eq1",
      quantity: 1,
      isMagic: false,
      isBond: false,
    };
    const expected = {
      equipment: [],
    };
    personajeServiceMock.deleteEquipment.mockResolvedValue(expected);

    const result = await useCase.execute(input);

    expect(result).toEqual(expected);
    expect(personajeServiceMock.deleteEquipment).toHaveBeenCalledWith(input);
  });

  it("should propagate NotFoundError when character or equipment does not exist", async () => {
    const useCase = new DeleteEquipment(personajeServiceMock as any);
    personajeServiceMock.deleteEquipment.mockRejectedValue(
      new NotFoundError("No se encontró el equipamiento en el personaje")
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

  it("should propagate ConflictError when equipment is favorite or equipped", async () => {
    const useCase = new DeleteEquipment(personajeServiceMock as any);
    personajeServiceMock.deleteEquipment.mockRejectedValue(
      new ConflictError("No se puede eliminar un equipamiento favorito o equipado")
    );

    await expect(
      useCase.execute({
        id: "char1",
        equip: "eq1",
        quantity: 1,
        isMagic: false,
        isBond: false,
      })
    ).rejects.toThrow(ConflictError);
  });
});
