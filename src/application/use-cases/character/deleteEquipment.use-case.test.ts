import { describe, it, expect, vi, beforeEach } from "vitest";
import DeleteEquipment from "./deleteEquipment.use-case";
import { ConflictError, NotFoundError } from "../../../domain/errors/AppError";

describe("DeleteEquipment", () => {
  let characterServiceMock: {
    deleteEquipment: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    characterServiceMock = {
      deleteEquipment: vi.fn(),
    };
  });

  it("should delegate to characterService.deleteEquipment and return formatted equipment", async () => {
    const useCase = new DeleteEquipment(characterServiceMock as any);
    const input = {
      id: "char1",
      instanceId: "inst1",
      quantity: 1,
    };
    const expected = {
      equipment: [],
    };
    characterServiceMock.deleteEquipment.mockResolvedValue(expected);

    const result = await useCase.execute(input);

    expect(result).toEqual(expected);
    expect(characterServiceMock.deleteEquipment).toHaveBeenCalledWith(input);
  });

  it("should propagate NotFoundError when character or equipment does not exist", async () => {
    const useCase = new DeleteEquipment(characterServiceMock as any);
    characterServiceMock.deleteEquipment.mockRejectedValue(
      new NotFoundError("No se encontró el equipamiento en el personaje")
    );

    await expect(
      useCase.execute({
        id: "char1",
        instanceId: "inst1",
        quantity: 1,
      })
    ).rejects.toThrow(NotFoundError);
  });

  it("should propagate ConflictError when equipment is favorite or equipped", async () => {
    const useCase = new DeleteEquipment(characterServiceMock as any);
    characterServiceMock.deleteEquipment.mockRejectedValue(
      new ConflictError("No se puede eliminar un equipamiento favorito o equipado")
    );

    await expect(
      useCase.execute({
        id: "char1",
        instanceId: "inst1",
      })
    ).rejects.toThrow(ConflictError);
  });
});
