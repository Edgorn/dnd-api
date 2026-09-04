import { TypeEntradaPersonajeCampaña } from "../types/campañas.types";
import { TypeCrearPersonaje, PersonajeBasico, PersonajeApi, TypeAddEquipment, TypeDeleteEquipment, TypeEquiparArmadura, TypeToggleFavoriteEquipment, ToggleFavoriteEquipmentResponse, ClaseLevelUpCharacter, TypeSubirNivel, UpdateCharacterMoneyResponse, UpdateCharacterEquipmentResponse } from "../types/personajes.types";

export default interface IPersonajeRepository {
  consultarPorUsuario(id: string): Promise<PersonajeBasico[]>
  crear(data: TypeCrearPersonaje): Promise<PersonajeBasico | null>
  consultarPorId(idCharacter: string, user: string): Promise<PersonajeApi>
  obtenerPdf(idCharacter: string, user: string): Promise<any>
  addEquipment(data: TypeAddEquipment): Promise<UpdateCharacterEquipmentResponse>
  deleteEquipment(data: TypeDeleteEquipment): Promise<UpdateCharacterEquipmentResponse>
  equiparArmadura(data: TypeEquiparArmadura): Promise<{ completo: PersonajeApi, basico: PersonajeBasico }>
  toggleFavoriteEquipment(data: TypeToggleFavoriteEquipment): Promise<ToggleFavoriteEquipmentResponse>
  updateMoney(id: string, money: { quantity: number; unit: string }[]): Promise<UpdateCharacterMoneyResponse>
  cambiarXp({ id, XP }: { id: string, XP: number }): Promise<{ completo: PersonajeApi, basico: PersonajeBasico } | null>
  subirNivelDatos({ id, clase }: { id: string, clase: string }): Promise<ClaseLevelUpCharacter | null>
  subirNivel(data: TypeSubirNivel): Promise<{ completo: PersonajeApi, basico: PersonajeBasico } | null>
  consultarPorIds(idCharacters: string[]): Promise<PersonajeBasico[]>
  entrarCampaña(data: TypeEntradaPersonajeCampaña): Promise<PersonajeBasico | null>
  vincularPacto(data: { equip: string, id: string }): Promise<{ completo: PersonajeApi, basico: PersonajeBasico } | null>
  aprenderConjuros(data: { id: string, spells: string[], type: string }): Promise<PersonajeApi | null>
  añadirForma(data: { id: string, form: string }): Promise<PersonajeApi | null>
}
