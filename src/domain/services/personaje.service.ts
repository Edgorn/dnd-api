import IPersonajeRepository from "../repositories/IPersonajeRepository";
import { ClaseLevelUpCharacter, PersonajeApi, PersonajeBasico, TypeAddEquipment, TypeCrearPersonaje, TypeDeleteEquipment, TypeEquiparArmadura, TypeToggleFavoriteEquipment, ToggleFavoriteEquipmentResponse, TypeSubirNivel, UpdateCharacterMoneyResponse, UpdateCharacterEquipmentResponse } from "../types/personajes.types";

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

  obtenerPdf(idCharacter: string, user: string): Promise<any> {
    return this.personajeRepository.obtenerPdf(idCharacter, user);
  }

  addEquipment(data: TypeAddEquipment): Promise<UpdateCharacterEquipmentResponse> {
    return this.personajeRepository.addEquipment(data);
  }

  deleteEquipment(data: TypeDeleteEquipment): Promise<UpdateCharacterEquipmentResponse> {
    return this.personajeRepository.deleteEquipment(data);
  }

  equiparArmadura(data: TypeEquiparArmadura): Promise<{ completo: PersonajeApi, basico: PersonajeBasico } | null> {
    return this.personajeRepository.equiparArmadura(data);
  }

  toggleFavoriteEquipment(data: TypeToggleFavoriteEquipment): Promise<ToggleFavoriteEquipmentResponse> {
    return this.personajeRepository.toggleFavoriteEquipment(data);
  }

  updateMoney(id: string, money: { quantity: number; unit: string }[]): Promise<UpdateCharacterMoneyResponse> {
    return this.personajeRepository.updateMoney(id, money);
  }

  cambiarXp({ id, XP }: { id: string, XP: number }): Promise<{ completo: PersonajeApi, basico: PersonajeBasico } | null> {
    return this.personajeRepository.cambiarXp({ id, XP });
  }

  subirNivelDatos({ id, clase }: { id: string, clase: string }): Promise<ClaseLevelUpCharacter | null> {
    return this.personajeRepository.subirNivelDatos({ id, clase });
  }

  subirNivel(data: TypeSubirNivel): Promise<{ completo: PersonajeApi, basico: PersonajeBasico } | null> {
    return this.personajeRepository.subirNivel(data);
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
