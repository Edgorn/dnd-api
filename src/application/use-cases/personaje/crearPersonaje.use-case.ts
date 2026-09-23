import PersonajeService from "../../../domain/services/personaje.service";
import {
  CharacterStartingEquipmentInput,
  PersonajeBasico,
  PersonajeEquipmentMongo,
  TypeCrearPersonaje,
} from "../../../domain/types/personajes.types";
import ISystemRepository from "../../../domain/repositories/ISystemRepository";
import IEquipmentRepository from "../../../domain/repositories/IEquipmentRepository";
import { NotFoundError, ValidationError } from "../../../domain/errors/AppError";
import { addToInventory, createInventoryInstance } from "../../../utils/inventoryStacks";
import { CompanionInputListSchema } from "../../../infrastructure/http/schemas/personaje.schema";
import { GrantedEquipmentListSchema } from "../../../infrastructure/http/schemas/equipment.schema";
import { extractEquipmentCustomization } from "../../../utils/grantedEquipment";

export type CreateCharacterInput = Omit<TypeCrearPersonaje, "equipment"> & {
  equipment: CharacterStartingEquipmentInput[];
};

export default class CrearPersonaje {
  constructor(
    private readonly personajeService: PersonajeService,
    private readonly systemRepository: ISystemRepository,
    private readonly equipmentRepository: IEquipmentRepository
  ) { }

  async execute(data: CreateCharacterInput): Promise<PersonajeBasico | null> {
    await this.systemRepository.verifySystemsNotBase(data.systems || []);
    const companions = this.parseCompanions(data.companions);
    const equipment = await this.resolveStartingEquipment(this.parseStartingEquipment(data.equipment));
    return this.personajeService.crear({ ...data, equipment, companions });
  }

  private parseCompanions(companions: CreateCharacterInput["companions"]) {
    if (companions === undefined) {
      return [];
    }

    const parsed = CompanionInputListSchema.safeParse(companions);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues.map(issue => issue.message).join(", "));
    }

    return parsed.data;
  }

  private parseStartingEquipment(
    equipment: CreateCharacterInput["equipment"] | undefined
  ): CharacterStartingEquipmentInput[] {
    const parsed = GrantedEquipmentListSchema.safeParse(equipment ?? []);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.issues.map(issue => issue.message).join(", "));
    }
    return parsed.data;
  }

  private async resolveStartingEquipment(
    starting: CharacterStartingEquipmentInput[]
  ): Promise<PersonajeEquipmentMongo[]> {
    let inventory: PersonajeEquipmentMongo[] = [];

    for (const item of starting) {
      const catalogId = item.id ?? item.equipmentId;
      if (!catalogId) {
        throw new ValidationError("El equipamiento inicial debe incluir id");
      }

      const catalog = await this.equipmentRepository.getById(catalogId);
      if (!catalog) {
        throw new NotFoundError(`No se encontró el equipamiento con id: ${catalogId}`);
      }

      const customization = extractEquipmentCustomization(item);
      inventory = addToInventory(
        inventory,
        createInventoryInstance({
          equipmentId: catalog.id,
          quantity: item.quantity ?? 1,
          isMagic: catalog.isMagic === true,
          customization,
        })
      );
    }

    return inventory;
  }
}
