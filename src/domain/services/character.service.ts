import ICharacterRepository from "../repositories/ICharacterRepository";
import { CharacterCampaignLink, GetCharacterOptions, GetCharactersByUserOptions, GetLevelUpDataOptions, CharacterGetResult, LevelUpDataResult, CharacterApi, CharacterBasic, CharacterListItem, TypeAddEquipment, TypeCreateCharacter, TypeDeleteEquipment, TypeEquipEquipment, TypeToggleFavoriteEquipment, ToggleFavoriteEquipmentResponse, TypeUpdateEquipmentCustomization, UpdateCharacterEquipmentCustomizationResponse, TypeBindWeaponBond, CharacterEquipmentStateResponse, CharacterLevelUpResponse, CharacterSpellStateResponse, CharacterStatePatch, TypeLevelUp, TypeLearnSpells, TypeCopySpells, TypePrepareSpells, TypeBindSpellPrivileges, TypeUseTrait, TypeRestCharacter, TypeSpendHitDice, TypeApplyCharacterHp, TypeSpendSpellSlot, TypeApplyCharacterCondition, TypeUpdateCharacterCondition, TypeRemoveCharacterCondition, TypeAddCharacterFormPersist, TypeSetCharacterFormActive, UpdateCharacterMoneyResponse, UpdateCharacterXpResponse, UpdateCharacterEquipmentResponse, CharacterCompanionInput, UpdateCharacterCompanionsResponse, InputUpdateCharacterFlavor, UpdateCharacterFlavorResponse } from "../types/character.types";

export default class CharacterService {
  constructor(private readonly characterRepository: ICharacterRepository) { }

  getByUser(id: string, options?: GetCharactersByUserOptions): Promise<CharacterListItem[]> {
    return this.characterRepository.getByUser(id, options);
  }

  create(data: TypeCreateCharacter): Promise<CharacterBasic | null> {
    return this.characterRepository.create(data);
  }

  getById(
    idCharacter: string,
    user: string,
    options?: GetCharacterOptions
  ): Promise<CharacterGetResult> {
    return this.characterRepository.getById(idCharacter, user, options);
  }

  getByIdForExport(
    idCharacter: string,
    user: string,
    options?: GetCharacterOptions
  ): Promise<{ character: CharacterApi; ownerId: string }> {
    return this.characterRepository.getByIdForExport(idCharacter, user, options);
  }

  addEquipment(data: TypeAddEquipment): Promise<UpdateCharacterEquipmentResponse> {
    return this.characterRepository.addEquipment(data);
  }

  deleteEquipment(data: TypeDeleteEquipment): Promise<UpdateCharacterEquipmentResponse> {
    return this.characterRepository.deleteEquipment(data);
  }

  equipEquipment(data: TypeEquipEquipment): Promise<CharacterEquipmentStateResponse> {
    return this.characterRepository.equipEquipment(data);
  }

  toggleFavoriteEquipment(data: TypeToggleFavoriteEquipment): Promise<ToggleFavoriteEquipmentResponse> {
    return this.characterRepository.toggleFavoriteEquipment(data);
  }

  updateEquipmentCustomization(data: TypeUpdateEquipmentCustomization): Promise<UpdateCharacterEquipmentCustomizationResponse> {
    return this.characterRepository.updateEquipmentCustomization(data);
  }

  updateMoney(id: string, money: { quantity: number; unit: string }[]): Promise<UpdateCharacterMoneyResponse> {
    return this.characterRepository.updateMoney(id, money);
  }

  updateXp(id: string, xp: number, userId: string): Promise<UpdateCharacterXpResponse> {
    return this.characterRepository.updateXp(id, xp, userId);
  }

  getLevelUpData(id: string, classId: string, userId: string, options?: GetLevelUpDataOptions): Promise<LevelUpDataResult> {
    return this.characterRepository.getLevelUpData(id, classId, userId, options);
  }

  levelUp(data: TypeLevelUp): Promise<CharacterLevelUpResponse> {
    return this.characterRepository.levelUp(data);
  }

