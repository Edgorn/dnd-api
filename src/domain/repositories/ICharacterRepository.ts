import { CharacterCampaignLink, TypeCreateCharacter, CharacterBasic, CharacterListItem, CharacterApi, CharacterGetResult, GetCharacterOptions, GetCharactersByUserOptions, GetLevelUpDataOptions, TypeAddEquipment, TypeDeleteEquipment, TypeEquipEquipment, TypeToggleFavoriteEquipment, ToggleFavoriteEquipmentResponse, TypeUpdateEquipmentCustomization, UpdateCharacterEquipmentCustomizationResponse, TypeBindWeaponBond, CharacterEquipmentStateResponse, CharacterLevelUpResponse, CharacterSpellStateResponse, CharacterStatePatch, LevelUpDataResult, TypeLevelUp, TypeLearnSpells, TypeCopySpells, TypePrepareSpells, TypeBindSpellPrivileges, TypeUseTrait, TypeRestCharacter, TypeSpendHitDice, TypeApplyCharacterHp, TypeSpendSpellSlot, TypeApplyCharacterCondition, TypeUpdateCharacterCondition, TypeRemoveCharacterCondition, TypeAddCharacterFormPersist, TypeSetCharacterFormActive, UpdateCharacterMoneyResponse, UpdateCharacterXpResponse, UpdateCharacterEquipmentResponse, CharacterCompanion, CharacterCompanionInput, CharacterCompanionRoster, UpdateCharacterCompanionsResponse, InputUpdateCharacterFlavor, UpdateCharacterFlavorResponse, CharacterEquipmentMongo } from "../types/character.types";

export default interface ICharacterRepository {
  getByUser(id: string, options?: GetCharactersByUserOptions): Promise<CharacterListItem[]>
  create(data: TypeCreateCharacter): Promise<CharacterBasic | null>
  getById(idCharacter: string, user: string, options?: GetCharacterOptions): Promise<CharacterGetResult>
  getByIdForExport(idCharacter: string, user: string, options?: GetCharacterOptions): Promise<{ character: CharacterApi; ownerId: string }>
  addEquipment(data: TypeAddEquipment): Promise<UpdateCharacterEquipmentResponse>
  deleteEquipment(data: TypeDeleteEquipment): Promise<UpdateCharacterEquipmentResponse>
  equipEquipment(data: TypeEquipEquipment): Promise<CharacterEquipmentStateResponse>
  replaceInventory(id: string, userId: string, inventory: CharacterEquipmentMongo[]): Promise<UpdateCharacterEquipmentResponse>
  toggleFavoriteEquipment(data: TypeToggleFavoriteEquipment): Promise<ToggleFavoriteEquipmentResponse>
  updateEquipmentCustomization(data: TypeUpdateEquipmentCustomization): Promise<UpdateCharacterEquipmentCustomizationResponse>
  updateMoney(id: string, money: { quantity: number; unit: string }[]): Promise<UpdateCharacterMoneyResponse>
  updateXp(id: string, xp: number, userId: string): Promise<UpdateCharacterXpResponse>
  getLevelUpData(id: string, classId: string, userId: string, options?: GetLevelUpDataOptions): Promise<LevelUpDataResult>
  levelUp(data: TypeLevelUp): Promise<CharacterLevelUpResponse>
  getByIds(idCharacters: string[]): Promise<CharacterBasic[]>
  getCampaignLink(characterId: string): Promise<CharacterCampaignLink | null>
  assignToCampaign(characterId: string, campaignId: string): Promise<CharacterBasic | null>
  bindWeaponBond(data: TypeBindWeaponBond): Promise<CharacterEquipmentStateResponse>
  learnSpells(data: TypeLearnSpells): Promise<CharacterSpellStateResponse>
  copySpells(data: TypeCopySpells): Promise<CharacterSpellStateResponse>
  prepareSpells(data: TypePrepareSpells): Promise<CharacterSpellStateResponse>
  bindSpellPrivileges(data: TypeBindSpellPrivileges): Promise<CharacterSpellStateResponse>
  useTrait(data: TypeUseTrait): Promise<CharacterStatePatch>
  deactivateTrait(data: TypeUseTrait): Promise<CharacterStatePatch>
  restCharacter(data: TypeRestCharacter): Promise<CharacterStatePatch>
  spendHitDice(data: TypeSpendHitDice): Promise<CharacterStatePatch>
  applyHp(data: TypeApplyCharacterHp): Promise<CharacterStatePatch>
  spendSpellSlot(data: TypeSpendSpellSlot): Promise<CharacterStatePatch>
  applyCharacterCondition(data: TypeApplyCharacterCondition): Promise<CharacterStatePatch>
  updateCharacterCondition(data: TypeUpdateCharacterCondition): Promise<CharacterStatePatch>
  removeCharacterCondition(data: TypeRemoveCharacterCondition): Promise<CharacterStatePatch>
  getOwnedTraitIds(id: string, userId: string): Promise<string[]>
  addForm(data: TypeAddCharacterFormPersist): Promise<CharacterStatePatch>
  activateForm(data: TypeSetCharacterFormActive): Promise<CharacterStatePatch>
  deactivateForm(data: TypeSetCharacterFormActive): Promise<CharacterStatePatch>
  updateCompanions(id: string, companions: CharacterCompanionInput[], userId: string): Promise<UpdateCharacterCompanionsResponse>
  getCompanionRoster(id: string, userId: string): Promise<CharacterCompanionRoster>
  addCompanion(id: string, userId: string, companion: CharacterCompanionInput): Promise<UpdateCharacterCompanionsResponse>
  updateCompanion(id: string, userId: string, companionId: string, patch: Partial<CharacterCompanion>): Promise<UpdateCharacterCompanionsResponse>
  removeCompanion(id: string, userId: string, companionId: string): Promise<UpdateCharacterCompanionsResponse>
  saveCompanions(id: string, userId: string, companions: CharacterCompanion[]): Promise<UpdateCharacterCompanionsResponse>
  updateFlavor(data: InputUpdateCharacterFlavor): Promise<UpdateCharacterFlavorResponse>
}
