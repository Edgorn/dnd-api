import IPersonajeRepository from "../repositories/IPersonajeRepository";
import { CharacterCampaignLink, LevelUpData, PersonajeApi, PersonajeBasico, TypeAddEquipment, TypeCrearPersonaje, TypeDeleteEquipment, TypeEquipEquipment, TypeToggleFavoriteEquipment, ToggleFavoriteEquipmentResponse, TypeBindPactEquipment, TypeLevelUp, TypeLearnSpells, TypePrepareSpells, TypeBindSpellPrivileges, UpdateCharacterMoneyResponse, UpdateCharacterEquipmentResponse, CharacterCompanionInput, UpdateCharacterCompanionsResponse } from "../types/personajes.types";

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

  equipEquipment(data: TypeEquipEquipment): Promise<{ completo: PersonajeApi; basico: PersonajeBasico }> {
    return this.personajeRepository.equipEquipment(data);
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

  getByIds(idCharacters: string[]): Promise<PersonajeBasico[]> {
    return this.personajeRepository.getByIds(idCharacters);
  }

  getCampaignLink(characterId: string): Promise<CharacterCampaignLink | null> {
    return this.personajeRepository.getCampaignLink(characterId);
  }

  assignToCampaign(characterId: string, campaignId: string): Promise<PersonajeBasico | null> {
    return this.personajeRepository.assignToCampaign(characterId, campaignId);
  }

  bindPactEquipment(data: TypeBindPactEquipment): Promise<{ completo: PersonajeApi; basico: PersonajeBasico }> {
    return this.personajeRepository.bindPactEquipment(data);
  }

  learnSpells(data: TypeLearnSpells): Promise<PersonajeApi> {
    return this.personajeRepository.learnSpells(data);
  }

  prepareSpells(data: TypePrepareSpells): Promise<PersonajeApi> {
    return this.personajeRepository.prepareSpells(data);
  }

  bindSpellPrivileges(data: TypeBindSpellPrivileges): Promise<PersonajeApi> {
    return this.personajeRepository.bindSpellPrivileges(data);
  }

  añadirForma(data: { id: string, form: string }): Promise<PersonajeApi | null> {
    return this.personajeRepository.añadirForma(data);
  }

  updateCompanions(
    id: string,
    companions: CharacterCompanionInput[],
    userId: string
  ): Promise<UpdateCharacterCompanionsResponse> {
    return this.personajeRepository.updateCompanions(id, companions, userId);
  }
}
