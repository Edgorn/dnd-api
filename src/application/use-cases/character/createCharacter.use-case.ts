import CharacterService from "../../../domain/services/character.service";
import {
  CharacterStartingEquipmentInput,
  CharacterBasic,
  CharacterEquipmentMongo,
  TypeCreateCharacter,
} from "../../../domain/types/character.types";
import SystemService from "../../../domain/services/system.service";
import IEquipmentRepository from "../../../domain/repositories/IEquipmentRepository";
import { NotFoundError, ValidationError } from "../../../domain/errors/AppError";
import { addToInventory, createInventoryInstance } from "../../../utils/inventoryStacks";
import { CompanionInputListSchema } from "../../../infrastructure/http/schemas/character.schema";
import { GrantedEquipmentListSchema } from "../../../infrastructure/http/schemas/equipment.schema";
import { extractEquipmentCustomization } from "../../../utils/grantedEquipment";

export type CreateCharacterInput = Omit<TypeCreateCharacter, "equipment"> & {
  equipment: CharacterStartingEquipmentInput[];
};

export default class CreateCharacter {
  constructor(
    private readonly characterService: CharacterService,
    private readonly systemService: SystemService,
    private readonly equipmentRepository: IEquipmentRepository
  ) { }

  async execute(data: CreateCharacterInput): Promise<CharacterBasic | null> {
    await this.systemService.assertSingleBase(data.systems || []);
    if (data.raceId) {
      await this.systemService.assertRaceAllowed(data.raceId, data.systems || []);
    }
    if (data.classId) {
      await this.systemService.assertClassAllowed(data.classId, data.systems || []);
    }
    const companions = this.parseCompanions(data.companions);
    const equipment = await this.resolveStartingEquipment(this.parseStartingEquipment(data.equipment));
    return this.characterService.create({ ...data, equipment, companions });
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
  ): Promise<CharacterEquipmentMongo[]> {
    let inventory: CharacterEquipmentMongo[] = [];

    for (const item of starting) {
      const catalogId = item.id ?? item.equipmentId;
      if (!catalogId) {
        throw new ValidationError("El equipamiento inicial debe incluir id");
      }

      const catalog = await this.equipmentRepository.getById(catalogId);
      if (!catalog) {
        throw new NotFoundError("Equipamiento no encontrado");
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
