import { describe, it, expect, vi, beforeEach } from "vitest";
import MoveEquipment from "./moveEquipment.use-case";
import { ConflictError, NotFoundError, ValidationError } from "../../../domain/errors/AppError";

const instanceId = "507f1f77bcf86cd799439031";
const companionId = "507f1f77bcf86cd799439021";
const bagId = "507f1f77bcf86cd799439041";

function inventoryRow(overrides: Record<string, unknown> = {}) {
  return {
    instanceId,
    equipmentId: "eq-saddle",
    quantity: 1,
    equipped: false,
    isMagic: false,
    isBond: false,
    isFavorite: false,
    ...overrides,
  };
}

describe("MoveEquipment", () => {
  let characterRepository: {
    getCompanionRoster: ReturnType<typeof vi.fn>;
    replaceInventory: ReturnType<typeof vi.fn>;
  };
  let equipmentRepository: {
    getCharacterEquipmentsByIds: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    characterRepository = {
      getCompanionRoster: vi.fn().mockResolvedValue({
        companions: [{ id: companionId, name: "Relámpago", kind: "mount" }],
        systems: ["sys"],
        inventory: [inventoryRow()],
      }),
      replaceInventory: vi.fn().mockResolvedValue({ equipment: [] }),
    };
    equipmentRepository = {
      getCharacterEquipmentsByIds: vi.fn().mockResolvedValue([
        { id: "eq-saddle", instanceId, containerStats: undefined, vehicle: undefined },
      ]),
    };
  });

  function useCase() {
    return new MoveEquipment(
      characterRepository as never,
      equipmentRepository as never
    );
  }

  it("moves an unequipped row onto a companion", async () => {
    await useCase().execute({
      id: "char1",
      instanceId,
      userId: "user1",
      holderId: companionId,
    });

    expect(characterRepository.replaceInventory).toHaveBeenCalledWith(
      "char1",
      "user1",
      [expect.objectContaining({ instanceId, holderId: companionId })]
    );
  });

  it("returns 409 when the character has the item equipped", async () => {
    characterRepository.getCompanionRoster.mockResolvedValue({
      companions: [{ id: companionId, name: "Relámpago", kind: "mount" }],
      systems: [],
      inventory: [inventoryRow({ equipped: true })],
    });

    await expect(
      useCase().execute({
        id: "char1",
        instanceId,
        userId: "user1",
        holderId: companionId,
      })
    ).rejects.toThrow(ConflictError);
    expect(characterRepository.replaceInventory).not.toHaveBeenCalled();
  });

  it("rejects an unknown holder", async () => {
    await expect(
      useCase().execute({
        id: "char1",
        instanceId,
        userId: "user1",
        holderId: "507f1f77bcf86cd799439099",
      })
    ).rejects.toThrow(ValidationError);
  });

  it("rejects moving a container into its contents", async () => {
    characterRepository.getCompanionRoster.mockResolvedValue({
      companions: [],
      systems: [],
      inventory: [
        inventoryRow({ instanceId: bagId, equipmentId: "eq-bag" }),
        inventoryRow({ instanceId, equipmentId: "eq-pouch", holderId: bagId }),
      ],
    });
    equipmentRepository.getCharacterEquipmentsByIds.mockResolvedValue([
      { id: "eq-bag", instanceId: bagId, containerStats: { maxWeight: 10 } },
      { id: "eq-pouch", instanceId, containerStats: { maxWeight: 5 } },
    ]);

    await expect(
      useCase().execute({
        id: "char1",
        instanceId: bagId,
        userId: "user1",
        holderId: instanceId,
      })
    ).rejects.toThrow(ValidationError);
  });

  it("throws NotFoundError when the instance is missing", async () => {
    characterRepository.getCompanionRoster.mockResolvedValue({
      companions: [],
      systems: [],
      inventory: [],
    });

    await expect(
      useCase().execute({
        id: "char1",
        instanceId,
        userId: "user1",
        holderId: null,
      })
    ).rejects.toThrow(NotFoundError);
  });
});
