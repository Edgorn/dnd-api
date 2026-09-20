import PersonajeService from "../../../domain/services/personaje.service";
import IEquipmentRepository from "../../../domain/repositories/IEquipmentRepository";
import { TypeAddEquipment, UpdateCharacterEquipmentResponse } from "../../../domain/types/personajes.types";
import { NotFoundError } from "../../../domain/errors/AppError";

export default class AddEquipment {
  constructor(
    private readonly personajeService: PersonajeService,
    private readonly equipmentRepository: IEquipmentRepository
  ) { }

  async execute(data: Omit<TypeAddEquipment, "isMagic">): Promise<UpdateCharacterEquipmentResponse> {
    const catalog = await this.equipmentRepository.getById(data.equipmentId);
    if (!catalog) {
      throw new NotFoundError(`No se encontró el equipamiento con id: ${data.equipmentId}`);
    }

    return this.personajeService.addEquipment({
      ...data,
      isMagic: catalog.isMagic === true,
    });
  }
}
