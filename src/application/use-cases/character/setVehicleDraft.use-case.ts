import ICharacterRepository from "../../../domain/repositories/ICharacterRepository";
import IEquipmentRepository from "../../../domain/repositories/IEquipmentRepository";
import { ConflictError, NotFoundError, ValidationError } from "../../../domain/errors/AppError";
import {
  TypeSetVehicleDraft,
  UpdateCharacterEquipmentResponse,
} from "../../../domain/types/character.types";
import {
  isCompanionHitched,
  isDraftableCompanion,
  setVehicleDrawnBy,
} from "../../../utils/vehicleDraft";

export default class SetVehicleDraft {
  constructor(
    private readonly characterRepository: ICharacterRepository,
    private readonly equipmentRepository: IEquipmentRepository
  ) {}

  async execute(data: TypeSetVehicleDraft): Promise<UpdateCharacterEquipmentResponse> {
    const { id, instanceId, userId, companionIds } = data;
    const roster = await this.characterRepository.getCompanionRoster(id, userId);
    const item = roster.inventory.find(row => row.instanceId === instanceId);
    if (!item) {
      throw new NotFoundError("No se encontró el equipamiento en el personaje");
    }

    const catalog = await this.equipmentRepository.getById(item.equipmentId);
    if (!catalog || catalog.deletedAt) {
      throw new NotFoundError("Equipamiento no encontrado");
    }
    if (!catalog.vehicle) {
      throw new ValidationError("Solo se puede enganchar tiro a un vehículo");
    }

    const companionsById = new Map(roster.companions.map(companion => [companion.id, companion]));
    for (const companionId of companionIds) {
      const companion = companionsById.get(companionId);
      if (!companion) {
        throw new NotFoundError("Compañero no encontrado");
      }
      if (!isDraftableCompanion(companion)) {
        throw new ValidationError("Solo monturas y animales con criatura pueden tirar de un vehículo");
      }
      if (isCompanionHitched(roster.inventory, companionId, instanceId)) {
        throw new ConflictError("El compañero ya tira de otro vehículo");
      }
    }

    let next;
    try {
      next = setVehicleDrawnBy(roster.inventory, instanceId, companionIds);
    } catch (error) {
      if (error instanceof Error && error.message === "INVENTORY_INSTANCE_NOT_FOUND") {
        throw new NotFoundError("No se encontró el equipamiento en el personaje");
      }
      throw error;
    }

    return this.characterRepository.replaceInventory(id, userId, next);
  }
}
