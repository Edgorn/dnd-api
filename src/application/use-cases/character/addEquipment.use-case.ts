import CharacterService from "../../../domain/services/character.service";
import IEquipmentRepository from "../../../domain/repositories/IEquipmentRepository";
import { TypeAddEquipment, UpdateCharacterEquipmentResponse } from "../../../domain/types/character.types";
import { NotFoundError } from "../../../domain/errors/AppError";

export default class AddEquipment {
  constructor(
    private readonly characterService: CharacterService,
    private readonly equipmentRepository: IEquipmentRepository
  ) { }

  async execute(data: Omit<TypeAddEquipment, "isMagic">): Promise<UpdateCharacterEquipmentResponse> {
    const catalog = await this.equipmentRepository.getById(data.equipmentId);
    if (!catalog) {
      throw new NotFoundError("Equipamiento no encontrado");
    }

    const hpCurrent = catalog.vehicle?.hitPoints;
    return this.characterService.addEquipment({
      ...data,
      isMagic: catalog.isMagic === true,
      ...(hpCurrent !== undefined ? { hpCurrent } : {}),
    });
  }
}
