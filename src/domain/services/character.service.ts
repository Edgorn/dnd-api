import ICharacterRepository from "../repositories/ICharacterRepository";
import { CharacterCampaignLink, GetCharacterOptions, LevelUpData, CharacterApi, CharacterBasic, TypeAddEquipment, TypeCreateCharacter, TypeDeleteEquipment, TypeEquipEquipment, TypeToggleFavoriteEquipment, ToggleFavoriteEquipmentResponse, TypeBindWeaponBond, TypeLevelUp, TypeLearnSpells, TypeCopySpells, TypePrepareSpells, TypeBindSpellPrivileges, TypeUseTrait, TypeRestCharacter, TypeSpendHitDice, TypeApplyCharacterHp, TypeSpendSpellSlot, TypeApplyCharacterCondition, TypeUpdateCharacterCondition, TypeRemoveCharacterCondition, TypeAddCharacterFormPersist, TypeSetCharacterFormActive, UpdateCharacterMoneyResponse, UpdateCharacterEquipmentResponse, CharacterCompanionInput, UpdateCharacterCompanionsResponse, InputUpdateCharacterFlavor, UpdateCharacterFlavorResponse } from "../types/character.types";

export default class CharacterService {
  constructor(private readonly characterRepository: ICharacterRepository) { }

  getByUser(id: string): Promise<CharacterBasic[]> {
    return this.characterRepository.getByUser(id);
  }

  create(data: TypeCreateCharacter): Promise<CharacterBasic | null> {
    return this.characterRepository.create(data);
  }

  getById(
    idCharacter: string,
    user: string,
    options?: GetCharacterOptions
  ): Promise<CharacterApi> {
    return this.characterRepository.getById(idCharacter, user, options);
  }

  addEquipment(data: TypeAddEquipment): Promise<UpdateCharacterEquipmentResponse> {
    return this.characterRepository.addEquipment(data);
  }

  deleteEquipment(data: TypeDeleteEquipment): Promise<UpdateCharacterEquipmentResponse> {
    return this.characterRepository.deleteEquipment(data);
  }

  equipEquipment(data: TypeEquipEquipment): Promise<{ full: CharacterApi; basic: CharacterBasic }> {
    return this.characterRepository.equipEquipment(data);
  }

  toggleFavoriteEquipment(data: TypeToggleFavoriteEquipment): Promise<ToggleFavoriteEquipmentResponse> {
    return this.characterRepository.toggleFavoriteEquipment(data);
  }

  updateMoney(id: string, money: { quantity: number; unit: string }[]): Promise<UpdateCharacterMoneyResponse> {
    return this.characterRepository.updateMoney(id, money);
  }

  updateXp(id: string, xp: number, userId: string): Promise<void> {
    return this.characterRepository.updateXp(id, xp, userId);
  }

  getLevelUpData(id: string, classId: string, userId: string): Promise<LevelUpData> {
    return this.characterRepository.getLevelUpData(id, classId, userId);
  }

  levelUp(data: TypeLevelUp): Promise<{ full: CharacterApi, basic: CharacterBasic }> {
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

  bindWeaponBond(data: TypeBindWeaponBond): Promise<{ full: CharacterApi; basic: CharacterBasic }> {
    return this.characterRepository.bindWeaponBond(data);
  }

  learnSpells(data: TypeLearnSpells): Promise<CharacterApi> {
    return this.characterRepository.learnSpells(data);
  }

  copySpells(data: TypeCopySpells): Promise<CharacterApi> {
    return this.characterRepository.copySpells(data);
  }

  prepareSpells(data: TypePrepareSpells): Promise<CharacterApi> {
    return this.characterRepository.prepareSpells(data);
  }

  bindSpellPrivileges(data: TypeBindSpellPrivileges): Promise<CharacterApi> {
    return this.characterRepository.bindSpellPrivileges(data);
  }

  useTrait(data: TypeUseTrait): Promise<CharacterApi> {
    return this.characterRepository.useTrait(data);
  }

  deactivateTrait(data: TypeUseTrait): Promise<CharacterApi> {
    return this.characterRepository.deactivateTrait(data);
  }

  restCharacter(data: TypeRestCharacter): Promise<CharacterApi> {
    return this.characterRepository.restCharacter(data);
  }

  spendHitDice(data: TypeSpendHitDice): Promise<CharacterApi> {
    return this.characterRepository.spendHitDice(data);
  }

  applyHp(data: TypeApplyCharacterHp): Promise<CharacterApi> {
    return this.characterRepository.applyHp(data);
  }

  spendSpellSlot(data: TypeSpendSpellSlot): Promise<CharacterApi> {
    return this.characterRepository.spendSpellSlot(data);
  }

  applyCharacterCondition(data: TypeApplyCharacterCondition): Promise<CharacterApi> {
    return this.characterRepository.applyCharacterCondition(data);
  }

  updateCharacterCondition(data: TypeUpdateCharacterCondition): Promise<CharacterApi> {
    return this.characterRepository.updateCharacterCondition(data);
  }

  removeCharacterCondition(data: TypeRemoveCharacterCondition): Promise<CharacterApi> {
    return this.characterRepository.removeCharacterCondition(data);
  }

  getOwnedTraitIds(id: string, userId: string): Promise<string[]> {
    return this.characterRepository.getOwnedTraitIds(id, userId);
  }

  addForm(data: TypeAddCharacterFormPersist): Promise<CharacterApi> {
    return this.characterRepository.addForm(data);
  }

  activateForm(data: TypeSetCharacterFormActive): Promise<CharacterApi> {
    return this.characterRepository.activateForm(data);
  }

  deactivateForm(data: TypeSetCharacterFormActive): Promise<CharacterApi> {
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
