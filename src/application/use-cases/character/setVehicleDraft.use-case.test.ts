import { describe, it, expect, vi, beforeEach } from "vitest";
import SetVehicleDraft from "./setVehicleDraft.use-case";
import { ConflictError, NotFoundError, ValidationError } from "../../../domain/errors/AppError";

const instanceId = "507f1f77bcf86cd799439031";
const horseId = "507f1f77bcf86cd799439021";
const muleId = "507f1f77bcf86cd799439022";
const hirelingId = "507f1f77bcf86cd799439023";
const otherCartId = "507f1f77bcf86cd799439041";

function inventoryRow(overrides: Record<string, unknown> = {}) {
  return {
    instanceId,
    equipmentId: "eq-cart",
    quantity: 1,
    equipped: false,
    isMagic: false,
    isBond: false,
    isFavorite: false,
    ...overrides,
  };
}

describe("SetVehicleDraft", () => {
  let characterRepository: {
    getCompanionRoster: ReturnType<typeof vi.fn>;
    replaceInventory: ReturnType<typeof vi.fn>;
  };
  let equipmentRepository: {
    getById: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    characterRepository = {
      getCompanionRoster: vi.fn().mockResolvedValue({
        companions: [
          { id: horseId, name: "Relámpago", kind: "mount", creatureId: "c1" },
          { id: muleId, name: "Mula", kind: "animal", creatureId: "c2" },
          { id: hirelingId, name: "Aldric", kind: "hireling" },
        ],
        systems: ["sys"],
        inventory: [inventoryRow()],
      }),
      replaceInventory: vi.fn().mockResolvedValue({ equipment: [] }),
    };
    equipmentRepository = {
      getById: vi.fn().mockResolvedValue({ id: "eq-cart", vehicle: { kind: "land" } }),
    };
  });

  function useCase() {
    return new SetVehicleDraft(
      characterRepository as never,
      equipmentRepository as never
    );
  }

  it("hitches draftable companions to a vehicle", async () => {
    await useCase().execute({
      id: "char1",
      instanceId,
      userId: "user1",
      companionIds: [horseId, muleId],
    });

    expect(characterRepository.replaceInventory).toHaveBeenCalledWith(
      "char1",
      "user1",
      [expect.objectContaining({ instanceId, drawnBy: [horseId, muleId] })]
    );
  });

  it("clears the team with an empty list", async () => {
    characterRepository.getCompanionRoster.mockResolvedValue({
      companions: [{ id: horseId, name: "Relámpago", kind: "mount", creatureId: "c1" }],
      systems: [],
      inventory: [inventoryRow({ drawnBy: [horseId] })],
    });

    await useCase().execute({
      id: "char1",
      instanceId,
      userId: "user1",
      companionIds: [],
    });

    expect(characterRepository.replaceInventory.mock.calls[0][2][0].drawnBy).toEqual([]);
  });

  it("rejects a non-vehicle catalog item", async () => {
    equipmentRepository.getById.mockResolvedValue({ id: "eq-cart" });
    await expect(useCase().execute({
      id: "char1",
      instanceId,
      userId: "user1",
      companionIds: [horseId],
    })).rejects.toThrow(ValidationError);
  });

  it("rejects hirelings and mounts without a creature", async () => {
    await expect(useCase().execute({
      id: "char1",
      instanceId,
      userId: "user1",
      companionIds: [hirelingId],
    })).rejects.toThrow(ValidationError);

    characterRepository.getCompanionRoster.mockResolvedValue({
      companions: [{ id: horseId, name: "Relámpago", kind: "mount" }],
      systems: [],
      inventory: [inventoryRow()],
    });
    await expect(useCase().execute({
      id: "char1",
      instanceId,
      userId: "user1",
      companionIds: [horseId],
    })).rejects.toThrow(ValidationError);
  });

  it("rejects a companion already hitched to another vehicle", async () => {
    characterRepository.getCompanionRoster.mockResolvedValue({
      companions: [{ id: horseId, name: "Relámpago", kind: "mount", creatureId: "c1" }],
      systems: [],
      inventory: [
        inventoryRow(),
        inventoryRow({ instanceId: otherCartId, equipmentId: "eq-cart-2", drawnBy: [horseId] }),
      ],
    });
    await expect(useCase().execute({
      id: "char1",
      instanceId,
      userId: "user1",
      companionIds: [horseId],
    })).rejects.toThrow(ConflictError);
  });

  it("throws NotFoundError when the instance or companion is missing", async () => {
    await expect(useCase().execute({
      id: "char1",
      instanceId: "507f1f77bcf86cd799439099",
      userId: "user1",
      companionIds: [],
    })).rejects.toThrow(NotFoundError);

    await expect(useCase().execute({
      id: "char1",
      instanceId,
      userId: "user1",
      companionIds: ["507f1f77bcf86cd799439099"],
    })).rejects.toThrow(NotFoundError);
  });
});
