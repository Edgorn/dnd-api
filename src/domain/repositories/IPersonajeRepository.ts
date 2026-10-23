import { CharacterCampaignLink, TypeCrearPersonaje, PersonajeBasico, PersonajeApi, ConsultarPersonajeOptions, TypeAddEquipment, TypeDeleteEquipment, TypeEquipEquipment, TypeToggleFavoriteEquipment, ToggleFavoriteEquipmentResponse, TypeBindWeaponBond, LevelUpData, TypeLevelUp, TypeLearnSpells, TypeCopySpells, TypePrepareSpells, TypeBindSpellPrivileges, TypeUseTrait, TypeRestCharacter, TypeSpendHitDice, TypeApplyCharacterHp, TypeSpendSpellSlot, TypeApplyCharacterCondition, TypeUpdateCharacterCondition, TypeRemoveCharacterCondition, TypeAddCharacterFormPersist, TypeSetCharacterFormActive, UpdateCharacterMoneyResponse, UpdateCharacterEquipmentResponse, CharacterCompanionInput, UpdateCharacterCompanionsResponse } from "../types/personajes.types";

export default interface IPersonajeRepository {
  consultarPorUsuario(id: string): Promise<PersonajeBasico[]>
  crear(data: TypeCrearPersonaje): Promise<PersonajeBasico | null>
  consultarPorId(idCharacter: string, user: string, options?: ConsultarPersonajeOptions): Promise<PersonajeApi>
  addEquipment(data: TypeAddEquipment): Promise<UpdateCharacterEquipmentResponse>
  deleteEquipment(data: TypeDeleteEquipment): Promise<UpdateCharacterEquipmentResponse>
  equipEquipment(data: TypeEquipEquipment): Promise<{ completo: PersonajeApi, basico: PersonajeBasico }>
  toggleFavoriteEquipment(data: TypeToggleFavoriteEquipment): Promise<ToggleFavoriteEquipmentResponse>
  updateMoney(id: string, money: { quantity: number; unit: string }[]): Promise<UpdateCharacterMoneyResponse>
  updateXp(id: string, xp: number, userId: string): Promise<void>
  getLevelUpData(id: string, classId: string, userId: string): Promise<LevelUpData>
  levelUp(data: TypeLevelUp): Promise<{ completo: PersonajeApi, basico: PersonajeBasico }>
  getByIds(idCharacters: string[]): Promise<PersonajeBasico[]>
  getCampaignLink(characterId: string): Promise<CharacterCampaignLink | null>
  assignToCampaign(characterId: string, campaignId: string): Promise<PersonajeBasico | null>
  bindWeaponBond(data: TypeBindWeaponBond): Promise<{ completo: PersonajeApi, basico: PersonajeBasico }>
  learnSpells(data: TypeLearnSpells): Promise<PersonajeApi>
  copySpells(data: TypeCopySpells): Promise<PersonajeApi>
  prepareSpells(data: TypePrepareSpells): Promise<PersonajeApi>
  bindSpellPrivileges(data: TypeBindSpellPrivileges): Promise<PersonajeApi>
  useTrait(data: TypeUseTrait): Promise<PersonajeApi>
  deactivateTrait(data: TypeUseTrait): Promise<PersonajeApi>
  restCharacter(data: TypeRestCharacter): Promise<PersonajeApi>
  spendHitDice(data: TypeSpendHitDice): Promise<PersonajeApi>
  applyHp(data: TypeApplyCharacterHp): Promise<PersonajeApi>
  spendSpellSlot(data: TypeSpendSpellSlot): Promise<PersonajeApi>
  applyCharacterCondition(data: TypeApplyCharacterCondition): Promise<PersonajeApi>
  updateCharacterCondition(data: TypeUpdateCharacterCondition): Promise<PersonajeApi>
  removeCharacterCondition(data: TypeRemoveCharacterCondition): Promise<PersonajeApi>
  getOwnedTraitIds(id: string, userId: string): Promise<string[]>
  addForm(data: TypeAddCharacterFormPersist): Promise<PersonajeApi>
  activateForm(data: TypeSetCharacterFormActive): Promise<PersonajeApi>
  deactivateForm(data: TypeSetCharacterFormActive): Promise<PersonajeApi>
  updateCompanions(id: string, companions: CharacterCompanionInput[], userId: string): Promise<UpdateCharacterCompanionsResponse>
}
