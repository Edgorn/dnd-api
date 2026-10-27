import ICharacterRepository from "../../../domain/repositories/ICharacterRepository";
import IEquipmentRepository from "../../../domain/repositories/IEquipmentRepository";
import { ConflictError, NotFoundError, ValidationError } from "../../../domain/errors/AppError";
import {
  TypeMoveEquipment,
  UpdateCharacterEquipmentResponse,
} from "../../../domain/types/character.types";
import {
  HolderCatalogEntry,
  isKnownHolder,
  moveInventoryRows,
  wouldCreateHolderCycle,
} from "../../../utils/inventoryHolders";

export default class MoveEquipment {
  constructor(
    private readonly characterRepository: ICharacterRepository,
    private readonly equipmentRepository: IEquipmentRepository
  ) {}

  async execute(data: TypeMoveEquipment): Promise<UpdateCharacterEquipmentResponse> {
    const { id, instanceId, userId, holderId, quantity } = data;
    const roster = await this.characterRepository.getCompanionRoster(id, userId);
    const item = roster.inventory.find(row => row.instanceId === instanceId);
    if (!item) {
      throw new NotFoundError("No se encontró el equipamiento en el personaje");
    }

    if (item.equipped && !item.holderId) {
      throw new ConflictError("No se puede mover un objeto equipado por el personaje");
    }

    const catalogRows = await this.equipmentRepository.getCharacterEquipmentsByIds(
      roster.inventory.map(row => ({
        instanceId: row.instanceId,
        equipmentId: row.equipmentId,
        id: row.equipmentId,
        quantity: row.quantity,
        equipped: row.equipped,
        isMagic: row.isMagic,
        isBond: row.isBond,
        isFavorite: row.isFavorite,
      }))
    ) ?? [];

    const catalogByEquipmentId = new Map<string, HolderCatalogEntry>();
    for (const row of catalogRows) {
      catalogByEquipmentId.set(row.id, {
        vehicle: row.vehicle,
        containerStats: row.containerStats,
      });
    }

    if (!isKnownHolder(
      holderId,
      roster.inventory,
      roster.companions.map(companion => companion.id),
      catalogByEquipmentId
    )) {
      throw new ValidationError("El portador no es un compañero, contenedor o vehículo válido");
    }

    if (wouldCreateHolderCycle(roster.inventory, instanceId, holderId)) {
      throw new ValidationError("No se puede mover un contenedor dentro de su propio contenido");
    }

    let next;
    try {
      next = moveInventoryRows(roster.inventory, instanceId, holderId, quantity);
    } catch (error) {
      if (error instanceof Error && error.message === "QUANTITY_EXCEEDS_STACK") {
        throw new ValidationError("La cantidad supera la pila de la instancia");
      }
      throw error;
    }

    return this.characterRepository.replaceInventory(id, userId, next);
  }
}
