import { CharacterCampaignLink, TypeCrearPersonaje, PersonajeBasico, PersonajeApi, TypeAddEquipment, TypeDeleteEquipment, TypeEquiparArmadura, TypeToggleFavoriteEquipment, ToggleFavoriteEquipmentResponse, LevelUpData, TypeLevelUp, TypeLearnSpells, TypePrepareSpells, TypeBindSpellPrivileges, UpdateCharacterMoneyResponse, UpdateCharacterEquipmentResponse } from "../types/personajes.types";

export default interface IPersonajeRepository {
  consultarPorUsuario(id: string): Promise<PersonajeBasico[]>
  crear(data: TypeCrearPersonaje): Promise<PersonajeBasico | null>
  consultarPorId(idCharacter: string, user: string): Promise<PersonajeApi>
  addEquipment(data: TypeAddEquipment): Promise<UpdateCharacterEquipmentResponse>
  deleteEquipment(data: TypeDeleteEquipment): Promise<UpdateCharacterEquipmentResponse>
  equiparArmadura(data: TypeEquiparArmadura): Promise<{ completo: PersonajeApi, basico: PersonajeBasico }>
  toggleFavoriteEquipment(data: TypeToggleFavoriteEquipment): Promise<ToggleFavoriteEquipmentResponse>
  updateMoney(id: string, money: { quantity: number; unit: string }[]): Promise<UpdateCharacterMoneyResponse>
  updateXp(id: string, xp: number, userId: string): Promise<void>
  getLevelUpData(id: string, classId: string, userId: string): Promise<LevelUpData>
  levelUp(data: TypeLevelUp): Promise<{ completo: PersonajeApi, basico: PersonajeBasico }>
  getByIds(idCharacters: string[]): Promise<PersonajeBasico[]>
  getCampaignLink(characterId: string): Promise<CharacterCampaignLink | null>
  assignToCampaign(characterId: string, campaignId: string): Promise<PersonajeBasico | null>
  vincularPacto(data: { equip: string, id: string }): Promise<{ completo: PersonajeApi, basico: PersonajeBasico } | null>
  learnSpells(data: TypeLearnSpells): Promise<PersonajeApi>
  prepareSpells(data: TypePrepareSpells): Promise<PersonajeApi>
  bindSpellPrivileges(data: TypeBindSpellPrivileges): Promise<PersonajeApi>
  añadirForma(data: { id: string, form: string }): Promise<PersonajeApi | null>
}