  getByIds(idCharacters: string[]): Promise<CharacterBasic[]> {
    return this.characterRepository.getByIds(idCharacters);
  }

  getCampaignLink(characterId: string): Promise<CharacterCampaignLink | null> {
    return this.characterRepository.getCampaignLink(characterId);
  }

  assignToCampaign(characterId: string, campaignId: string): Promise<CharacterBasic | null> {
    return this.characterRepository.assignToCampaign(characterId, campaignId);
  }

  unassignFromCampaign(characterId: string, campaignId: string): Promise<{ characterId: string } | null> {
    return this.characterRepository.unassignFromCampaign(characterId, campaignId);
  }

  bindWeaponBond(data: TypeBindWeaponBond): Promise<CharacterEquipmentStateResponse> {
    return this.characterRepository.bindWeaponBond(data);
  }

  learnSpells(data: TypeLearnSpells): Promise<CharacterSpellStateResponse> {
    return this.characterRepository.learnSpells(data);
  }

  copySpells(data: TypeCopySpells): Promise<CharacterSpellStateResponse> {
    return this.characterRepository.copySpells(data);
  }

  prepareSpells(data: TypePrepareSpells): Promise<CharacterSpellStateResponse> {
    return this.characterRepository.prepareSpells(data);
  }

  bindSpellPrivileges(data: TypeBindSpellPrivileges): Promise<CharacterSpellStateResponse> {
    return this.characterRepository.bindSpellPrivileges(data);
  }

  useTrait(data: TypeUseTrait): Promise<CharacterStatePatch> {
    return this.characterRepository.useTrait(data);
  }

  deactivateTrait(data: TypeUseTrait): Promise<CharacterStatePatch> {
    return this.characterRepository.deactivateTrait(data);
  }

  restCharacter(data: TypeRestCharacter): Promise<CharacterStatePatch> {
    return this.characterRepository.restCharacter(data);
  }

  spendHitDice(data: TypeSpendHitDice): Promise<CharacterStatePatch> {
    return this.characterRepository.spendHitDice(data);
  }

  applyHp(data: TypeApplyCharacterHp): Promise<CharacterStatePatch> {
    return this.characterRepository.applyHp(data);
  }

  spendSpellSlot(data: TypeSpendSpellSlot): Promise<CharacterStatePatch> {
    return this.characterRepository.spendSpellSlot(data);
  }

  applyCharacterCondition(data: TypeApplyCharacterCondition): Promise<CharacterStatePatch> {
    return this.characterRepository.applyCharacterCondition(data);
  }

  updateCharacterCondition(data: TypeUpdateCharacterCondition): Promise<CharacterStatePatch> {
    return this.characterRepository.updateCharacterCondition(data);
  }

  removeCharacterCondition(data: TypeRemoveCharacterCondition): Promise<CharacterStatePatch> {
    return this.characterRepository.removeCharacterCondition(data);
  }

  getOwnedTraitIds(id: string, userId: string): Promise<string[]> {
    return this.characterRepository.getOwnedTraitIds(id, userId);
  }

  addForm(data: TypeAddCharacterFormPersist): Promise<CharacterStatePatch> {
    return this.characterRepository.addForm(data);
  }

  activateForm(data: TypeSetCharacterFormActive): Promise<CharacterStatePatch> {
    return this.characterRepository.activateForm(data);
  }

  deactivateForm(data: TypeSetCharacterFormActive): Promise<CharacterStatePatch> {
    return this.characterRepository.deactivateForm(data);
  }

  updateCompanions(
    id: string,
    companions: CharacterCompanionInput[],
    userId: string
  ): Promise<UpdateCharacterCompanionsResponse> {
    return this.characterRepository.updateCompanions(id, companions, userId);
  }

  updateFlavor(data: InputUpdateCharacterFlavor): Promise<UpdateCharacterFlavorResponse> {
    return this.characterRepository.updateFlavor(data);
  }
}
