import IPersonajeRepository from "../repositories/IPersonajeRepository";
import { LevelUpData, PersonajeApi, PersonajeBasico, TypeAddEquipment, TypeCrearPersonaje, TypeDeleteEquipment, TypeEquiparArmadura, TypeToggleFavoriteEquipment, ToggleFavoriteEquipmentResponse, TypeLevelUp, UpdateCharacterMoneyResponse, UpdateCharacterEquipmentResponse } from "../types/personajes.types";

export default class PersonajeService {
  constructor(private readonly personajeRepository: IPersonajeRepository) { }

  consultarPorUsuario(id: string): Promise<PersonajeBasico[]> {
    return this.personajeRepository.consultarPorUsuario(id);
  }

  crear(data: TypeCrearPersonaje): Promise<PersonajeBasico | null> {
    return this.personajeRepository.crear(data);
  }

  consultarPersonaje(idCharacter: string, user: string): Promise<PersonajeApi> {
    return this.personajeRepository.consultarPorId(idCharacter, user);
  }

  addEquipment(data: TypeAddEquipment): Promise<UpdateCharacterEquipmentResponse> {
    return this.personajeRepository.addEquipment(data);
  }

  deleteEquipment(data: TypeDeleteEquipment): Promise<UpdateCharacterEquipmentResponse> {
    return this.personajeRepository.deleteEquipment(data);
  }

  equiparArmadura(data: TypeEquiparArmadura): Promise<{ completo: PersonajeApi, basico: PersonajeBasico }> {
    return this.personajeRepository.equiparArmadura(data);
  }

  toggleFavoriteEquipment(data: TypeToggleFavoriteEquipment): Promise<ToggleFavoriteEquipmentResponse> {
    return this.personajeRepository.toggleFavoriteEquipment(data);
  }

  updateMoney(id: string, money: { quantity: number; unit: string }[]): Promise<UpdateCharacterMoneyResponse> {
    return this.personajeRepository.updateMoney(id, money);
  }

  updateXp(id: string, xp: number, userId: string): Promise<void> {
    return this.personajeRepository.updateXp(id, xp, userId);
  }

  getLevelUpData(id: string, classId: string, userId: string): Promise<LevelUpData> {
    return this.personajeRepository.getLevelUpData(id, classId, userId);
  }

  levelUp(data: TypeLevelUp): Promise<{ completo: PersonajeApi, basico: PersonajeBasico }> {
    return this.personajeRepository.levelUp(data);
  }

  vincularPacto(data: { equip: string, id: string }): Promise<{ completo: PersonajeApi, basico: PersonajeBasico } | null> {
    return this.personajeRepository.vincularPacto(data);
  }

  aprenderConjuros(data: { id: string, spells: string[], type: string }): Promise<PersonajeApi | null> {
    return this.personajeRepository.aprenderConjuros(data);
  }

  añadirForma(data: { id: string, form: string }): Promise<PersonajeApi | null> {
    return this.personajeRepository.añadirForma(data);
  }
}
