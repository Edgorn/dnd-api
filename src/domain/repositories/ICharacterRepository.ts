import { CharacterCampaignLink, TypeCreateCharacter, CharacterBasic, CharacterListItem, CharacterApi, CharacterGetResult, GetCharacterOptions, GetCharactersByUserOptions, GetLevelUpDataOptions, TypeAddEquipment, TypeDeleteEquipment, TypeEquipEquipment, TypeToggleFavoriteEquipment, ToggleFavoriteEquipmentResponse, TypeBindWeaponBond, LevelUpDataResult, TypeLevelUp, TypeLearnSpells, TypeCopySpells, TypePrepareSpells, TypeBindSpellPrivileges, TypeUseTrait, TypeRestCharacter, TypeSpendHitDice, TypeApplyCharacterHp, TypeSpendSpellSlot, TypeApplyCharacterCondition, TypeUpdateCharacterCondition, TypeRemoveCharacterCondition, TypeAddCharacterFormPersist, TypeSetCharacterFormActive, UpdateCharacterMoneyResponse, UpdateCharacterEquipmentResponse, CharacterCompanionInput, UpdateCharacterCompanionsResponse, InputUpdateCharacterFlavor, UpdateCharacterFlavorResponse } from "../types/character.types";

export default interface ICharacterRepository {
  getByUser(id: string, options?: GetCharactersByUserOptions): Promise<CharacterListItem[]>
  create(data: TypeCreateCharacter): Promise<CharacterBasic | null>
  getById(idCharacter: string, user: string, options?: GetCharacterOptions): Promise<CharacterGetResult>
  getByIdForExport(idCharacter: string, user: string, options?: GetCharacterOptions): Promise<{ character: CharacterApi; ownerId: string }>
  addEquipment(data: TypeAddEquipment): Promise<UpdateCharacterEquipmentResponse>
  deleteEquipment(data: TypeDeleteEquipment): Promise<UpdateCharacterEquipmentResponse>
  equipEquipment(data: TypeEquipEquipment): Promise<{ full: CharacterApi, basic: CharacterBasic }>
  toggleFavoriteEquipment(data: TypeToggleFavoriteEquipment): Promise<ToggleFavoriteEquipmentResponse>
  updateMoney(id: string, money: { quantity: number; unit: string }[]): Promise<UpdateCharacterMoneyResponse>
  updateXp(id: string, xp: number, userId: string): Promise<void>
  getLevelUpData(id: string, classId: string, userId: string, options?: GetLevelUpDataOptions): Promise<LevelUpDataResult>
  levelUp(data: TypeLevelUp): Promise<{ full: CharacterApi, basic: CharacterBasic }>
  getByIds(idCharacters: string[]): Promise<CharacterBasic[]>
  getCampaignLink(characterId: string): Promise<CharacterCampaignLink | null>
  assignToCampaign(characterId: string, campaignId: string): Promise<CharacterBasic | null>
  bindWeaponBond(data: TypeBindWeaponBond): Promise<{ full: CharacterApi, basic: CharacterBasic }>
  learnSpells(data: TypeLearnSpells): Promise<CharacterApi>
  copySpells(data: TypeCopySpells): Promise<CharacterApi>
  prepareSpells(data: TypePrepareSpells): Promise<CharacterApi>
  bindSpellPrivileges(data: TypeBindSpellPrivileges): Promise<CharacterApi>
  useTrait(data: TypeUseTrait): Promise<CharacterApi>
  deactivateTrait(data: TypeUseTrait): Promise<CharacterApi>
  restCharacter(data: TypeRestCharacter): Promise<CharacterApi>
  spendHitDice(data: TypeSpendHitDice): Promise<CharacterApi>
  applyHp(data: TypeApplyCharacterHp): Promise<CharacterApi>
  spendSpellSlot(data: TypeSpendSpellSlot): Promise<CharacterApi>
  applyCharacterCondition(data: TypeApplyCharacterCondition): Promise<CharacterApi>
  updateCharacterCondition(data: TypeUpdateCharacterCondition): Promise<CharacterApi>
  removeCharacterCondition(data: TypeRemoveCharacterCondition): Promise<CharacterApi>
  getOwnedTraitIds(id: string, userId: string): Promise<string[]>
  addForm(data: TypeAddCharacterFormPersist): Promise<CharacterApi>
  activateForm(data: TypeSetCharacterFormActive): Promise<CharacterApi>
  deactivateForm(data: TypeSetCharacterFormActive): Promise<CharacterApi>
  updateCompanions(id: string, companions: CharacterCompanionInput[], userId: string): Promise<UpdateCharacterCompanionsResponse>
  updateFlavor(data: InputUpdateCharacterFlavor): Promise<UpdateCharacterFlavorResponse>
}
