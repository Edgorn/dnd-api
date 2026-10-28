import ICharacterRepository from '../../../../domain/repositories/ICharacterRepository';
import CharacterModel from '../schemas/Character';
import IUserRepository from '../../../../domain/repositories/IUserRepository';
import ISpellRepository from '../../../../domain/repositories/ISpellRepository';
import { Types } from 'mongoose';
import { CharacterCampaignLink, CharacterSubclassApi, GetCharacterOptions, GetLevelUpDataOptions, LevelUpData, LevelUpDataResult, LevelUpDipData, LevelUpSpellChanges, PendingSkillProficiencyChoice, CharacterApi, CharacterBasic, CharacterGetResult, CharacterListItem, GetCharactersByUserOptions, CharacterMongo, CharacterEquipmentMongo, TypeAddEquipment, TypeCreateCharacter, TypeDeleteEquipment, TypeEquipEquipment, TypeToggleFavoriteEquipment, ToggleFavoriteEquipmentResponse, TypeUpdateEquipmentCustomization, UpdateCharacterEquipmentCustomizationResponse, TypeBindWeaponBond, CharacterEquipmentStateResponse, CharacterLevelUpResponse, CharacterSpellStateResponse, CharacterStatePatch, TypeLearnSpells, TypeCopySpells, TypeLevelUp, TypePrepareSpells, TypeBindSpellPrivileges, TypeUseTrait, TypeRestCharacter, TypeSpendHitDice, TypeApplyCharacterHp, TypeSpendSpellSlot, TypeApplyCharacterCondition, TypeUpdateCharacterCondition, TypeRemoveCharacterCondition, TypeAddCharacterFormPersist, TypeSetCharacterFormActive, UpdateCharacterMoneyResponse, UpdateCharacterXpResponse, UpdateCharacterEquipmentResponse, CharacterSpellPrivilegeMongo, CharacterSpellPrivilegeApi, CharacterCompanionInput, UpdateCharacterCompanionsResponse, InputUpdateCharacterFlavor, UpdateCharacterFlavorResponse, CharacterHitDiceSpent, CharacterSpellSlotSpent, CharacterActiveCondition, CharacterTraitResource, CharacterActiveConditionApi, CharacterHitDiceApi, CharacterSpellSlotApi } from '../../../../domain/types/character.types';
import { CharacterCompanion, CharacterCompanionRoster } from '../../../../domain/types/character.types';
import { CharacterFormApi, CharacterFormMongo, CreatureFormSummary, formPurposeOverlaysCharacter } from '../../../../domain/types/creatureForm.types';
import { formatSize } from '../../../../domain/types/size.types';
import {
  CharacterOptionSelection,
  CharacterOptionSelectionApi,
  GroupOptionApi,
  OptionChoiceMongo,
  PendingOptionChoice
} from '../../../../domain/types/optionGroup.types';
import { PrerequisiteContext } from '../../../../domain/types/prerequisite.types';
import IGroupOptionRepository from '../../../../domain/repositories/IGroupOptionRepository';
import IOptionGroupRepository from '../../../../domain/repositories/IOptionGroupRepository';
import { characterRestRejection, hitDiceSpendAllowed, resolveHitPointRecovery, resolveSpellSlotRecovery } from '../../../../domain/services/restRules';
import { NotFoundError, ConflictError, ValidationError, AppError } from '../../../../domain/errors/AppError';
import { ChoiceApi, Damage } from '../../../../domain/types';
import AttributeService from '../../../../domain/services/attribute.service';
import SkillService from '../../../../domain/services/skill.service';
import { canAccessCharacter } from '../../../../domain/services/characterAccess';
import { CampaignSummary, ICampaignReader } from '../../../../domain/ports/ICampaignReader';
import ICharacterClassRepository from '../../../../domain/repositories/ICharacterClassRepository';
import ISubclassRepository from '../../../../domain/repositories/ISubclassRepository';
import IEquipmentRepository from '../../../../domain/repositories/IEquipmentRepository';
import ITraitRepository from '../../../../domain/repositories/ITraitRepository';
import IProficiencyRepository from '../../../../domain/repositories/IProficiencyRepository';
import ILanguageRepository from "../../../../domain/repositories/ILanguageRepository";
import { SpellApi, SpellRef } from '../../../../domain/types/spell.types';
import { SkillApi } from '../../../../domain/types/skill.types';
import { ConditionApi } from '../../../../domain/types/condition.types';
import { CharacterEquipmentApi, EquipmentInstanceApi, EquipSlot, MountGearSlot } from '../../../../domain/types/equipment.types';
import { findBlockedEquipmentRestriction } from '../../../../utils/equipmentRestriction';
import IRaceRepository from '../../../../domain/repositories/IRaceRepository';
import ICreatureTypeRepository from '../../../../domain/repositories/ICreatureTypeRepository';
import IDamageRepository from '../../../../domain/repositories/IDamageRepository';
import IConditionRepository from '../../../../domain/repositories/IConditionRepository';
import { PendingCatalogChoice, TraitApi, TraitChoiceValue, TraitChoices, TraitDataMongo, SpellPrivilegeRule } from '../../../../domain/types/traits.types';
import { CreatureTypeApi } from '../../../../domain/types/creatureType.types';
import { RaceLevelMongo, RaceRef } from '../../../../domain/types/race.types';
import { applyTraitStacking, closeLevelUpTraitText, damageChoiceSourceIdsToLoad, levelUpTraitIds, mergeClassAndRaceLevelUp, mergeLevelUpTraits, mergedTraitsDataAtLevel, mergeTraitDataMaps, orderTraitsByIds, traitIdsWithChangedData } from '../../../../utils/characterLevelUpTraits';
import {
  buildPendingOptionChoices,
  mapSubclassMenuOptionChoices,
  mergeAbilityScoreOptionPick,
  mergeOptionChoices,
  optionReplacementsToChoices,
  subclassMenuOptionChoiceGroupIds,
  validateLevelUpOptionPicks
} from '../../../../utils/characterOptionChoices';
import {
  characterMeetsAllClassRequirements,
  excludeOwnedChoiceOptions,
  mergeSkillProficiencyChoices,
  resolveLevelSkillPicks,
  shouldEnforceMulticlassRequirements,
  unionUnique,
  validateChoiceListPicks
} from '../../../../utils/characterMulticlass';
import { CharacterClassApi, ClassRulesRef, SpellRepositoryConfig } from '../../../../domain/types/characterClass.types';
import { SpellChoiceApi, SpellChoiceRefApi } from '../../../../domain/types/classLevelChoices.types';
import { resolveTraitActions } from '../../../../utils/resolveTraitActions';
import { displaySummary } from '../../../../utils/traitSummary';
import { buildTraitGrantingClasses } from '../../../../utils/traitProgression';
import {
  grantedExtraSpellIdsByClass,
  mergeExtraSpellIds,
  ritualOnlyExtraSpellIds,
  ritualOnlyGrantedExtraIdsByClass
} from '../../../../utils/traitGrantedSpells';
import { overlaySpellsCreatureForms } from '../../../../utils/creatureFormPool';
import {
  collectClassGrantedTraitIds,
  traitHitPointBonus
} from '../../../../utils/traitHitPoints';
import {
  applyTraitAbilityScores,
  collectTraitAbilityScores,
  withAttributeMax
} from '../../../../utils/applyTraitAbilityScores';
import {
  collectProficientSkillIds,
  collectTraitSkillProficiencies
} from '../../../../utils/applyTraitSkillProficiencies';
import {
  applyLevelSkillProficiencyPicks,
  concatExtraSpellIds,
  getExtraSpellIds,
  overlaysToSkillProficiencies,
  pendingLevelSkillProficiencyChoices
} from '../../../../utils/applyLevelSkillProficiencies';
import { LevelSkillProficiencyChoice } from '../../../../domain/types/classLevelChoices.types';
import { constitutionHitPointDelta } from '../../../../utils/constitutionHpFromAbilityScores';
import {
  applyCatalogTraitChoices,
  applyEnteringTraitChoices,
  applyRestTraitChoices,
  catalogSpeakIds,
  expandCatalogChoices,
  expandDamageChoices,
  hydrateCatalogChoiceLanguages,
  listPendingCatalogChoices,
  listPendingDamageChoices,
  mergeTraitLanguageIds,
  resolveCharacterTraitChoices
} from '../../../../utils/traitDamageChoices';
import { catalogLanguagesById, collectCatalogLanguageIds, hydrateLanguageGrants, languageApiById } from '../../../../utils/hydrateLanguageGrants';
import { applyTraitSpeed } from '../../../../utils/applyTraitSpeed';
import {
  applyArmorStrengthSpeedPenalty,
  collectEquippedArmorSuppression,
  isTraitSuppressedByArmor,
  collectStealthDisadvantageSkillKeys,
  computeArmorClass,
  findBodyArmor,
  isWearingArmorWithoutProficiency
} from '../../../../utils/armorRules';
import {
  applyAbilityScoreIncreases,
  validateLevelUpAbilityScorePick
} from '../../../../utils/characterLevelUpAbilityScore';
import ICreatureRepository from '../../../../domain/repositories/ICreatureRepository';
import { CharacterAttributeApi, AttributeApi } from '../../../../domain/types/attribute.types';
import { evaluateFormula, enrichSkillsWithPassive } from '../../../../utils/formulaEvaluator';
import { characterCarryingCapacity } from '../../../../utils/carryingCapacity';
import {
  applySpellReplacements,
  buildCantripSpellChoice,
  buildSpellReplacementToChoice,
  buildSynthesizedKnownSpellChoice,
  buildSpellcastingLevel,
  castableSpellLevels,
  eligibleSpellReplacementFrom,
  excludeKnownSpellOptions,
  mergeExpandedSpellsIntoChoices,
  getPreparedSpellIds,
  hasCantripSpellChoice,
  prunePreparedSpellIds,
  remainingCantripPicks,
  resolveClassSpellSlotsForLevel,
  resolveSlotProgressionForLevel,
  shouldOfferSpellReplacement,
  validateKnownSpellPicks,
  validateCopiedSpellPicks,
  resolveSpellRepositoryCopyRules,
  validateLevelUpSpellPicks,
  type LevelUpSpellChoicePick,
  validatePreparedSpellPicks,
  validateSpellReplacements,
  validateSpellPrivilegePicks,
  characterHasTrait,
  findSpellPrivilegeInstance,
  getCharacterSpellPrivileges,
  privilegeSpellIdsExcludedFromCap,
  alwaysPreparedSpellIds,
  extraPrivilegeSpellIds,
  mergePreparedWithPrivileges,
  activeSpellPrivilegeRuleIndexes,
  alignPrivilegeSelections,
} from '../../../../utils/characterSpellcasting';
import { enrichEquipmentWithCombatBonuses } from '../../../../utils/combatBonuses';
import {
  applyBindWeaponBond,
  applyDismissWeaponBond,
  applyManifestWeaponBond,
  applySummonWeaponBond,
  applyUnbindWeaponBond,
  clearWeaponBondOnTraitLost,
  ownedWeaponBond,
  weaponBondFormRejection,
  resolveWeaponBondUse
} from '../../../../utils/weaponBond';
import {
  applyGrantUniqueEquipment,
  applyReplaceUniqueEquipment,
  clearUniqueGrantedOnTraitLost,
  hasUniqueGranted,
  ownedUniqueEquipmentGrant
} from '../../../../utils/uniqueEquipmentGrant';
import {
  addToInventory,
  cloneInventory,
  createInventoryInstance,
  removeOrDecrement,
  splitOne,
  tryMerge,
} from '../../../../utils/inventoryStacks';
import { mergeEquipmentFlavor } from '../../../../utils/grantedEquipment';
import { MAX_CHARACTER_COMPANIONS, mergeCompanionsOnReplace, normalizeCompanions } from '../../../../utils/normalizeCompanions';
import { hydrateCompanions } from '../../../../utils/hydrateCompanions';
import { normalizeCharacterDocument } from '../../../../utils/normalizeCharacterDocument';
import { applyEquip, applyMountGear } from '../../../../utils/inventorySlots';
import { applyInventoryHolderState, holderHasContents } from '../../../../utils/inventoryHolders';
import ISystemRepository from '../../../../domain/repositories/ISystemRepository';
import { SubclassApi, SubclassNameRef, SubclassRulesRef } from '../../../../domain/types/subclass.types';
import { SystemRulesConfig } from '../../../../domain/types/system.types';
import { createMergedRulesConfigMemo } from '../../../../utils/mergedRulesConfigMemo';
import { listArmorClassFromRules, storedAcNumber } from '../../../../utils/listArmorClass';
import { TraitArmorClassInput } from '../../../../domain/types/traits.types';
import { ArmorClassEquipmentInput } from '../../../../domain/types/equipment.types';
import ICoinRepository from '../../../../domain/repositories/ICoinRepository';
import { CoinApi } from '../../../../domain/types/coin.types';
import {
  buildCharacterMoneyItems,
  getOrphanUnitIds,
  parseCharacterMoneyQuantities,
} from '../../../../utils/characterMoney';
import {
  DEFAULT_PROFICIENCY_PROGRESSION,
  xpMaxForLevel,
} from '../../../../utils/systemRulesMerge';
import { toCharacterBasic } from '../../../../utils/characterBasicFromApi';
import { SpellcastingLevel, SubclassChoiceMenuApi } from '../../../../domain/types/characterClass.types';
import { aggregateConditionalConditionImmunities, aggregateConditionalResistances } from '../../../../utils/aggregateConditionalResistances';
import { applyActiveTraitOverlays } from '../../../../utils/applyActiveTraitOverlays';
import { toCharacterEquipmentStateDelta } from '../../../../utils/characterEquipmentState';
import { applyActiveFormOverlay } from '../../../../utils/applyActiveFormOverlay';
import { CHARACTER_FORM_OVERLAY_PATCH_KEYS, toCharacterStatePatch, toCombatCharacter, toSheetCharacter, toSheetSpellState } from '../../../../utils/characterViews';
import { ArmorRulesEquipment } from '../../../../utils/armorRules';
import { MAX_CHARACTER_FORMS, normalizeCharacterForms } from '../../../../utils/normalizeCharacterForms';
import { normalizeActiveTraitIds, normalizeTraitResources } from '../../../../utils/traitResources';
import {
  applyHitPointRecovery,
  applyRestHitDiceSpends,
  applySpendHitDice,
  classPoolsFromCharacter,
  normalizeHitDiceSpent,
  toHitDiceApi
} from '../../../../utils/hitDice';
import { applyHpDamage, applyHpHeal } from '../../../../utils/hitPoints';
import {
  applyRecoverClassSpellSlots,
  applySpendSpellSlot,
  applySpellSlotRecovery,
  normalizeSpellSlotsSpent,
  slotPoolsFromSources,
  toSpellSlotsApi
} from '../../../../utils/spellSlots';
import {
  applyCondition,
  applyConditionDelta,
  applyConditionRestRecovery,
  immuneConditionIdsFromTraits,
  normalizeActiveConditions,
  removeCondition
} from '../../../../utils/activeConditions';
import {
  applyCharacterRest,
  applyDeactivateTrait,
  applyUseTraitAction,
  spentForTrait
} from '../../../../utils/traitStanceState';

export const CHARACTER_LIST_SELECT = [
  "_id",
  "img",
  "name",
  "race",
  "user",
  "campaign",
  "classes",
  "subclasses",
  "hpMax",
  "hpCurrent",
  "xp",
  "HPMax",
  "HPActual",
  "XP",
  "ac",
  "CA",
  "attributes",
  "systems",
  "speed",
  "traits",
  "traitsData",
  "traits_data",
  "equipment"
].join(" ");

function choiceEntryName(value: TraitChoiceValue): string | null {
  if (typeof value === "string") return value.length > 0 ? value : null;
  if (value && typeof value.name === "string" && value.name.length > 0) return value.name;
  return null;
}

export default class CharacterRepository implements ICharacterRepository {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly equipmentRepository: IEquipmentRepository,
    private readonly traitRepository: ITraitRepository,
    private readonly proficiencyRepository: IProficiencyRepository,
    private readonly languageRepository: ILanguageRepository,
    private readonly skillService: SkillService,
    private readonly spellRepository: ISpellRepository,
    private readonly characterClassRepository: ICharacterClassRepository,
    private readonly subclassRepository: ISubclassRepository,
    private readonly groupOptionRepository: IGroupOptionRepository,
    private readonly optionGroupRepository: IOptionGroupRepository,
    private readonly raceRepository: IRaceRepository,
    private readonly creatureRepository: ICreatureRepository,
    private readonly attributeService: AttributeService,
    private readonly systemRepository: ISystemRepository,
    private readonly coinRepository: ICoinRepository,
    private readonly campaignReader: ICampaignReader,
    private readonly creatureTypeRepository: ICreatureTypeRepository,
    private readonly damageRepository: IDamageRepository,
    private readonly conditionRepository: IConditionRepository
  ) { }

  async getByUser(id: string, options?: GetCharactersByUserOptions): Promise<CharacterListItem[]> {
    try {
      const personajes = await CharacterModel.find({ user: id })
        .select(CHARACTER_LIST_SELECT)
        .collation({ locale: 'es', strength: 1 })
        .sort({ name: 1 })
        .lean<CharacterMongo[]>();

      const userName = await this.userRepository.getUserName(id);
      const list = await this.formatBasicCharacters(personajes, userName, {
        skipAttributeOverlay: options?.includeCombatSeed !== true
      });
      return list.map(item => this.toCharacterListItem(item, options?.includeCombatSeed === true));
    } catch (error) {
      console.error("Error obteniendo personajes:", error);
      throw new Error("No se pudieron obtener los personajes");
    }
  }

  async create(data: TypeCreateCharacter) {
    const {
      name,
      user,
      background,
      img,
      speed,
      size,
      appearance,
      attributes,
      systems,
      race,
      raceId,
      campaign,
      languages,
      spells,
      skills,
      classId,
      className,
      savingThrows,
      proficiencies,
      subclass,
      equipment,
      traits,
      traitsData,
      money,
      hitDie,
      proficiencyBonus,
      skillProficiencyPicks
    } = data

    const dataBackground = {
      ...background,
      history: background?.history?.split(/\r?\n/) ?? []
    }

    const rulesConfig = await this.systemRepository.getMergedRulesConfig(systems ?? []);
    const resolvedProfBonus = rulesConfig.proficiencyProgression?.[0] ?? proficiencyBonus ?? 0;

    let moneyArray: { quantity: number; unit: string }[] = [];
    if (Array.isArray(money)) {
      moneyArray = money;
    } else if (money && typeof money === 'object' && 'unit' in money) {
      moneyArray = [money as any];
    }

    let resolvedTraits = [...(traits ?? [])];
    let resolvedTraitsData = { ...(traitsData ?? {}) };
    let resolvedSubclasses: string[] = [];
    const characterClass = await this.characterClassRepository.getById(classId);
    let subclassForTraits: Awaited<ReturnType<typeof this.assertSubclassAvailable>> | undefined;

    if (subclass) {
      subclassForTraits = await this.assertSubclassAvailable(subclass, classId, systems ?? []);
      resolvedSubclasses = [subclassForTraits.id];
      if (characterClass?.subclassChoice?.level === 1) {
        const level1 = subclassForTraits.levels.find(row => row.level === 1);
        if (level1) {
          const merged = mergeLevelUpTraits(
            resolvedTraits,
            resolvedTraitsData,
            level1.traits,
            level1.traits_data
          );
          resolvedTraits = merged.traits;
          resolvedTraitsData = merged.traits_data;
        }
      }
    }

    const catalogTraits = await this.traitRepository.getTraitsByIndexes(resolvedTraits);
    const loadedTraits = await this.expandTraitsForSystems(
      catalogTraits,
      systems,
      this.chosenCreatureTypeIds(catalogTraits, data.traitChoices),
      this.chosenDamageTypeIds(catalogTraits, data.traitChoices)
    );
    const overlaidAttributes = applyTraitAbilityScores(attributes, loadedTraits).attributes;
    const apiAttributesForHp = await this.attributeService.formatAttributes(
      overlaidAttributes,
      systems ?? []
    );

    let HP: number;
    if (rulesConfig.hpInitialFormula) {
      HP = Math.floor(evaluateFormula(
        rulesConfig.hpInitialFormula,
        apiAttributesForHp,
        undefined,
        { classVariables: { hitDie: hitDie ?? 1 } }
      ));
    } else {
      HP = hitDie ?? 1;
      const conVal = overlaidAttributes.find(a => a.key === 'con')?.value ?? 10;
      HP += Math.floor((conVal / 2) - 5);
    }

    const classGrantedTraitIds = collectClassGrantedTraitIds(
      characterClass?.levels ?? [],
      subclassForTraits?.levels ?? [],
      1
    );
    HP += traitHitPointBonus({
      traits: loadedTraits,
      classGrantedTraitIds,
      classLevel: 1,
      characterLevel: 1,
      previouslyOwnedIds: []
    });
    const grantedTraits = catalogTraits.filter(trait => trait.id && classGrantedTraitIds.has(trait.id));
    const catalogChoices = await this.applyGrantedCatalogChoices({
      existing: undefined,
      incoming: data.traitChoices,
      classLevel: 1,
      systems,
      grantedTraits
    });
    const proficientIds = collectProficientSkillIds(skills, grantedTraits);
    const overlayResult = applyLevelSkillProficiencyPicks({
      grants: this.levelSkillProficiencyGrants(characterClass, subclassForTraits, 1),
      proficientIds,
      picks: skillProficiencyPicks
    });
    if ("error" in overlayResult) {
      throw new ValidationError(overlayResult.error);
    }
    const choiceResult = applyEnteringTraitChoices({
      existing: catalogChoices,
      incoming: data.traitChoices,
      enteringTraits: loadedTraits
    });
    if ("error" in choiceResult) {
      throw new ValidationError(choiceResult.error);
    }

    const personaje = new CharacterModel({
      name,
      user,
      img,
      background: dataBackground,
      appearance,
      attributes,
      systems,
      raceId: raceId,
      campaign,
      classes: [{ class: classId, name: className ?? "Ninguna", level: 1, hitDie }],
      subclasses: resolvedSubclasses,
      race: race,
      traits: resolvedTraits,
      traitsData: resolvedTraitsData,
      traitChoices: choiceResult.traitChoices,
      ...(overlayResult.overlays.length ? { skillProficiencyOverlays: overlayResult.overlays } : {}),
      proficiencyBonus: resolvedProfBonus,
      speed,
      size,
      languages: languages,
      savingThrows: savingThrows ?? [],
      skills: [...skills ?? []],
      proficiencies,
      spells,
      equipment: await this.ensureUniqueEquipmentGranted(this.toInventoryRows(equipment), loadedTraits),
      money: moneyArray,
      hpMax: HP,
      hpCurrent: HP,
      xp: 0,
      companions: normalizeCompanions(data.companions),
      traitResources: [],
      activeTraitIds: [],
      forms: [],
      activeFormId: null
    })

    const resultado = await personaje.save()

    if (resultado) {
      await this.refreshStoredAc(resultado)
      return await this.formatBasicCharacter(resultado, { skipAttributeOverlay: true })
    } else {
      return null
    }
  }

  async getById(
    idCharacter: string,
    user: string,
    options?: GetCharacterOptions
  ): Promise<CharacterGetResult> {
    const { personaje, campaign } = await this.loadAccessibleCharacter(idCharacter, user);
    const sheet = await this.formatCharacter(personaje, options, campaign);
    if (options?.view === "combat") return toCombatCharacter(sheet);
    if (options?.view === "sheet") return toSheetCharacter(sheet);
    return sheet;
  }

  async getByIdForExport(
    idCharacter: string,
    user: string,
    options?: GetCharacterOptions
  ): Promise<{ character: CharacterApi; ownerId: string }> {
    const { personaje, campaign } = await this.loadAccessibleCharacter(idCharacter, user);
    return {
      character: await this.formatCharacter(personaje, { ...options, view: "full" }, campaign),
      ownerId: personaje.user
    };
  }

  async addEquipment(data: TypeAddEquipment): Promise<UpdateCharacterEquipmentResponse> {
    const { id, equipmentId, quantity, isMagic, hpCurrent } = data;
    const personaje = await CharacterModel.findById(id);

    if (!personaje) {
      throw new NotFoundError("Personaje no encontrado");
    }

    const equipment = addToInventory(
      this.toInventoryRows(personaje.equipment),
      createInventoryInstance({
        equipmentId,
        quantity,
        isMagic,
        ...(hpCurrent !== undefined ? { hpCurrent } : {}),
      })
    );

    return this.saveInventory(id, equipment);
  }

  async deleteEquipment(data: TypeDeleteEquipment): Promise<UpdateCharacterEquipmentResponse> {
    const { id, instanceId, quantity } = data;
    const personaje = await CharacterModel.findById(id);

    if (!personaje) {
      throw new NotFoundError("Personaje no encontrado");
    }

    const inventory = this.toInventoryRows(personaje.equipment);
    const item = this.requireInventoryInstance(inventory, instanceId);

    if (item.isBond) {
      throw new ConflictError("No se puede eliminar un arma vinculada");
    }

    if (item.isFavorite || item.equipped) {
      throw new ConflictError(
        "No se puede eliminar un equipamiento favorito o equipado"
      );
    }

    if (holderHasContents(inventory, instanceId)) {
      throw new ConflictError(
        "El contenedor o vehículo contiene equipo; muévalo antes de eliminarlo"
      );
    }

    return this.saveInventory(id, removeOrDecrement(inventory, instanceId, quantity));
  }

  async replaceInventory(
    id: string,
    userId: string,
    inventory: CharacterEquipmentMongo[]
  ): Promise<UpdateCharacterEquipmentResponse> {
    await this.requireAccessibleCharacter(id, userId);
    return this.saveInventory(id, inventory);
  }

  async equipEquipment(data: TypeEquipEquipment): Promise<CharacterEquipmentStateResponse> {
    const { id, instanceId, equipped } = data;
    const personaje = await CharacterModel.findById(id);
    if (!personaje) {
      throw new NotFoundError("Personaje no encontrado");
    }

    let inventory = this.toInventoryRows(personaje.equipment);
    const target = this.requireInventoryInstance(inventory, instanceId);

    if (equipped) {
      const formatted = await this.equipmentRepository.getCharacterEquipmentsByIds(
        this.toHydrationRows(inventory)
      ) ?? [];
      const slotOf = this.slotLookupFrom(formatted);
      const mountSlotOf = this.mountGearLookupFrom(formatted);
      const { inventory: next, instance } = splitOne(inventory, instanceId);
      const catalogItem = formatted.find(item => item.instanceId === instanceId)
        ?? formatted.find(item => item.id === target.equipmentId);
      const traits = await this.traitRepository.getTraitsByIndexes(
        personaje.traits ?? [],
        personaje.traitsData
      );
      const blocked = catalogItem
        ? findBlockedEquipmentRestriction(catalogItem, traits)
        : undefined;
      if (blocked) {
        throw new ConflictError(
          "Un rasgo del personaje impide equipar armadura o escudo de este material"
        );
      }

      const companions = normalizeCompanions(personaje.companions);
      const holderCompanion = target.holderId
        ? companions.find(companion => companion.id === target.holderId)
        : undefined;

      if (target.holderId && !holderCompanion) {
        throw new ConflictError("No se puede equipar un objeto que está en un contenedor o vehículo");
      }

      if (holderCompanion) {
        if (holderCompanion.kind !== "mount" || !catalogItem?.mountGear) {
          throw new ValidationError("El arreo o la barda solo se equipan en una montura");
        }
        inventory = this.applyMountGearOrThrow(next, instance.instanceId, true, mountSlotOf);
      } else {
        inventory = this.applyEquipOrThrow(next, instance.instanceId, true, slotOf);
      }
    } else {
      inventory = applyEquip(inventory, instanceId, false, () => null);
    }

    return this.saveInventoryAndFormatEquipmentState(id, inventory);
  }

  async toggleFavoriteEquipment(data: TypeToggleFavoriteEquipment): Promise<ToggleFavoriteEquipmentResponse> {
    const { id, instanceId, isFavorite } = data;
    const personaje = await CharacterModel.findById(id);

    if (!personaje) {
      throw new NotFoundError("Personaje no encontrado");
    }

    let inventory = this.toInventoryRows(personaje.equipment);
    this.requireInventoryInstance(inventory, instanceId);

    let targetInstanceId = instanceId;
    let splitFrom: ToggleFavoriteEquipmentResponse["splitFrom"];
    if (isFavorite) {
      const split = splitOne(inventory, instanceId);
      inventory = split.inventory;
      targetInstanceId = split.instance.instanceId;
      if (targetInstanceId !== instanceId) {
        const source = inventory.find(item => item.instanceId === instanceId);
        if (source) {
          splitFrom = { instanceId, quantity: source.quantity };
        }
      }
    }

    const idx = inventory.findIndex(eq => eq.instanceId === targetInstanceId);
    inventory[idx] = { ...inventory[idx], isFavorite };

    const resultado = await CharacterModel.findByIdAndUpdate(
      id,
      { $set: { equipment: inventory } },
      { returnDocument: "after" }
    );

    if (!resultado) {
      throw new NotFoundError("Personaje no encontrado");
    }

    return {
      id,
      instanceId: targetInstanceId,
      isFavorite,
      ...(splitFrom ? { splitFrom } : {}),
    };
  }

  async updateEquipmentCustomization(
    data: TypeUpdateEquipmentCustomization
  ): Promise<UpdateCharacterEquipmentCustomizationResponse> {
    const { id, instanceId, name, description } = data;
    const personaje = await CharacterModel.findById(id);

    if (!personaje) {
      throw new NotFoundError("Personaje no encontrado");
    }

    let inventory = this.toInventoryRows(personaje.equipment);
    this.requireInventoryInstance(inventory, instanceId);

    const split = splitOne(inventory, instanceId);
    inventory = split.inventory;
    const targetInstanceId = split.instance.instanceId;
    let splitFrom: UpdateCharacterEquipmentCustomizationResponse["splitFrom"];
    if (targetInstanceId !== instanceId) {
      const source = inventory.find(item => item.instanceId === instanceId);
      if (source) {
        splitFrom = { instanceId, quantity: source.quantity };
      }
    }

    const idx = inventory.findIndex(eq => eq.instanceId === targetInstanceId);
    const customization = mergeEquipmentFlavor(inventory[idx].customization, { name, description });
    const nextRow = { ...inventory[idx] };
    if (customization) {
      nextRow.customization = customization;
    } else {
      delete nextRow.customization;
    }
    inventory[idx] = nextRow;

    const saved = await this.saveInventory(id, inventory);
    return {
      ...saved,
      instanceId: targetInstanceId,
      ...(splitFrom ? { splitFrom } : {}),
    };
  }

  async updateMoney(id: string, money: { quantity: number; unit: string }[]): Promise<UpdateCharacterMoneyResponse> {
    const moneyArray = Array.isArray(money)
      ? money
      : (money && typeof money === "object" && "unit" in money ? [money] : []);

    const resultado = await CharacterModel.findByIdAndUpdate(
      id,
      {
        $set: {
          money: moneyArray,
        },
      },
      { returnDocument: "after" }
    );

    if (!resultado) {
      throw new NotFoundError("Personaje no encontrado");
    }

    const formattedMoney = await this.normalizeAndFormatMoney(resultado);

    return { money: formattedMoney };
  }

  async updateXp(id: string, xp: number, userId: string): Promise<UpdateCharacterXpResponse> {
    const personaje = await CharacterModel.findById(id);

    if (!personaje) {
      throw new NotFoundError("Personaje no encontrado");
    }

    await this.assertCanAccessCharacter(personaje, userId);

    const level = personaje.classes?.map(clas => clas.level).reduce((sum, value) => sum + value, 0) ?? 0;
    const [, rulesConfig] = await Promise.all([
      CharacterModel.findByIdAndUpdate(id, { $set: { xp } }),
      this.systemRepository.getMergedRulesConfig(personaje.systems ?? []),
    ]);

    return {
      xp,
      xpMax: xpMaxForLevel(level, rulesConfig.xpProgression),
    };
  }

  async updateCompanions(
    id: string,
    companions: CharacterCompanionInput[],
    userId: string
  ): Promise<UpdateCharacterCompanionsResponse> {
    const personaje = await CharacterModel.findById(id);

    if (!personaje) {
      throw new NotFoundError("Personaje no encontrado");
    }

    await this.assertCanAccessCharacter(personaje, userId);

    const normalized = mergeCompanionsOnReplace(companions, normalizeCompanions(personaje.companions));
    await CharacterModel.findByIdAndUpdate(id, { $set: { companions: normalized } });

    return { companions: normalized };
  }

  async getCompanionRoster(id: string, userId: string): Promise<CharacterCompanionRoster> {
    const personaje = await this.requireAccessibleCharacter(id, userId);
    return {
      companions: normalizeCompanions(personaje.companions),
      systems: personaje.systems ?? [],
      inventory: this.toInventoryRows(personaje.equipment),
    };
  }

  async addCompanion(
    id: string,
    userId: string,
    companion: CharacterCompanionInput
  ): Promise<UpdateCharacterCompanionsResponse> {
    const roster = await this.getCompanionRoster(id, userId);
    if (roster.companions.length >= MAX_CHARACTER_COMPANIONS) {
      throw new ConflictError("No se pueden registrar más de 20 compañeros");
    }
    return this.persistCompanions(id, [...roster.companions, companion]);
  }

  async updateCompanion(
    id: string,
    userId: string,
    companionId: string,
    patch: Partial<CharacterCompanion>
  ): Promise<UpdateCharacterCompanionsResponse> {
    const roster = await this.getCompanionRoster(id, userId);
    const index = roster.companions.findIndex(item => item.id === companionId);
    if (index < 0) {
      throw new NotFoundError("Compañero no encontrado");
    }
    const next = roster.companions.map((item, i) => i === index ? { ...item, ...patch, id: item.id } : item);
    return this.persistCompanions(id, next);
  }

  async removeCompanion(
    id: string,
    userId: string,
    companionId: string
  ): Promise<UpdateCharacterCompanionsResponse> {
    const roster = await this.getCompanionRoster(id, userId);
    if (!roster.companions.some(item => item.id === companionId)) {
      throw new NotFoundError("Compañero no encontrado");
    }
    return this.persistCompanions(id, roster.companions.filter(item => item.id !== companionId));
  }

  async saveCompanions(
    id: string,
    userId: string,
    companions: CharacterCompanion[]
  ): Promise<UpdateCharacterCompanionsResponse> {
    await this.requireAccessibleCharacter(id, userId);
    return this.persistCompanions(id, companions);
  }

  private async persistCompanions(
    id: string,
    companions: CharacterCompanionInput[]
  ): Promise<UpdateCharacterCompanionsResponse> {
    const normalized = normalizeCompanions(companions);
    await CharacterModel.findByIdAndUpdate(id, { $set: { companions: normalized } });
    return { companions: normalized };
  }

  async updateFlavor(data: InputUpdateCharacterFlavor): Promise<UpdateCharacterFlavorResponse> {
    const { id, userId, img, appearance, background } = data;
    const personaje = await CharacterModel.findById(id);

    if (!personaje) {
      throw new NotFoundError("Personaje no encontrado");
    }

    await this.assertCanAccessCharacter(personaje, userId);

    const $set: Record<string, unknown> = {};
    if (img !== undefined) {
      $set.img = img;
    }
    if (appearance) {
      for (const key of ["age", "height", "weight", "eyes", "hair", "skin"] as const) {
        if (appearance[key] !== undefined) {
          $set[`appearance.${key}`] = appearance[key];
        }
      }
    }
    if (background) {
      if (background.history !== undefined) {
        $set["background.history"] = this.normalizeFlavorHistory(background.history);
      }
      if (background.alignment !== undefined) $set["background.alignment"] = background.alignment;
      if (background.personality !== undefined) $set["background.personality"] = background.personality;
      if (background.ideals !== undefined) $set["background.ideals"] = background.ideals;
      if (background.bonds !== undefined) $set["background.bonds"] = background.bonds;
      if (background.flaws !== undefined) $set["background.flaws"] = background.flaws;
      if (background.god !== undefined) $set["background.god"] = background.god;
    }

    await CharacterModel.findByIdAndUpdate(id, { $set });

    const { history: incomingHistory, ...backgroundRest } = background ?? {};
    const nextHistory = incomingHistory !== undefined
      ? this.normalizeFlavorHistory(incomingHistory)
      : (personaje.background?.history ?? []);
    const mergedAppearance = {
      ...(personaje.appearance ?? {}),
      ...(appearance ?? {}),
    };
    const mergedBackground = {
      ...(personaje.background ?? {}),
      ...backgroundRest,
      history: nextHistory,
    };

    return {
      img: img !== undefined ? img : (personaje.img ?? ""),
      appearance: {
        age: mergedAppearance.age ?? 0,
        height: mergedAppearance.height ?? 0,
        weight: mergedAppearance.weight ?? 0,
        eyes: mergedAppearance.eyes ?? "",
        hair: mergedAppearance.hair ?? "",
        skin: mergedAppearance.skin ?? "",
      },
      background: {
        name: mergedBackground.name ?? "",
        type: mergedBackground.type ?? { name: "", values: [] },
        history: mergedBackground.history ?? [],
        alignment: mergedBackground.alignment ?? "",
        personality: mergedBackground.personality ?? [],
        ideals: mergedBackground.ideals ?? [],
        bonds: mergedBackground.bonds ?? [],
        flaws: mergedBackground.flaws ?? [],
        god: mergedBackground.god ?? "",
      },
    };
  }

  private normalizeFlavorHistory(history: string | string[]): string[] {
    return Array.isArray(history) ? history : history.split(/\r?\n/);
  }

  async getLevelUpData(id: string, classId: string, userId: string, options?: GetLevelUpDataOptions): Promise<LevelUpDataResult> {
    const { personaje } = await this.loadAccessibleCharacter(id, userId);

    const { catalog, currentEntry, isNewClass } = await this.resolveLevelUpTargetClass(personaje, classId);
    const nextLevel = (currentEntry?.level ?? 0) + 1;
    const totalLevels = personaje.classes?.reduce((acc, clas) => acc + clas.level, 0) ?? 0;
    const rulesConfig = await this.systemRepository.getMergedRulesConfig(personaje.systems ?? []);
    const compact = options?.view === "compact";
    const classLevel = await this.resolveLevelUpClassData(personaje, classId, nextLevel, undefined, catalog, compact);
    const raceRows = personaje.raceId
      ? await this.raceRepository.getLevelUpDataByLevels(personaje.raceId, [totalLevels + 1, totalLevels])
      : undefined;
    const raceMerged = await this.withRaceLevel(
      personaje,
      classLevel.traits,
      classLevel.traits_data,
      totalLevels + 1,
      raceRows
    );
    const ownedTraits = await this.traitRepository.getTraitsByIndexes(personaje.traits ?? []);
    const stacked = applyTraitStacking(ownedTraits, raceMerged.traits);
    const prof_bonus = rulesConfig.proficiencyProgression?.[totalLevels]
      ?? DEFAULT_PROFICIENCY_PROGRESSION[totalLevels]
      ?? 0;
    const traits = await this.translateLevelUpTraits(
      personaje,
      stacked.granted,
      mergeTraitDataMaps(personaje.traitsData, raceMerged.traits_data),
      totalLevels + 1,
      prof_bonus,
      await this.catalogChangedTraitIds(classId, nextLevel, personaje.subclasses ?? [], catalog),
      raceRows,
      rulesConfig
    );
    const traits_data = raceMerged.traits_data;
    const { spell_choices, spell_changes, subclassChoice, ability_score, abilityScoreAlternativeGroupId, skill_choices: levelSkillChoices } = classLevel;
    const assignedSubclasses = await this.getAssignedSubclassesForClass(personaje.subclasses ?? [], classId);
    const optionChoiceConfigs = this.mergeLevelOptionChoiceConfigs(
      classLevel.optionChoices,
      catalog.optionReplacements,
      assignedSubclasses,
      personaje.optionSelections ?? [],
      classId
    );
    const skill_choices = excludeOwnedChoiceOptions(levelSkillChoices, personaje.skills ?? []);
    const catalogChoices = await this.pendingClassCatalogChoices(
      personaje,
      classId,
      nextLevel,
      traits
    );
    const grantedIds = new Set(
      stacked.granted.map(trait => trait.id).filter((id): id is string => Boolean(id))
    );
    const damageChoices = listPendingDamageChoices({
      existing: personaje.traitChoices,
      traits: traits.filter(trait => trait.id && grantedIds.has(trait.id))
    });
    const skillProficiencyChoices = await this.pendingClassSkillProficiencyChoices(
      personaje,
      classLevel.skillProficiencyChoices,
      [...(personaje.skills ?? []), ...(skill_choices?.options.map(item => item.id) ?? [])]
    );
    const requirementsMet = await this.levelUpRequirementsMet(personaje, catalog, isNewClass);
    const menuGroupIds = subclassMenuOptionChoiceGroupIds(subclassChoice?.options ?? []);
    const optionGroupIds = [
      ...new Set([
        ...optionChoiceConfigs.map(config => config.groupId),
        ...menuGroupIds,
        ...(abilityScoreAlternativeGroupId ? [abilityScoreAlternativeGroupId] : [])
      ])
    ];
    const optionCatalog = await this.loadOptionChoiceCatalog(
      personaje.systems ?? [],
      optionGroupIds
    );
    const extraTraitIds = stacked.granted
      .map(trait => trait.id)
      .filter((id): id is string => Boolean(id));
    const optionContext = this.prerequisiteContext(
      personaje,
      classId,
      nextLevel,
      totalLevels + 1,
      extraTraitIds
    );
    const optionChoices = this.pendingLevelOptionChoices(
      personaje,
      optionChoiceConfigs,
      optionCatalog,
      optionContext
    );
    const abilityScoreAlternative = abilityScoreAlternativeGroupId
      ? this.pendingLevelOptionChoices(
        personaje,
        [{ groupId: abilityScoreAlternativeGroupId, choose: 1 }],
        optionCatalog,
        optionContext
      )[0]
      : undefined;
    const hydratedSubclassChoice = subclassChoice
      ? {
          ...subclassChoice,
          options: mapSubclassMenuOptionChoices(subclassChoice.options as Array<{ levels: Array<{ optionChoices?: OptionChoiceMongo[] }> }>, configs =>
            this.pendingLevelOptionChoices(personaje, configs, optionCatalog, optionContext)
          ) as typeof subclassChoice.options
        }
      : null;

    return {
      class: classId,
      hitDie: this.levelUpHitDie(catalog, currentEntry, isNewClass),
      proficiencyBonus: prof_bonus,
      spellChoices: spell_choices as LevelUpData["spellChoices"],
      ...(spell_changes ? { spellChanges: spell_changes } : {}),
      traits,
      traitsData: traits_data,
      subclassChoice: hydratedSubclassChoice,
      abilityScore: ability_score,
      ...(abilityScoreAlternative ? { abilityScoreAlternative } : {}),
      catalogChoices,
      ...(damageChoices.length ? { damageChoices } : {}),
      ...(skillProficiencyChoices.length ? { skillProficiencyChoices } : {}),
      ...(skill_choices ? { skillChoices: skill_choices } : {}),
      newClass: isNewClass,
      ...(requirementsMet !== undefined ? { requirementsMet } : {}),
      ...(isNewClass ? { dip: this.buildLevelUpDip(personaje, catalog, requirementsMet ?? true, compact) } : {}),
      ...(optionChoices.length ? { optionChoices } : {}),
    };
  }

  async levelUp(data: TypeLevelUp): Promise<CharacterLevelUpResponse> {
    const { id, classId, hpIncrease, userId, spells, subclass, abilityScore, abilityScoreOption, traitChoices, skillPicks, skillProficiencyPicks, proficiencyPicks, spellReplacements, optionPicks } = data;
    const personaje = await CharacterModel.findById(id);

    if (!personaje) {
      throw new NotFoundError("Personaje no encontrado");
    }

    await this.assertCanAccessCharacter(personaje, userId);

    const { catalog, currentEntry, isNewClass } = await this.resolveLevelUpTargetClass(personaje, classId);
    const hitDie = this.levelUpHitDie(catalog, currentEntry, isNewClass);
    if (hpIncrease > hitDie) {
      throw new ValidationError(
        `El incremento de PG (${hpIncrease}) no puede superar el dado de golpe de la clase (${hitDie})`
      );
    }

    const rulesConfig = await this.systemRepository.getMergedRulesConfig(personaje.systems ?? []);

    if (!rulesConfig.hpLevelUpFormula) {
      throw new ValidationError(
        "El sistema del personaje no define hpLevelUpFormula; no se puede calcular el incremento de PG"
      );
    }

    const totalLevels = personaje.classes?.reduce((acc, clas) => acc + clas.level, 0) ?? 0;
    if (rulesConfig.maxLevel !== undefined && totalLevels >= rulesConfig.maxLevel) {
      throw new ValidationError(
        `El personaje ya ha alcanzado el nivel máximo del sistema (${rulesConfig.maxLevel})`
      );
    }

    const requirementsMet = await this.levelUpRequirementsMet(personaje, catalog, isNewClass);
    if (requirementsMet === false) {
      throw new ValidationError("El personaje no cumple los requisitos de multiclase");
    }

    if (!isNewClass && proficiencyPicks && proficiencyPicks.length > 0) {
      throw new ValidationError("Las elecciones de competencia de multiclase solo aplican al tomar una clase nueva");
    }

    let nextSkills = [...(personaje.skills ?? [])];
    let nextProficiencies = [...(personaje.proficiencies ?? [])];
    if (isNewClass) {
      const dipPicks = this.validateDipPicks(personaje, catalog, proficiencyPicks);
      if ("error" in dipPicks) {
        throw new ValidationError(dipPicks.error);
      }
      nextProficiencies = unionUnique(nextProficiencies, [
        ...(catalog.multiclass?.proficiencies ?? []).map(item => item.id),
        ...dipPicks.proficiencyIds
      ]);
    }

    const nextLevel = (currentEntry?.level ?? 0) + 1;
    const nextSubclassIds = await this.resolveLevelUpSubclassIds(
      personaje,
      classId,
      nextLevel,
      subclass
    );
    const knownSpellIds = this.getClassSpellIds(personaje, classId);
    const ownedSpellIds = [...knownSpellIds, ...getExtraSpellIds(personaje.extraSpells, classId)];
    const classLevel = await this.resolveLevelUpClassData(personaje, classId, nextLevel, nextSubclassIds, catalog);
    const skillPickResult = resolveLevelSkillPicks({
      dipChoice: isNewClass ? catalog.multiclass?.skill_choices : undefined,
      levelChoice: classLevel.skill_choices,
      ownedIds: personaje.skills ?? [],
      picks: skillPicks
    });
    if ("error" in skillPickResult) {
      throw new ValidationError(skillPickResult.error);
    }
    nextSkills = unionUnique(nextSkills, skillPickResult.ids);
    const mergedLevel = await this.withRaceLevel(
      personaje,
      classLevel.traits,
      classLevel.traits_data,
      totalLevels + 1
    );
    const { spell_choices, ability_score, abilityScoreAlternativeGroupId } = classLevel;
    const levelTraits = mergedLevel.traits;
    const levelTraitsData = mergedLevel.traits_data;
    const pickResult = validateLevelUpSpellPicks(spell_choices as LevelUpSpellChoicePick[], spells, ownedSpellIds);
    if ("error" in pickResult) {
      throw new ValidationError(pickResult.error);
    }

    if (pickResult.spellIds.length > 0) {
      await this.assertCanLearnClassCantrips(personaje, classId, pickResult.spellIds);
    }

    const replacementMenu = classLevel.spell_changes;
    const knownSpellsForReplacement = knownSpellIds.length
      ? await this.spellRepository.getSpellsByIndexes(knownSpellIds)
      : [];
    const knownReplacementInputs = knownSpellsForReplacement
      .filter((spell): spell is SpellApi & { id: string } => Boolean(spell.id))
      .map(spell => ({ id: spell.id, level: spell.level }));
    const toOptions = replacementMenu?.to.options ?? [];
    const replacementResult = validateSpellReplacements({
      offered: Boolean(replacementMenu),
      count: replacementMenu?.choose ?? 0,
      includeCantrips: Boolean(catalog.spellReplacement?.includeCantrips),
      replacements: spellReplacements,
      known: knownReplacementInputs,
      learnedIds: pickResult.spellIds,
      toOptionIds: toOptions.map(opt => opt.id).filter((id): id is string => Boolean(id)),
      toSpells: toOptions
        .filter((spell): spell is SpellApi & { id: string } => Boolean(spell.id))
        .map(spell => ({ id: spell.id, level: spell.level })),
    });
    if ("error" in replacementResult) {
      throw new ValidationError(replacementResult.error);
    }

    const nextSpellIds = applySpellReplacements(
      knownSpellIds,
      replacementResult.replacements,
      pickResult.spellIds
    );
    const extraSpellIds = pickResult.extraSpellIds ?? [];
    const extraSpellsUpdate = extraSpellIds.length
      ? concatExtraSpellIds(personaje.extraSpells, classId, extraSpellIds)
      : undefined;
    const spellsChanged = replacementResult.replacements.length > 0 || pickResult.spellIds.length > 0;
    const spellsUpdate = spellsChanged
      ? this.setClassSpellIds(personaje, classId, nextSpellIds)
      : undefined;
    const removedKnownIds = replacementResult.replacements.map(pick => pick.from);
    const currentPrepared = getPreparedSpellIds(personaje.preparedSpells, classId);
    const nextPrepared = prunePreparedSpellIds(currentPrepared, removedKnownIds);
    const preparedChanged = removedKnownIds.some(id => currentPrepared.includes(id));
    const preparedSpellsUpdate = preparedChanged
      ? {
          ...(personaje.preparedSpells && typeof personaje.preparedSpells === "object"
            ? personaje.preparedSpells
            : {}),
          [classId]: nextPrepared,
        }
      : undefined;
    const previouslyOwnedTraitIds = personaje.traits ?? [];
    const ownedTraits = await this.traitRepository.getTraitsByIndexes(previouslyOwnedTraitIds);
    const ownedAbilityScores = collectTraitAbilityScores(ownedTraits);
    const asiResult = validateLevelUpAbilityScorePick({
      abilityScoreGranted: ability_score,
      alternativeOffered: Boolean(abilityScoreAlternativeGroupId),
      increases: abilityScore?.increases,
      optionId: abilityScoreOption,
      attributes: personaje.attributes ?? [],
      maxAttributeValue: rulesConfig.defaultMaxAttributeValue,
      bonusByKey: ownedAbilityScores.bonusByKey,
      maxByKey: ownedAbilityScores.maxByKey
    });
    if ("error" in asiResult) {
      throw new ValidationError(asiResult.error);
    }

    const nextAttributes = asiResult.kind === "increases"
      ? applyAbilityScoreIncreases(personaje.attributes ?? [], asiResult.increases)
      : undefined;
    const storedAfterAsi = nextAttributes ?? personaje.attributes ?? [];

    let { traits: nextTraits, traits_data: nextTraitsData, granted: stackingGranted } = mergeLevelUpTraits(
      previouslyOwnedTraitIds,
      personaje.traitsData,
      levelTraits,
      levelTraitsData,
      ownedTraits
    );
    const optionAssignedSubclasses = await this.getAssignedSubclassesForClass(nextSubclassIds, classId);
    let optionConfigs = this.mergeLevelOptionChoiceConfigs(
      classLevel.optionChoices,
      catalog.optionReplacements,
      optionAssignedSubclasses,
      personaje.optionSelections ?? [],
      classId
    );
    let optionPicksToApply = optionPicks;
    if (asiResult.kind === "option" && abilityScoreAlternativeGroupId) {
      const merged = mergeAbilityScoreOptionPick(
        optionConfigs,
        optionPicks,
        abilityScoreAlternativeGroupId,
        asiResult.optionId
      );
      optionConfigs = merged.configs;
      optionPicksToApply = merged.picks;
    }
    const optionPickResult = await this.applyLevelUpOptionPicks({
      personaje,
      classId,
      nextLevel,
      characterLevel: totalLevels + 1,
      extraTraitIds: nextTraits,
      configs: optionConfigs,
      picks: optionPicksToApply
    });
    if ("error" in optionPickResult) {
      throw new ValidationError(optionPickResult.error);
    }
    nextTraits = unionUnique(nextTraits, optionPickResult.addedTraitIds)
      .filter(traitId => !optionPickResult.removedTraitIds.includes(traitId));
    const optionGrantedTraits = optionPickResult.addedTraitIds.length
      ? await this.traitRepository.getTraitsByIndexes(optionPickResult.addedTraitIds)
      : [];
    stackingGranted = [...stackingGranted, ...optionGrantedTraits];
    const levelUpClassDoc = await this.characterClassRepository.getById(classId);
    const levelUpSubclasses = optionAssignedSubclasses;
    const levelUpTraitIds = await this.traitRepository.getTraitsByIndexes(nextTraits);
    const levelUpGrantedIds = collectClassGrantedTraitIds(
      levelUpClassDoc?.levels ?? [],
      levelUpSubclasses.flatMap(item => item.levels),
      nextLevel
    );
    for (const traitId of optionPickResult.addedTraitIds) {
      levelUpGrantedIds.add(traitId);
    }

    const attributesBeforeGrant = applyTraitAbilityScores(storedAfterAsi, ownedTraits).attributes;
    const attributesAfterGrant = applyTraitAbilityScores(storedAfterAsi, levelUpTraitIds).attributes;
    const [apiAttributesBeforeHp, apiAttributesForHp] = await Promise.all([
      this.attributeService.formatAttributes(attributesBeforeGrant, personaje.systems ?? []),
      this.attributeService.formatAttributes(attributesAfterGrant, personaje.systems ?? [])
    ]);

    const newTotalLevels = totalLevels + 1;
    let HP = Math.floor(
      evaluateFormula(
        rulesConfig.hpLevelUpFormula,
        apiAttributesForHp,
        { hpIncrease },
        { classVariables: { hitDie: hpIncrease } }
      )
    );
    HP += traitHitPointBonus({
      traits: levelUpTraitIds,
      classGrantedTraitIds: levelUpGrantedIds,
      classLevel: nextLevel,
      characterLevel: newTotalLevels,
      previouslyOwnedIds: previouslyOwnedTraitIds
    });
    HP += constitutionHitPointDelta({
      before: apiAttributesBeforeHp,
      after: apiAttributesForHp,
      previousLevels: newTotalLevels - 1
    });

    const newProfBonus =
      rulesConfig.proficiencyProgression?.[newTotalLevels - 1]
      ?? DEFAULT_PROFICIENCY_PROGRESSION[newTotalLevels - 1]
      ?? personaje.proficiencyBonus
      ?? 0;

    const enteringTraits = await this.expandTraitsForSystems(
      stackingGranted,
      personaje.systems,
      this.chosenCreatureTypeIds(stackingGranted, traitChoices ?? personaje.traitChoices),
      this.chosenDamageTypeIds(stackingGranted, traitChoices ?? personaje.traitChoices)
    );
    const grantedForSkills = levelUpTraitIds.filter(trait => trait.id && levelUpGrantedIds.has(trait.id));
    const catalogChoices = await this.applyGrantedCatalogChoices({
      existing: personaje.traitChoices,
      incoming: traitChoices,
      classLevel: nextLevel,
      systems: personaje.systems,
      grantedTraits: grantedForSkills
    });
    const proficientIds = collectProficientSkillIds(nextSkills, [...ownedTraits, ...grantedForSkills, ...optionGrantedTraits]);
    const overlayResult = applyLevelSkillProficiencyPicks({
      grants: classLevel.skillProficiencyChoices,
      proficientIds,
      overlays: personaje.skillProficiencyOverlays,
      picks: skillProficiencyPicks
    });
    if ("error" in overlayResult) {
      throw new ValidationError(overlayResult.error);
    }
    const choiceResult = applyEnteringTraitChoices({
      existing: catalogChoices,
      incoming: traitChoices,
      enteringTraits
    });
    if ("error" in choiceResult) {
      throw new ValidationError(choiceResult.error);
    }

    let nextEquipment: CharacterEquipmentMongo[] | undefined;
    if (optionPickResult.removedTraitIds.length) {
      const removedTraits = await this.traitRepository.getTraitsByIndexes(optionPickResult.removedTraitIds);
      if (removedTraits.some(trait => trait.weaponBond)) {
        nextEquipment = clearWeaponBondOnTraitLost(this.toInventoryRows(personaje.equipment));
      }
      if (removedTraits.some(trait => trait.uniqueEquipmentGrant)) {
        nextEquipment = clearUniqueGrantedOnTraitLost(nextEquipment ?? this.toInventoryRows(personaje.equipment));
      }
    }
    const previouslyOwnedSet = new Set(previouslyOwnedTraitIds);
    const enteringUniqueGrantTraits = [...stackingGranted, ...optionGrantedTraits].filter(
      trait => trait.uniqueEquipmentGrant && trait.id && !previouslyOwnedSet.has(trait.id)
    );
    if (enteringUniqueGrantTraits.length) {
      nextEquipment = await this.ensureUniqueEquipmentGranted(
        nextEquipment ?? this.toInventoryRows(personaje.equipment),
        enteringUniqueGrantTraits
      );
    }

    const resultado = await CharacterModel.findByIdAndUpdate(
      id,
      {
        $set: {
          xp: 0,
          proficiencyBonus: Math.max(newProfBonus, personaje.proficiencyBonus ?? 0),
          traits: nextTraits,
          traitsData: nextTraitsData,
          traitChoices: choiceResult.traitChoices,
          skillProficiencyOverlays: overlayResult.overlays,
          subclasses: nextSubclassIds,
          ...(spellsUpdate ? { spells: spellsUpdate } : {}),
          ...(extraSpellsUpdate ? { extraSpells: extraSpellsUpdate } : {}),
          ...(preparedSpellsUpdate ? { preparedSpells: preparedSpellsUpdate } : {}),
          ...(nextAttributes ? { attributes: nextAttributes } : {}),
          ...(isNewClass || skillPickResult.ids.length ? { skills: nextSkills } : {}),
          ...(isNewClass ? { proficiencies: nextProficiencies } : {}),
          optionSelections: optionPickResult.selections,
          ...(nextEquipment ? { equipment: nextEquipment } : {}),
        },
        $inc: isNewClass
          ? { hpMax: HP, hpCurrent: HP }
          : { "classes.$[elem].level": 1, hpMax: HP, hpCurrent: HP },
        ...(isNewClass
          ? {
              $push: {
                classes: {
                  class: classId,
                  name: catalog.name,
                  level: 1,
                  hitDie: catalog.hit_die ?? 8
                }
              }
            }
          : {}),
      },
      {
        ...(isNewClass ? {} : { arrayFilters: [{ "elem.class": classId }] }),
        returnDocument: "after",
      }
    );

    if (!resultado) {
      throw new NotFoundError("Personaje no encontrado");
    }

    return this.formatSheetAndListCard(resultado);
  }

  async getByIds(indices: string[]): Promise<CharacterBasic[]> {
    try {
      if (!indices.length) return [];

      const personajes = await CharacterModel.find().where('_id').in(indices)
        .select(CHARACTER_LIST_SELECT)
        .collation({ locale: 'es', strength: 1 })
        .sort({ name: 1 })
        .lean<CharacterMongo[]>();
      return this.formatBasicCharacters(personajes)
    } catch (error) {
      console.error("Error obteniendo personajes:", error);
      throw new Error("No se pudieron obtener los personajes");
    }
  }

  async getCampaignLink(characterId: string): Promise<CharacterCampaignLink | null> {
    const personaje = await CharacterModel.findById(characterId).lean<CharacterMongo | null>();

    if (!personaje) {
      return null;
    }

    const campaign = typeof personaje.campaign === "string" && personaje.campaign.length > 0
      ? personaje.campaign
      : null;

    return {
      id: personaje._id.toString(),
      userId: personaje.user,
      campaign
    };
  }

  async assignToCampaign(characterId: string, campaignId: string): Promise<CharacterBasic | null> {
    const resultado = await CharacterModel.findByIdAndUpdate(
      characterId,
      { $set: { campaign: campaignId } },
      { returnDocument: "after" }
    );

    if (!resultado) {
      return null;
    }

    return this.formatBasicCharacter(resultado);
  }

  async unassignFromCampaign(characterId: string, campaignId: string): Promise<{ characterId: string } | null> {
    const resultado = await CharacterModel.findOneAndUpdate(
      { _id: characterId as any, campaign: campaignId },
      { $set: { campaign: null } },
      { returnDocument: "after" }
    );

    if (!resultado) {
      return null;
    }

    return { characterId };
  }

  async bindWeaponBond(data: TypeBindWeaponBond): Promise<CharacterEquipmentStateResponse> {
    const { id, instanceId, isBond } = data;
    const personaje = await CharacterModel.findById(id);

    if (!personaje) {
      throw new NotFoundError("Personaje no encontrado");
    }

    let inventory = this.toInventoryRows(personaje.equipment);
    this.requireInventoryInstance(inventory, instanceId);

    if (isBond) {
      const traits = await this.traitRepository.getTraitsByIndexes(personaje.traits ?? []);
      const config = ownedWeaponBond(traits);
      if (!config) {
        throw new ValidationError("El personaje no tiene un rasgo de arma vinculada");
      }

      const split = splitOne(inventory, instanceId);
      inventory = split.inventory;
      const boundId = split.instance.instanceId;
      const boundItem = this.requireInventoryInstance(inventory, boundId);
      if (!boundItem.isMagic) {
        throw new ValidationError("Solo se puede vincular equipamiento mágico");
      }

      const catalogItem = await this.equipmentRepository.getById(boundItem.equipmentId);
      const formError = weaponBondFormRejection(config, catalogItem);
      if (formError) {
        throw new ValidationError(
          formError === "La forma del arma vinculada debe ser un arma"
            ? "Solo se puede vincular un arma"
            : "Solo se puede vincular un arma cuerpo a cuerpo"
        );
      }

      const bound = applyBindWeaponBond(inventory, boundId);
      if (!bound.ok) {
        throw new ValidationError(bound.message);
      }
      inventory = bound.inventory;
    } else {
      const unbound = applyUnbindWeaponBond(inventory, instanceId);
      if (!unbound.ok) {
        throw new ValidationError(unbound.message);
      }
      inventory = unbound.inventory;
    }

    return this.saveInventoryAndFormatEquipmentState(id, inventory);
  }

  async learnSpells(data: TypeLearnSpells): Promise<CharacterSpellStateResponse> {
    const { id, classId, spells, userId } = data
    const personaje = await CharacterModel.findById(id)

    if (!personaje) {
      throw new NotFoundError("Personaje no encontrado")
    }

    await this.assertCanAccessCharacter(personaje, userId)

    const classEntry = personaje.classes?.find(clas => clas.class === classId)
    if (!classEntry) {
      throw new ValidationError("El personaje no tiene esa clase")
    }

    const sources = await this.characterClassRepository.getSpellcastingSources([
      { id: classId, level: classEntry.level }
    ])
    const source = sources.find(item => item?.class === classId) ?? sources[0] ?? null
    if (!source) {
      throw new ValidationError("Esta clase no puede aprender conjuros a este nivel")
    }

    const knownIds = this.getClassSpellIds(personaje, classId)
    const [loadedSpells, existingSpells, extraClassSpellIds] = await Promise.all([
      this.spellRepository.getSpellsByIndexes(spells),
      knownIds.length ? this.spellRepository.getSpellsByIndexes(knownIds) : Promise.resolve([]),
      this.extraClassSpellIds(personaje, classId),
    ])

    const validation = validateKnownSpellPicks({
      spellIds: spells,
      knownIds,
      classId,
      spells: loadedSpells
        .filter((spell): spell is SpellApi & { id: string } => Boolean(spell.id))
        .map(spell => ({
          id: spell.id,
          level: spell.level,
          classIds: (spell.classes ?? []).map(clas => clas.id)
        })),
      castableLevels: castableSpellLevels(source.slots),
      cantripCap: source.slots?.cantrips,
      ownedCantripCount: existingSpells.filter(spell => spell.level === 0).length,
      extraClassSpellIds,
    })

    if (validation.error) {
      throw new ValidationError(validation.error)
    }

    const spellsUpdate = this.mergeClassSpellIds(personaje, classId, spells)
    if (!spellsUpdate) {
      throw new ValidationError("Debe indicar al menos un conjuro")
    }

    const resultado = await CharacterModel.findByIdAndUpdate(
      id,
      { $set: { spells: spellsUpdate } },
      { returnDocument: "after" }
    )

    if (!resultado) {
      throw new NotFoundError("Personaje no encontrado")
    }

    return this.formatSpellState(resultado)
  }

  async copySpells(data: TypeCopySpells): Promise<CharacterSpellStateResponse> {
    const { id, classId, spells, traitId, userId } = data
    const personaje = await CharacterModel.findById(id)

    if (!personaje) {
      throw new NotFoundError("Personaje no encontrado")
    }

    await this.assertCanAccessCharacter(personaje, userId)

    const classEntry = personaje.classes?.find(clas => clas.class === classId)
    if (!classEntry) {
      throw new ValidationError("El personaje no tiene esa clase")
    }

    let config: SpellRepositoryConfig | undefined
    if (traitId) {
      const loadedTraits = await this.traitRepository.getTraitsByIndexes([traitId])
      const trait = loadedTraits[0]
      if (!trait) {
        throw new NotFoundError("Rasgo no encontrado")
      }
      if (!characterHasTrait(personaje.traits ?? [], [traitId, trait.id])) {
        throw new ValidationError("El personaje no tiene ese rasgo")
      }
      if (!trait.spellRepository) {
        throw new ValidationError("Este rasgo no define un repositorio de conjuros")
      }
      config = trait.spellRepository
    } else {
      const classDoc = await this.characterClassRepository.getById(classId)
      if (!classDoc?.spellRepository) {
        throw new ValidationError("Esta clase no define un repositorio de conjuros")
      }
      config = classDoc.spellRepository
    }

    const rules = resolveSpellRepositoryCopyRules(config)
    if (rules.equipmentId) {
      const inventory = this.toInventoryRows(personaje.equipment)
      const hasBook = inventory.some(item => item.equipmentId === rules.equipmentId)
      if (!hasBook) {
        throw new ValidationError("El personaje no tiene el repositorio de conjuros")
      }
    }

    let castableLevels: number[] = []
    if (rules.maxLevel === "castable") {
      const sources = await this.characterClassRepository.getSpellcastingSources([
        { id: classId, level: classEntry.level }
      ])
      const source = sources.find(item => item?.class === classId) ?? sources[0] ?? null
      if (!source) {
        throw new ValidationError("Esta clase no puede copiar conjuros a este nivel")
      }
      castableLevels = castableSpellLevels(source.slots)
    }

    const knownIds = this.getClassSpellIds(personaje, classId)
    const extraIds = getExtraSpellIds(personaje.extraSpells, classId)
    const privilegeIds = getCharacterSpellPrivileges(personaje.spellPrivileges)
      .filter(item => item.classId === classId)
      .flatMap(item => item.selections.flat())
      .filter((spellId): spellId is string => Boolean(spellId))
    const ownedIds = [...new Set([...knownIds, ...extraIds, ...privilegeIds])]

    const [loadedSpells, extraClassSpellIds] = await Promise.all([
      this.spellRepository.getSpellsByIndexes(spells),
      this.extraClassSpellIds(personaje, classId),
    ])

    const validation = validateCopiedSpellPicks({
      spellIds: spells,
      ownedIds,
      classId,
      spells: loadedSpells
        .filter((spell): spell is SpellApi & { id: string } => Boolean(spell.id))
        .map(spell => ({
          id: spell.id,
          level: spell.level,
          classIds: (spell.classes ?? []).map(clas => clas.id),
          ritual: spell.ritual
        })),
      source: rules.source,
      ritualOnly: rules.ritualOnly,
      includesCantrips: rules.includesCantrips,
      maxLevel: rules.maxLevel,
      classLevel: classEntry.level,
      castableLevels,
      extraClassSpellIds,
    })

    if (validation.error) {
      throw new ValidationError(validation.error)
    }

    const update: Record<string, unknown> = {}
    if (rules.destination === "extra") {
      update.extraSpells = concatExtraSpellIds(personaje.extraSpells, classId, spells)
    } else {
      const spellsUpdate = this.mergeClassSpellIds(personaje, classId, spells)
      if (!spellsUpdate) {
        throw new ValidationError("Debe indicar al menos un conjuro")
      }
      update.spells = spellsUpdate
    }

    const resultado = await CharacterModel.findByIdAndUpdate(
      id,
      { $set: update },
      { returnDocument: "after" }
    )

    if (!resultado) {
      throw new NotFoundError("Personaje no encontrado")
    }

    return this.formatSpellState(resultado)
  }

  async prepareSpells(data: TypePrepareSpells): Promise<CharacterSpellStateResponse> {
    const { id, classId, spells, userId } = data
    const personaje = await CharacterModel.findById(id)

    if (!personaje) {
      throw new NotFoundError("Personaje no encontrado")
    }

    await this.assertCanAccessCharacter(personaje, userId)

    const classEntry = personaje.classes?.find(clas => clas.class === classId)
    if (!classEntry) {
      throw new ValidationError("El personaje no tiene esa clase")
    }

    const sources = await this.characterClassRepository.getSpellcastingSources([
      { id: classId, level: classEntry.level }
    ])
    const source = sources.find(item => item?.class === classId) ?? sources[0] ?? null
    if (!source?.spellsPreparedFormula?.trim() || !source.preparedFrom) {
      throw new ValidationError("Esta clase no prepara conjuros")
    }

    const apiAttributes = await this.formatSheetAttributes(personaje)
    const systemAttributes = await this.attributeService.getBySystems(personaje.systems ?? [])
    const ability = systemAttributes.find(attr => attr.key === source.abilityKey)
    if (!ability) {
      throw new ValidationError("No se encontró la característica de lanzamiento de conjuros de esta clase")
    }

    const spellcastingLevel = buildSpellcastingLevel(
      source,
      ability,
      apiAttributes,
      personaje.proficiencyBonus ?? 0
    )
    const privilegeInstances = getCharacterSpellPrivileges(personaje.spellPrivileges)
    const privilegeTraitIds = [...new Set(
      privilegeInstances.filter(item => item.classId === classId).map(item => item.traitId)
    )]
    const privilegeTraits = privilegeTraitIds.length
      ? await this.traitRepository.getTraitsByIndexes(privilegeTraitIds)
      : []
    const rulesByTraitId = this.buildPrivilegeRulesMap(privilegeTraits, privilegeInstances)
    const excludedFromCap = privilegeSpellIdsExcludedFromCap(
      privilegeInstances,
      rulesByTraitId,
      classId,
      this.classLevelByClassId(personaje)
    )
    const persistIds = spells.filter(id => !excludedFromCap.has(id))
    const [loadedSpells, extraClassSpellIds] = await Promise.all([
      persistIds.length ? this.spellRepository.getSpellsByIndexes(persistIds) : Promise.resolve([]),
      this.extraClassSpellIds(personaje, classId)
    ])
    const validation = validatePreparedSpellPicks({
      spellIds: persistIds,
      cap: spellcastingLevel.spellsPrepared ?? 0,
      preparedFrom: source.preparedFrom,
      knownIds: this.getClassSpellIds(personaje, classId),
      classId,
      spells: loadedSpells
        .filter((spell): spell is SpellApi & { id: string } => Boolean(spell.id))
        .map(spell => ({
          id: spell.id,
          level: spell.level,
          classIds: (spell.classes ?? []).map(clas => clas.id)
        })),
      castableLevels: castableSpellLevels(spellcastingLevel.slots),
      excludeFromCap: excludedFromCap,
      extraClassSpellIds
    })

    if (validation.error) {
      throw new ValidationError(validation.error)
    }

    const preparedSpells = {
      ...(personaje.preparedSpells && typeof personaje.preparedSpells === "object"
        ? personaje.preparedSpells
        : {})
    }
    preparedSpells[classId] = [...persistIds]

    const resultado = await CharacterModel.findByIdAndUpdate(
      id,
      { $set: { preparedSpells } },
      { returnDocument: "after" }
    )

    if (!resultado) {
      throw new NotFoundError("Personaje no encontrado")
    }

    return this.formatSpellState(resultado)
  }

  async bindSpellPrivileges(data: TypeBindSpellPrivileges): Promise<CharacterSpellStateResponse> {
    const { id, traitId, classId, selections, userId } = data
    const personaje = await CharacterModel.findById(id)

    if (!personaje) {
      throw new NotFoundError("Personaje no encontrado")
    }

    await this.assertCanAccessCharacter(personaje, userId)

    const loadedTraits = await this.traitRepository.getTraitsByIndexes([traitId])
    const trait = loadedTraits[0]
    if (!trait) {
      throw new NotFoundError("Rasgo no encontrado")
    }

    const rules = trait.spellPrivileges ?? []
    const instances = getCharacterSpellPrivileges(personaje.spellPrivileges)
    const existing = findSpellPrivilegeInstance(instances, traitId, classId, [trait.id])

    const selectionIds = selections.flat()
    const [loadedSpells, extraClassSpellIds] = await Promise.all([
      selectionIds.length
        ? this.spellRepository.getSpellsByIndexes(selectionIds)
        : Promise.resolve([]),
      this.extraClassSpellIds(personaje, classId)
    ])
    const classEntry = personaje.classes?.find(clas => clas.class === classId)
    const classLevel = classEntry?.level ?? 0
    const validation = validateSpellPrivilegePicks({
      hasClass: Boolean(classEntry),
      hasTrait: characterHasTrait(personaje.traits ?? [], [traitId, trait.id]),
      rules,
      selections,
      knownIds: this.getClassSpellIds(personaje, classId),
      classId,
      spells: loadedSpells
        .filter((spell): spell is SpellApi & { id: string } => Boolean(spell.id))
        .map(spell => ({
          id: spell.id,
          level: spell.level,
          classIds: (spell.classes ?? []).map(clas => clas.id),
          ritual: spell.ritual
        })),
      extraClassSpellIds,
      classLevel,
      existingSelections: existing?.selections
    })
    if (validation.error) {
      throw new ValidationError(validation.error)
    }

    const activeIndexes = activeSpellPrivilegeRuleIndexes(rules, classLevel)
    const nextInstance: CharacterSpellPrivilegeMongo = {
      traitId,
      classId,
      selections: alignPrivilegeSelections(rules.length, activeIndexes, selections)
    }
    const nextPrivileges = [
      ...instances.filter(item =>
        !(item.classId === classId && (item.traitId === traitId || item.traitId === trait.id))
      ),
      nextInstance
    ]

    const resultado = await CharacterModel.findByIdAndUpdate(
      id,
      { $set: { spellPrivileges: nextPrivileges } },
      { returnDocument: "after" }
    )

    if (!resultado) {
      throw new NotFoundError("Personaje no encontrado")
    }

    return this.formatSpellState(resultado, { includePrivileges: true })
  }

  async useTrait(data: TypeUseTrait): Promise<CharacterStatePatch> {
    const { id, traitId, userId, equipmentId } = data;
    const personaje = await CharacterModel.findById(id);
    if (!personaje) {
      throw new NotFoundError("Personaje no encontrado");
    }
    await this.assertCanAccessCharacter(personaje, userId);

    const loadedTraits = await this.traitRepository.getTraitsByIndexes([traitId]);
    const trait = loadedTraits[0];
    if (!trait?.id) {
      throw new NotFoundError("Rasgo no encontrado");
    }

    const grantingClassByTraitId = await this.loadGrantingClasses(personaje);
    const grant = grantingClassByTraitId.get(trait.id);
    const traitResources = normalizeTraitResources(personaje.traitResources);
    const activeTraitIds = normalizeActiveTraitIds(personaje.activeTraitIds);
    const equipment = await this.equipmentRepository.getCharacterEquipmentsByIds(
      this.toHydrationRows(personaje.equipment)
    );
    const result = applyUseTraitAction({
      ownsTrait: characterHasTrait(personaje.traits ?? [], [traitId, trait.id]),
      trait,
      requestedTraitId: traitId,
      classLevel: grant?.level,
      spent: spentForTrait(traitResources, [trait.id, traitId]),
      traitResources,
      activeTraitIds,
      armorSuppressed: isTraitSuppressedByArmor(
        trait,
        collectEquippedArmorSuppression(equipment ?? [])
      )
    });
    if (!result.ok) {
      throw new ValidationError(result.message);
    }

    let inventory: CharacterEquipmentMongo[] | undefined;
    if (trait.weaponBond) {
      inventory = await this.applyWeaponBondUse(
        this.toInventoryRows(personaje.equipment),
        trait.weaponBond,
        equipmentId
      );
    }
    if (trait.uniqueEquipmentGrant) {
      inventory = await this.replaceUniqueEquipmentGrant(
        inventory ?? this.toInventoryRows(personaje.equipment),
        trait.uniqueEquipmentGrant.id
      );
    }

    const recover = trait.action?.recoverSpellSlots;
    let spellSlotsSpent: CharacterSpellSlotSpent[] | undefined;
    if (recover && grant?.classId) {
      const slotPools = await this.loadSpellSlotPools(personaje);
      const slotSpent = normalizeSpellSlotsSpent(personaje.spellSlotsSpent, slotPools);
      spellSlotsSpent = applyRecoverClassSpellSlots(slotSpent, {
        classId: grant.classId,
        pool: recover.pool
      });
    }

    const updated = await this.persistTraitStance(id, result.traitResources, result.activeTraitIds, undefined, {
      ...(spellSlotsSpent ? { spellSlotsSpent } : {}),
      ...(inventory ? { equipment: inventory } : {})
    });
    const isStance = (trait.action?.kind ?? "instant") === "stance";
    return this.formatTraitStatePatch(updated, {
      includeSpellSlots: Boolean(spellSlotsSpent),
      includeEquipment: Boolean(inventory),
      includeCombatDerived: Boolean(inventory) || isStance
    });
  }

  async deactivateTrait(data: TypeUseTrait): Promise<CharacterStatePatch> {
    const { id, traitId, userId } = data;
    const personaje = await CharacterModel.findById(id);
    if (!personaje) {
      throw new NotFoundError("Personaje no encontrado");
    }
    await this.assertCanAccessCharacter(personaje, userId);

    const loadedTraits = await this.traitRepository.getTraitsByIndexes([traitId]);
    const trait = loadedTraits[0];
    if (trait?.weaponBond) {
      const dismissed = applyDismissWeaponBond(this.toInventoryRows(personaje.equipment));
      if (dismissed.ok) {
        const updated = await this.persistTraitStance(
          id,
          normalizeTraitResources(personaje.traitResources),
          normalizeActiveTraitIds(personaje.activeTraitIds),
          undefined,
          { equipment: dismissed.inventory }
        );
        return this.formatTraitStatePatch(updated, {
          includeEquipment: true,
          includeCombatDerived: true
        });
      }
    }

    const result = applyDeactivateTrait({
      traitId,
      aliases: trait?.id ? [trait.id] : [],
      traitResources: normalizeTraitResources(personaje.traitResources),
      activeTraitIds: normalizeActiveTraitIds(personaje.activeTraitIds)
    });
    if (!result.ok) {
      throw new ValidationError(result.message);
    }

    const updated = await this.persistTraitStance(id, result.traitResources, result.activeTraitIds);
    return this.formatTraitStatePatch(updated, { includeCombatDerived: true });
  }

  async restCharacter(data: TypeRestCharacter): Promise<CharacterStatePatch> {
    const { id, type, userId } = data;
    const personaje = await CharacterModel.findById(id);
    if (!personaje) {
      throw new NotFoundError("Personaje no encontrado");
    }
    await this.assertCanAccessCharacter(personaje, userId);

    const rulesConfig = await this.systemRepository.getMergedRulesConfig(personaje.systems ?? []);
    const restError = characterRestRejection(rulesConfig.restRules, type);
    if (restError) {
      throw new ValidationError(restError);
    }

    const loaded = await this.traitRepository.getTraitsByIndexes(personaje.traits ?? []);
    const traits = await this.expandTraitsForSystems(
      loaded,
      personaje.systems,
      this.chosenCreatureTypeIds(loaded, personaje.traitChoices),
      this.chosenDamageTypeIds(loaded, data.traitChoices ?? personaje.traitChoices)
    );
    const next = applyCharacterRest({
      restType: type,
      restRules: rulesConfig.restRules,
      traits,
      traitResources: normalizeTraitResources(personaje.traitResources),
      activeTraitIds: normalizeActiveTraitIds(personaje.activeTraitIds)
    });
    const choiceResult = applyRestTraitChoices({
      existing: personaje.traitChoices,
      incoming: data.traitChoices,
      restType: type,
      restRules: rulesConfig.restRules,
      traits
    });
    if ("error" in choiceResult) {
      throw new ValidationError(choiceResult.error);
    }

    const pools = classPoolsFromCharacter(personaje.classes ?? []);
    const spent = normalizeHitDiceSpent(
      personaje.hitDiceSpent,
      pools.map((pool) => pool.classId)
    );
    const spentResult = applyRestHitDiceSpends({
      spends: data.hitDiceSpends,
      allowed: hitDiceSpendAllowed(rulesConfig.restRules, type),
      pools,
      spent,
      hpActual: Number(personaje.hpCurrent) || 0,
      hpMax: Number(personaje.hpMax) || 0,
      bonusPerDie: await this.resolveHitDiceBonusPerDie(personaje, rulesConfig.restRules),
    });
    if (!spentResult.ok) {
      throw new ValidationError(spentResult.message);
    }
    const recovery = resolveHitPointRecovery(rulesConfig.restRules, type);
    const recovered = applyHitPointRecovery({
      hp: recovery.hp,
      hitDice: recovery.hitDice,
      pools,
      spent: spentResult.spent,
      hpActual: spentResult.hpActual,
      hpMax: Number(personaje.hpMax) || 0,
    });

    const slotPools = await this.loadSpellSlotPools(personaje);
    const slotSpent = normalizeSpellSlotsSpent(personaje.spellSlotsSpent, slotPools);
    const recoveredSlots = applySpellSlotRecovery(
      slotSpent,
      resolveSpellSlotRecovery(rulesConfig.restRules, type)
    );

    const currentConditions = normalizeActiveConditions(personaje.activeConditions);
    const conditionCatalogs = await this.conditionRepository.getByIds(
      currentConditions.map((item) => item.conditionId)
    );
    const recoveredConditions = applyConditionRestRecovery({
      current: currentConditions,
      catalogs: conditionCatalogs,
      restType: type,
      restRules: rulesConfig.restRules
    });

    const updated = await this.persistTraitStance(
      id,
      next.traitResources,
      next.activeTraitIds,
      data.traitChoices !== undefined ? choiceResult.traitChoices : undefined,
      {
        hpCurrent: recovered.hpActual,
        hitDiceSpent: recovered.spent,
        spellSlotsSpent: recoveredSlots,
        activeConditions: recoveredConditions
      }
    );
    return this.formatRestStatePatch(updated);
  }

  async spendHitDice(data: TypeSpendHitDice): Promise<CharacterStatePatch> {
    const { id, classId, count, hpGained, userId } = data;
    const personaje = await CharacterModel.findById(id);
    if (!personaje) {
      throw new NotFoundError("Personaje no encontrado");
    }
    await this.assertCanAccessCharacter(personaje, userId);

    const pools = classPoolsFromCharacter(personaje.classes ?? []);
    const spent = normalizeHitDiceSpent(
      personaje.hitDiceSpent,
      pools.map((pool) => pool.classId)
    );
    const rulesConfig = await this.systemRepository.getMergedRulesConfig(personaje.systems ?? []);
    const bonusPerDie = await this.resolveHitDiceBonusPerDie(personaje, rulesConfig.restRules);
    const result = applySpendHitDice({
      classId,
      count,
      hpGained,
      pools,
      spent,
      hpActual: Number(personaje.hpCurrent) || 0,
      hpMax: Number(personaje.hpMax) || 0,
      bonusPerDie,
    });
    if (!result.ok) {
      throw new ValidationError(result.message);
    }

    const updated = await CharacterModel.findByIdAndUpdate(
      id,
      { $set: { hpCurrent: result.hpActual, hitDiceSpent: result.spent } },
      { returnDocument: "after" }
    );
    if (!updated) {
      throw new NotFoundError("Personaje no encontrado");
    }
    return {
      hpCurrent: result.hpActual,
      hitDice: toHitDiceApi(pools, result.spent, bonusPerDie)
    };
  }

  async applyHp(data: TypeApplyCharacterHp): Promise<CharacterStatePatch> {
    const { id, amount, kind, userId } = data;
    const personaje = await CharacterModel.findById(id);
    if (!personaje) {
      throw new NotFoundError("Personaje no encontrado");
    }
    await this.assertCanAccessCharacter(personaje, userId);

    const hpActual = Number(personaje.hpCurrent) || 0;
    const hpMax = Number(personaje.hpMax) || 0;
    const nextHp = kind === "heal"
      ? applyHpHeal(hpActual, hpMax, amount)
      : applyHpDamage(hpActual, amount);

    const updated = await CharacterModel.findByIdAndUpdate(
      id,
      { $set: { hpCurrent: nextHp } },
      { returnDocument: "after" }
    );
    if (!updated) {
      throw new NotFoundError("Personaje no encontrado");
    }
    return { hpCurrent: nextHp };
  }

  async spendSpellSlot(data: TypeSpendSpellSlot): Promise<CharacterStatePatch> {
    const { id, classId, pool, level, userId } = data;
    const personaje = await CharacterModel.findById(id);
    if (!personaje) {
      throw new NotFoundError("Personaje no encontrado");
    }
    await this.assertCanAccessCharacter(personaje, userId);

    const slotPools = await this.loadSpellSlotPools(personaje);
    const spent = normalizeSpellSlotsSpent(personaje.spellSlotsSpent, slotPools);
    const result = applySpendSpellSlot({ classId, pool, level, pools: slotPools, spent });
    if (!result.ok) {
      throw new ValidationError(result.message);
    }

    const updated = await CharacterModel.findByIdAndUpdate(
      id,
      { $set: { spellSlotsSpent: result.spent } },
      { returnDocument: "after" }
    );
    if (!updated) {
      throw new NotFoundError("Personaje no encontrado");
    }
    return {
      spellSlots: toSpellSlotsApi(slotPools, result.spent)
    };
  }

  async applyCharacterCondition(data: TypeApplyCharacterCondition): Promise<CharacterStatePatch> {
    const { id, conditionId, level, userId } = data;
    const personaje = await this.requireAccessibleCharacter(id, userId);
    const condition = await this.requireAvailableCondition(conditionId, personaje.systems ?? []);
    const traits = await this.loadExpandedTraits(personaje);
    const result = applyCondition({
      condition,
      current: normalizeActiveConditions(personaje.activeConditions),
      addLevel: level,
      immuneIds: immuneConditionIdsFromTraits(traits, normalizeActiveTraitIds(personaje.activeTraitIds))
    });
    if (!result.ok) {
      throw new ValidationError(result.message);
    }
    return this.persistActiveConditions(id, result.next);
  }

  async updateCharacterCondition(data: TypeUpdateCharacterCondition): Promise<CharacterStatePatch> {
    const { id, conditionId, delta, userId } = data;
    const personaje = await this.requireAccessibleCharacter(id, userId);
    const condition = await this.requireAvailableCondition(conditionId, personaje.systems ?? []);
    const result = applyConditionDelta({
      condition,
      current: normalizeActiveConditions(personaje.activeConditions),
      delta
    });
    if (!result.ok) {
      throw new ValidationError(result.message);
    }
    return this.persistActiveConditions(id, result.next);
  }

  async removeCharacterCondition(data: TypeRemoveCharacterCondition): Promise<CharacterStatePatch> {
    const { id, conditionId, userId } = data;
    const personaje = await this.requireAccessibleCharacter(id, userId);
    const result = removeCondition(normalizeActiveConditions(personaje.activeConditions), conditionId);
    if (!result.ok) {
      throw new ValidationError(result.message);
    }
    return this.persistActiveConditions(id, result.next);
  }

  async getOwnedTraitIds(id: string, userId: string): Promise<string[]> {
    const personaje = await CharacterModel.findById(id);
    if (!personaje) {
      throw new NotFoundError("Personaje no encontrado");
    }
    await this.assertCanAccessCharacter(personaje, userId);
    return Array.isArray(personaje.traits) ? [...personaje.traits] : [];
  }

  async addForm(data: TypeAddCharacterFormPersist): Promise<CharacterStatePatch> {
    const { id, userId, entry, choose, replaceOnRecast } = data;
    const personaje = await CharacterModel.findById(id);
    if (!personaje) {
      throw new NotFoundError("Personaje no encontrado");
    }
    await this.assertCanAccessCharacter(personaje, userId);

    const forms = normalizeCharacterForms(personaje.forms);
    let activeFormId = typeof personaje.activeFormId === "string" ? personaje.activeFormId : null;
    const sameSpell = forms.filter(form => form.spellId === entry.spellId);
    const newForm: CharacterFormMongo = {
      id: new Types.ObjectId().toString(),
      creatureId: entry.creatureId,
      spellId: entry.spellId,
      purpose: entry.purpose
    };

    if (replaceOnRecast && sameSpell.length) {
      const ids = new Set(sameSpell.map(form => form.id));
      const next = forms.filter(form => !ids.has(form.id));
      next.push(newForm);
      const replacedActive = Boolean(activeFormId && ids.has(activeFormId));
      if (replacedActive && formPurposeOverlaysCharacter(entry.purpose)) {
        activeFormId = newForm.id;
      } else if (replacedActive) {
        activeFormId = null;
      }
      if (next.length > MAX_CHARACTER_FORMS) {
        throw new ValidationError(`No se pueden registrar más de ${MAX_CHARACTER_FORMS} formas`);
      }
      return this.persistCharacterForms(id, next, activeFormId, { includeCombatOverlay: replacedActive });
    }

    if (sameSpell.length >= choose) {
      throw new ValidationError(`Este conjuro solo admite ${choose} forma(s) a la vez`);
    }
    if (forms.length >= MAX_CHARACTER_FORMS) {
      throw new ValidationError(`No se pueden registrar más de ${MAX_CHARACTER_FORMS} formas`);
    }

    forms.push(newForm);
    return this.persistCharacterForms(id, forms, activeFormId);
  }

  async activateForm(data: TypeSetCharacterFormActive): Promise<CharacterStatePatch> {
    const { id, formId, userId } = data;
    const personaje = await CharacterModel.findById(id);
    if (!personaje) {
      throw new NotFoundError("Personaje no encontrado");
    }
    await this.assertCanAccessCharacter(personaje, userId);

    const forms = normalizeCharacterForms(personaje.forms);
    const form = forms.find(item => item.id === formId);
    if (!form) {
      throw new NotFoundError("Forma no encontrada");
    }
    if (!formPurposeOverlaysCharacter(form.purpose)) {
      throw new ValidationError("Solo se puede activar una forma propia o de objetivo");
    }
    if (personaje.activeFormId === formId) {
      throw new ValidationError("La forma ya está activa");
    }

    return this.persistCharacterForms(id, forms, formId, { includeCombatOverlay: true });
  }

  async deactivateForm(data: TypeSetCharacterFormActive): Promise<CharacterStatePatch> {
    const { id, formId, userId } = data;
    const personaje = await CharacterModel.findById(id);
    if (!personaje) {
      throw new NotFoundError("Personaje no encontrado");
    }
    await this.assertCanAccessCharacter(personaje, userId);

    const forms = normalizeCharacterForms(personaje.forms);
    if (!forms.some(item => item.id === formId)) {
      throw new NotFoundError("Forma no encontrada");
    }
    if (personaje.activeFormId !== formId) {
      throw new ValidationError("La forma no está activa");
    }

    return this.persistCharacterForms(id, forms, null, { includeCombatOverlay: true });
  }

  private async persistCharacterForms(
    id: string,
    forms: CharacterFormMongo[],
    activeFormId: string | null,
    options?: { includeCombatOverlay?: boolean }
  ): Promise<CharacterStatePatch> {
    const resultado = await CharacterModel.findByIdAndUpdate(
      id,
      { $set: { forms, activeFormId } },
      { returnDocument: "after" }
    );
    if (!resultado) {
      throw new NotFoundError("Personaje no encontrado");
    }
    return this.formatFormsStatePatch(resultado, options?.includeCombatOverlay === true);
  }

  private async formatFormsStatePatch(
    personaje: CharacterMongo,
    includeCombatOverlay: boolean
  ): Promise<CharacterStatePatch> {
    const stored = normalizeCharacterForms(personaje.forms);
    const activeFormId = typeof personaje.activeFormId === "string" ? personaje.activeFormId : null;
    const creatureIds = [...new Set(stored.map(form => form.creatureId).filter(Boolean))];
    const spellIds = [...new Set(stored.flatMap(form => form.spellId ? [form.spellId] : []))];
    const [summaries, spellRefs] = await Promise.all([
      creatureIds.length ? this.creatureRepository.getSummariesByIds(creatureIds) : Promise.resolve([] as CreatureFormSummary[]),
      spellIds.length ? this.spellRepository.getSpellRefsByIndexes(spellIds) : Promise.resolve([] as SpellRef[])
    ]);
    const summaryById = new Map(summaries.map(creature => [creature.id, creature]));
    const spellById = new Map(spellRefs.map(spell => [spell.id, spell]));
    const forms: CharacterFormApi[] = stored.map(form => {
      const spell = form.spellId ? spellById.get(form.spellId) : undefined;
      const hydrated: CharacterFormApi = {
        id: form.id,
        creature: summaryById.get(form.creatureId),
        active: activeFormId === form.id && formPurposeOverlaysCharacter(form.purpose)
      };
      if (form.purpose) hydrated.purpose = form.purpose;
      if (form.spellId) hydrated.spellId = form.spellId;
      if (spell) hydrated.spell = { id: spell.id, name: spell.name };
      return hydrated;
    });
    const patch: CharacterStatePatch = { forms, activeFormId };
    if (!includeCombatOverlay) return patch;

    const sheet = await this.formatCharacter(personaje, { view: "combat", omitSpellHydration: true });
    return {
      ...toCharacterStatePatch(sheet, CHARACTER_FORM_OVERLAY_PATCH_KEYS),
      forms,
      activeFormId: sheet.activeFormId ?? activeFormId
    };
  }

  private async formatTraitStatePatch(
    personaje: CharacterMongo,
    options: {
      includeSpellSlots?: boolean;
      includeEquipment?: boolean;
      includeCombatDerived?: boolean;
    }
  ): Promise<CharacterStatePatch> {
    const patch: CharacterStatePatch = {
      traitResources: normalizeTraitResources(personaje.traitResources),
      activeTraitIds: normalizeActiveTraitIds(personaje.activeTraitIds)
    };
    if (options.includeSpellSlots) {
      patch.spellSlots = await this.formatSpellSlotsApi(personaje);
    }
    if (options.includeCombatDerived || options.includeEquipment) {
      const equipmentState = await this.formatEquipmentState(personaje);
      patch.ac = equipmentState.ac;
      patch.speed = equipmentState.speed;
      patch.resistances = equipmentState.resistances;
      patch.conditionImmunities = equipmentState.conditionImmunities;
      patch.wearingArmorWithoutProficiency = equipmentState.wearingArmorWithoutProficiency;
      patch.disadvantageSkillKeys = equipmentState.disadvantageSkillKeys;
      if (options.includeEquipment) {
        patch.equipment = equipmentState.equipment;
      }
    }
    return patch;
  }

  private async formatRestStatePatch(personaje: CharacterMongo): Promise<CharacterStatePatch> {
    const equipmentState = await this.formatEquipmentState(personaje);
    const [hitDice, spellSlots, activeConditions] = await Promise.all([
      this.formatHitDiceApi(personaje),
      this.formatSpellSlotsApi(personaje),
      this.formatActiveConditionsApi(personaje)
    ]);
    return {
      basic: equipmentState.basic,
      hpCurrent: Number(personaje.hpCurrent) || 0,
      hpMax: Number(personaje.hpMax) || 0,
      hitDice,
      spellSlots,
      traitResources: normalizeTraitResources(personaje.traitResources),
      activeTraitIds: normalizeActiveTraitIds(personaje.activeTraitIds),
      activeConditions,
      ac: equipmentState.ac,
      speed: equipmentState.speed,
      resistances: equipmentState.resistances,
      conditionImmunities: equipmentState.conditionImmunities
    };
  }

  private async formatHitDiceApi(personaje: CharacterMongo): Promise<CharacterHitDiceApi[]> {
    const pools = classPoolsFromCharacter(personaje.classes ?? []);
    const rulesConfig = await this.systemRepository.getMergedRulesConfig(personaje.systems ?? []);
    const bonusPerDie = await this.resolveHitDiceBonusPerDie(personaje, rulesConfig.restRules);
    return toHitDiceApi(
      pools,
      normalizeHitDiceSpent(personaje.hitDiceSpent, pools.map(pool => pool.classId)),
      bonusPerDie
    );
  }

  private async formatSpellSlotsApi(personaje: CharacterMongo): Promise<CharacterSpellSlotApi[]> {
    const slotPools = await this.loadSpellSlotPools(personaje);
    return toSpellSlotsApi(
      slotPools,
      normalizeSpellSlotsSpent(personaje.spellSlotsSpent, slotPools)
    );
  }

  private async formatActiveConditionsApi(personaje: CharacterMongo): Promise<CharacterActiveConditionApi[]> {
    const stored = normalizeActiveConditions(personaje.activeConditions);
    if (!stored.length) return [];
    const docs = await this.conditionRepository.getByIds(stored.map(item => item.conditionId));
    const byId = new Map(docs.map(condition => [condition.id, condition]));
    return stored.map(item => ({
      conditionId: item.conditionId,
      name: byId.get(item.conditionId)?.name ?? "",
      ...(item.level !== undefined ? { level: item.level } : {})
    }));
  }

  private getClassSpellIds(personaje: CharacterMongo, classId: string): string[] {
    const ids = personaje.spells?.[classId];
    return Array.isArray(ids) ? ids : [];
  }

  private classLevelByClassId(personaje: CharacterMongo): Map<string, number> {
    return new Map(
      (personaje.classes ?? []).map(entry => [entry.class, entry.level])
    );
  }

  private buildPrivilegeRulesMap(
    traits: TraitApi[],
    instances: CharacterSpellPrivilegeMongo[]
  ): Map<string, SpellPrivilegeRule[]> {
    const map = new Map<string, SpellPrivilegeRule[]>()
    const traitsById = new Map(traits.map(trait => [trait.id, trait]))

    for (const trait of traits) {
      if (trait.spellPrivileges?.length) {
        map.set(trait.id, trait.spellPrivileges)
      }
    }

    for (const instance of instances) {
      const trait = traitsById.get(instance.traitId)
      if (trait?.spellPrivileges?.length) {
        map.set(instance.traitId, trait.spellPrivileges)
      }
    }

    return map
  }

  private mergeClassSpellIds(
    personaje: CharacterMongo,
    classId: string,
    newIds: string[]
  ): Record<string, string[]> | undefined {
    if (!newIds.length) return undefined;

    return this.setClassSpellIds(
      personaje,
      classId,
      [...this.getClassSpellIds(personaje, classId), ...newIds]
    );
  }

  private setClassSpellIds(
    personaje: CharacterMongo,
    classId: string,
    ids: string[]
  ): Record<string, string[]> {
    const current = personaje.spells && typeof personaje.spells === "object"
      ? { ...personaje.spells }
      : {};

    current[classId] = ids;
    return current;
  }

  private async pendingClassCatalogChoices(
    personaje: CharacterMongo,
    classId: string,
    classLevel: number,
    enteringTraits: TraitApi[]
  ): Promise<PendingCatalogChoice[]> {
    const [classRules] = await this.characterClassRepository.getRulesByIds([classId]);
    const subclasses = await this.getAssignedSubclassesForClass(personaje.subclasses ?? [], classId);
    const grantedIds = collectClassGrantedTraitIds(
      classRules?.levels ?? [],
      subclasses.flatMap(item => item.levels),
      classLevel
    );
    const visible = new Set([
      ...(personaje.traits ?? []),
      ...enteringTraits.map(trait => trait.id).filter((id): id is string => Boolean(id))
    ]);
    const ids = [...grantedIds].filter(id => visible.has(id));
    if (!ids.length) return [];

    const traits = await this.traitRepository.getTraitsByIndexes(ids);
    const expanded = await this.expandTraitsForSystems(traits, personaje.systems);
    const pending = listPendingCatalogChoices({
      existing: personaje.traitChoices,
      classLevel,
      grantedTraits: expanded
    });
    if (!pending.some(choice => choice.language)) return pending;

    const languageOptions = await this.languagesForSystems(personaje.systems);
    return pending.map(choice =>
      choice.language ? { ...choice, languageOptions } : choice
    );
  }

  private levelSkillProficiencyGrants(
    characterClass: CharacterClassApi | null | undefined,
    subclass: { levels: Array<{ level: number; skillProficiencyChoices?: LevelSkillProficiencyChoice }> } | undefined,
    level: number
  ): LevelSkillProficiencyChoice[] {
    const classGrant = characterClass?.levels?.find(row => row.level === level)?.skillProficiencyChoices ?? undefined;
    const subclassGrant = subclass?.levels.find(row => row.level === level)?.skillProficiencyChoices;
    return mergeSkillProficiencyChoices(classGrant, subclassGrant);
  }

  private async pendingClassSkillProficiencyChoices(
    personaje: CharacterMongo,
    grants: LevelSkillProficiencyChoice[] | undefined,
    proficientIds: Iterable<string>
  ): Promise<PendingSkillProficiencyChoice[]> {
    const ownedTraits = await this.traitRepository.getTraitsByIndexes(personaje.traits ?? []);
    const resolvedProficient = collectProficientSkillIds(
      [...proficientIds],
      ownedTraits
    );
    const drafts = pendingLevelSkillProficiencyChoices({
      grants,
      proficientIds: resolvedProficient,
      overlays: personaje.skillProficiencyOverlays
    });
    if (!drafts.length) return [];

    const skillIds = [...new Set(drafts.flatMap(draft => draft.optionIds))];
    const skills = await this.skillService.getSkillsByIds(skillIds);
    const byId = new Map(skills.map(skill => [skill.id, skill]));

    return drafts.map(draft => ({
      add: draft.add,
      value: draft.value,
      options: draft.optionIds.map(id => byId.get(id)).filter((skill): skill is NonNullable<typeof skill> => Boolean(skill))
    }));
  }

  private async applyGrantedCatalogChoices(input: {
    existing?: TraitChoices | null;
    incoming?: TraitChoices | null;
    classLevel: number;
    systems?: string[];
    grantedTraits: TraitApi[];
  }): Promise<TraitChoices> {
    const grantedTraits = await this.expandTraitsForSystems(input.grantedTraits, input.systems);
    const needsLanguages = grantedTraits.some(trait =>
      trait.catalogChoices?.some(choice => Boolean(choice.language))
    );
    const allowedLanguageIds = needsLanguages
      ? await this.languageIdsForSystems(input.systems)
      : new Set<string>();
    const racesById = await this.raceRefsForSystems(this.collectRaceIds(input.incoming), input.systems);
    const result = applyCatalogTraitChoices({
      existing: input.existing,
      incoming: input.incoming,
      classLevel: input.classLevel,
      grantedTraits,
      allowedLanguageIds,
      racesById
    });
    if ("error" in result) {
      throw new ValidationError(result.error);
    }
    return result.traitChoices;
  }

  private collectRaceIds(choices?: TraitChoices | null): string[] {
    const ids = new Set<string>();
    if (!choices || typeof choices !== "object") return [];

    for (const traitChoices of Object.values(choices)) {
      if (!traitChoices || typeof traitChoices !== "object") continue;
      for (const values of Object.values(traitChoices)) {
        if (!Array.isArray(values)) continue;
        for (const value of values) {
          if (!value || typeof value !== "object" || !("raceIds" in value) || !Array.isArray(value.raceIds)) continue;
          for (const raceId of value.raceIds) {
            if (typeof raceId === "string" && raceId.length > 0) ids.add(raceId);
          }
        }
      }
    }

    return [...ids];
  }

  private async expandTraitsForSystems(
    traits: TraitApi[],
    systems?: string[],
    chosenTypeIds: string[] = [],
    chosenDamageTypeIds: string[] = []
  ): Promise<TraitApi[]> {
    const needsCreatureTypes = traits.some(trait =>
      trait.catalogChoices?.some(choice => choice.source === "creatureTypes")
    );
    const needsDamageTypes = traits.some(trait =>
      trait.damageChoices?.some(choice => choice.source === "damageTypes")
    );
    if (!needsCreatureTypes && !needsDamageTypes) return traits;

    const expanded = await this.systemRepository.getSystemsAndAncestors(systems ?? []);
    let next = traits;

    if (needsCreatureTypes) {
      const [creatureTypes, raceRefs, chosenTypes] = await Promise.all([
        this.creatureTypeRepository.getBySystems(expanded),
        this.raceRepository.getRaceRefsBySystems(expanded),
        chosenTypeIds.length
          ? this.creatureTypeRepository.getByIds(chosenTypeIds)
          : Promise.resolve([] as CreatureTypeApi[])
      ]);

      const byId = new Map<string, CreatureTypeApi>();
      for (const creatureType of creatureTypes) {
        if (creatureType.deletedAt) continue;
        byId.set(creatureType.id, creatureType);
      }
      for (const creatureType of chosenTypes) {
        byId.set(creatureType.id, creatureType);
      }

      const missing = chosenTypeIds.filter(id => !byId.has(id));
      if (missing.length) {
        const recovered = await Promise.all(missing.map(id => this.creatureTypeRepository.getById(id)));
        for (const creatureType of recovered) {
          if (creatureType) byId.set(creatureType.id, creatureType);
        }
      }

      next = expandCatalogChoices(next, [...byId.values()], raceRefs);
    }

    if (needsDamageTypes) {
      const [damages, chosenDamages] = await Promise.all([
        this.damageRepository.getBySystems(expanded),
        chosenDamageTypeIds.length
          ? this.damageRepository.getByIds(chosenDamageTypeIds, true)
          : Promise.resolve([] as Damage[])
      ]);

      const byId = new Map<string, Damage>();
      for (const damage of damages) {
        if (damage.id && !damage.deletedAt) byId.set(damage.id, damage);
      }
      for (const damage of chosenDamages) {
        if (damage.id) byId.set(damage.id, damage);
      }

      const missing = chosenDamageTypeIds.filter(id => !byId.has(id));
      if (missing.length) {
        const recovered = await Promise.all(missing.map(id => this.damageRepository.getById(id)));
        for (const damage of recovered) {
          if (damage?.id) byId.set(damage.id, damage);
        }
      }

      next = expandDamageChoices(next, [...byId.values()]);
    }

    return next;
  }

  private chosenDamageTypeIds(traits: TraitApi[], choices?: TraitChoices | null): string[] {
    const ids = new Set<string>();
    for (const trait of traits) {
      if (!trait.id) continue;
      const sourced = trait.damageChoices?.filter(choice => choice.source === "damageTypes") ?? [];
      if (!sourced.length) continue;
      const stored = choices?.[trait.id];
      if (!stored) continue;
      for (const choice of sourced) {
        for (const value of stored[choice.key] ?? []) {
          if (typeof value === "string" && value) ids.add(value);
        }
      }
    }
    return [...ids];
  }

  private chosenCreatureTypeIds(traits: TraitApi[], choices?: TraitChoices | null): string[] {
    const ids = new Set<string>();
    for (const trait of traits) {
      if (!trait.id) continue;
      const sourced = trait.catalogChoices?.filter(choice => choice.source === "creatureTypes") ?? [];
      if (!sourced.length) continue;
      const stored = choices?.[trait.id];
      if (!stored) continue;
      for (const choice of sourced) {
        for (const value of stored[choice.key] ?? []) {
          const name = choiceEntryName(value);
          if (name) ids.add(name);
        }
      }
    }
    return [...ids];
  }

  private async raceRefsForSystems(ids: string[], systems?: string[]): Promise<Map<string, RaceRef>> {
    if (!ids.length) return new Map();
    const [refs, allowed] = await Promise.all([
      this.raceRepository.getRaceRefsByIds(ids),
      this.systemRepository.getSystemsAndAncestors(systems ?? [])
    ]);
    const allowedRulesets = new Set(allowed);
    return new Map(
      refs
        .filter(race => allowedRulesets.has(race.ruleset))
        .map(race => [race.id, race])
    );
  }

  private async raceRefsForLabels(choices?: TraitChoices | null): Promise<Map<string, RaceRef>> {
    const ids = this.collectRaceIds(choices);
    if (!ids.length) return new Map();
    const refs = await this.raceRepository.getRaceRefsByIds(ids);
    return new Map(refs.map(race => [race.id, race]));
  }

  private async languagesForSystems(systems: string[] | undefined) {
    const expanded = await this.systemRepository.getSystemsAndAncestors(systems ?? []);
    return this.languageRepository.getBySystems(expanded);
  }

  private async languageIdsForSystems(systems: string[] | undefined): Promise<Set<string>> {
    const languages = await this.languagesForSystems(systems);
    return new Set(languages.map(language => language.id).filter((id): id is string => Boolean(id)));
  }

  private async resolveLevelUpTargetClass(
    personaje: CharacterMongo,
    classId: string
  ): Promise<{ catalog: CharacterClassApi; currentEntry?: CharacterMongo["classes"][number]; isNewClass: boolean }> {
    const catalog = await this.characterClassRepository.getById(classId);
    if (!catalog || catalog.deletedAt) {
      throw new NotFoundError("Clase no encontrada");
    }

    const expanded = await this.systemRepository.getSystemsAndAncestors(personaje.systems ?? []);
    if (!expanded.includes(catalog.ruleset)) {
      throw new ValidationError("La clase no pertenece a los sistemas del personaje");
    }

    const currentEntry = personaje.classes?.find(clas => clas.class === classId);
    return { catalog, currentEntry, isNewClass: !currentEntry };
  }

  private levelUpHitDie(
    catalog: CharacterClassApi,
    currentEntry: CharacterMongo["classes"][number] | undefined,
    isNewClass: boolean
  ): number {
    if (isNewClass) return catalog.hit_die ?? 8;
    const stored = Number(currentEntry?.hitDie);
    if (Number.isFinite(stored) && stored > 0) return stored;
    return catalog.hit_die ?? 8;
  }

  private async levelUpRequirementsMet(
    personaje: CharacterMongo,
    catalog: CharacterClassApi,
    isNewClass: boolean
  ): Promise<boolean | undefined> {
    const ownedCount = personaje.classes?.length ?? 0;
    if (!shouldEnforceMulticlassRequirements(ownedCount, isNewClass)) return undefined;

    const ownedIds = (personaje.classes ?? []).map(item => item.class);
    const ids = isNewClass ? [...ownedIds, catalog.id] : ownedIds;
    const catalogs = await Promise.all(
      ids.map(id => id === catalog.id ? Promise.resolve(catalog) : this.characterClassRepository.getById(id))
    );

    return characterMeetsAllClassRequirements(
      catalogs.map(item => item?.multiclass),
      personaje.attributes ?? []
    );
  }

  private buildLevelUpDip(
    personaje: CharacterMongo,
    catalog: CharacterClassApi,
    requirementsMet: boolean,
    compact?: boolean
  ): LevelUpDipData {
    const granted = catalog.multiclass?.proficiencies ?? [];
    const skill_choices = excludeOwnedChoiceOptions(
      catalog.multiclass?.skill_choices,
      personaje.skills ?? []
    );
    const proficiencies_choices = (catalog.multiclass?.proficiencies_choices ?? [])
      .map(choice => excludeOwnedChoiceOptions(choice, personaje.proficiencies ?? []))
      .filter((choice): choice is NonNullable<typeof choice> => Boolean(choice));

    return {
      requirements: catalog.multiclass?.requirements,
      requirementsMet,
      proficiencies: compact
        ? granted.map(item => ({ id: item.id, name: item.name }))
        : granted,
      skillChoices: skill_choices,
      ...(proficiencies_choices.length ? { proficiencyChoices: proficiencies_choices } : {})
    } as LevelUpDipData;
  }

  private validateDipPicks(
    personaje: CharacterMongo,
    catalog: CharacterClassApi,
    proficiencyPicks: string[][] | undefined
  ): { error: string } | { proficiencyIds: string[] } {
    const proficiencyChoices = (catalog.multiclass?.proficiencies_choices ?? [])
      .map(choice => excludeOwnedChoiceOptions(choice, personaje.proficiencies ?? []))
      .filter((choice): choice is NonNullable<typeof choice> => Boolean(choice));
    const proficiencyResult = validateChoiceListPicks({
      choices: proficiencyChoices,
      picks: proficiencyPicks,
      ownedIds: personaje.proficiencies ?? [],
      field: "proficiencyPicks"
    });
    if ("error" in proficiencyResult) return proficiencyResult;

    return { proficiencyIds: proficiencyResult.ids };
  }

  private async resolveLevelUpClassData(
    personaje: CharacterMongo,
    classId: string,
    nextLevel: number,
    subclassIds?: string[],
    catalog?: CharacterClassApi | null,
    compact?: boolean
  ): Promise<{
    hit_die: number;
    spell_choices?: ChoiceApi<SpellApi | SpellRef>[];
    spell_changes?: LevelUpSpellChanges | { choose: number; from: SpellRef[]; to: ChoiceApi<SpellRef> };
    traits: TraitApi[];
    traits_data: TraitDataMongo;
    subclassChoice?: SubclassChoiceMenuApi | null;
    ability_score: boolean;
    abilityScoreAlternativeGroupId?: string;
    skill_choices?: ChoiceApi<SkillApi>;
    skillProficiencyChoices?: LevelSkillProficiencyChoice[];
    optionChoices?: OptionChoiceMongo[];
  }> {
    const assignedSubclassIds = subclassIds ?? personaje.subclasses ?? [];
    const [dataLevel, loadedClass, assignedSubclasses] = await Promise.all([
      this.characterClassRepository.dataLevelUp(
        classId,
        nextLevel,
        assignedSubclassIds,
        personaje.systems ?? [],
        {
          includeSpellList: false,
          ...(compact ? { spellChoiceMode: "refs" as const, subclassMenuMode: "summaries" as const } : {})
        }
      ),
      catalog ? Promise.resolve(catalog) : this.characterClassRepository.getById(classId),
      this.getAssignedSubclassesForClass(assignedSubclassIds, classId)
    ]);
    const clase = catalog ?? loadedClass;
    const expandedSpells = await this.expandedSpellsFromRules(assignedSubclasses, compact);
    const knownSpellIds = this.getClassSpellIds(personaje, classId);
    const ownedSpellIds = [...knownSpellIds, ...getExtraSpellIds(personaje.extraSpells, classId)];
    const extraSpellIdsForClass = getExtraSpellIds(personaje.extraSpells, classId);
    const cantripChoicesRaw = await this.buildCantripSpellChoices(
      classId,
      clase?.levels ?? [],
      nextLevel,
      knownSpellIds,
      dataLevel?.spell_choices,
      expandedSpells,
      compact
    );
    const cantripChoices = cantripChoicesRaw
      ? excludeKnownSpellOptions(cantripChoicesRaw, extraSpellIdsForClass)
      : undefined;
    const knownSpellChoices = await this.buildKnownSpellChoices(
      classId,
      clase?.levels ?? [],
      nextLevel,
      ownedSpellIds,
      dataLevel?.spell_choices,
      expandedSpells,
      compact
    );
    const extraChoices = dataLevel?.spell_choices?.length
      ? excludeKnownSpellOptions(dataLevel.spell_choices as ChoiceApi<SpellApi | SpellRef>[], ownedSpellIds)
      : dataLevel?.spell_choices as ChoiceApi<SpellApi | SpellRef>[] | undefined;
    const synthesized = [...(cantripChoices ?? []), ...(knownSpellChoices ?? [])];
    const spell_choices = synthesized.length
      ? [...synthesized, ...(extraChoices ?? [])]
      : extraChoices;
    const spell_changes = await this.buildSpellReplacementMenu(
      classId,
      clase,
      nextLevel,
      knownSpellIds,
      expandedSpells,
      compact
    );

    const ability_score = Boolean(dataLevel?.ability_score);

    return {
      hit_die: dataLevel?.hit_die ?? 8,
      spell_choices,
      ...(spell_changes ? { spell_changes } : {}),
      traits: dataLevel?.traits ?? [],
      traits_data: dataLevel?.traits_data ?? {},
      subclassChoice: dataLevel?.subclassChoice ?? null,
      ability_score,
      ...(dataLevel?.abilityScoreAlternativeGroupId
        ? { abilityScoreAlternativeGroupId: dataLevel.abilityScoreAlternativeGroupId }
        : {}),
      skill_choices: dataLevel?.skill_choices,
      skillProficiencyChoices: dataLevel?.skillProficiencyChoices,
      optionChoices: dataLevel?.optionChoices,
    };
  }

  private characterSpellIds(personaje: CharacterMongo): string[] {
    const known = Object.values(personaje.spells ?? {}).flat();
    const extra = Object.values(personaje.extraSpells ?? {}).flat();
    return [...new Set([...known, ...extra])];
  }

  private classLevelsMap(personaje: CharacterMongo, classId: string, nextLevel: number): Record<string, number> {
    const levels: Record<string, number> = {};
    for (const entry of personaje.classes ?? []) {
      levels[entry.class] = entry.class === classId ? nextLevel : entry.level;
    }
    if (levels[classId] === undefined) {
      levels[classId] = nextLevel;
    }
    return levels;
  }

  private prerequisiteContext(
    personaje: CharacterMongo,
    classId: string,
    nextLevel: number,
    characterLevel: number,
    extraTraitIds: Iterable<string> = []
  ): PrerequisiteContext {
    return {
      grantingClassId: classId,
      classLevels: this.classLevelsMap(personaje, classId, nextLevel),
      characterLevel,
      traitIds: [...new Set([...(personaje.traits ?? []), ...extraTraitIds])],
      spellIds: this.characterSpellIds(personaje),
      attributes: personaje.attributes ?? []
    };
  }

  private mergeLevelOptionChoiceConfigs(
    levelChoices: OptionChoiceMongo[] | undefined,
    classReplacements: CharacterClassApi["optionReplacements"],
    subclasses: Array<{ optionReplacements?: SubclassRulesRef["optionReplacements"] }>,
    selections: CharacterOptionSelection[],
    classId: string
  ): OptionChoiceMongo[] {
    return mergeOptionChoices(
      levelChoices,
      optionReplacementsToChoices(classReplacements, selections, classId),
      optionReplacementsToChoices(
        subclasses.flatMap(item => item.optionReplacements ?? []),
        selections,
        classId
      )
    );
  }

  private async loadOptionChoiceCatalog(
    systems: string[],
    groupIds: string[]
  ): Promise<{ options: GroupOptionApi[]; groupNames: Record<string, string> }> {
    if (!groupIds.length) {
      return { options: [], groupNames: {} };
    }

    const [options, groups] = await Promise.all([
      this.groupOptionRepository.getByGroupIds(groupIds, systems),
      this.optionGroupRepository.getByIds(groupIds)
    ]);

    return {
      options,
      groupNames: Object.fromEntries(groups.map(group => [group.id, group.name]))
    };
  }

  private pendingLevelOptionChoices(
    personaje: CharacterMongo,
    configs: OptionChoiceMongo[] | undefined,
    catalog: { options: GroupOptionApi[]; groupNames: Record<string, string> },
    context: PrerequisiteContext
  ): PendingOptionChoice[] {
    if (!configs?.length) return [];

    return buildPendingOptionChoices({
      configs,
      options: catalog.options,
      selections: personaje.optionSelections ?? [],
      context,
      groupNames: catalog.groupNames
    });
  }

  private async applyLevelUpOptionPicks(params: {
    personaje: CharacterMongo;
    classId: string;
    nextLevel: number;
    characterLevel: number;
    extraTraitIds: Iterable<string>;
    configs: OptionChoiceMongo[] | undefined;
    picks: TypeLevelUp["optionPicks"];
  }): Promise<{ error: string } | {
    selections: CharacterOptionSelection[];
    addedTraitIds: string[];
    removedTraitIds: string[];
  }> {
    const optionGroupIds = [...new Set((params.configs ?? []).map(config => config.groupId).filter(Boolean))];
    const options = optionGroupIds.length
      ? await this.groupOptionRepository.getByGroupIds(optionGroupIds, params.personaje.systems ?? [])
      : [];

    return validateLevelUpOptionPicks({
      configs: params.configs,
      options: options.map(option => ({
        id: option.id,
        groupId: option.groupId,
        traitId: option.traitId,
        prerequisites: option.prerequisites,
        repeatable: option.repeatable
      })),
      selections: params.personaje.optionSelections ?? [],
      picks: params.picks,
      context: this.prerequisiteContext(
        params.personaje,
        params.classId,
        params.nextLevel,
        params.characterLevel
      ),
      extraTraitIds: params.extraTraitIds,
      classId: params.classId,
      level: params.nextLevel
    });
  }

  private async formatOptionSelections(
    selections: CharacterOptionSelection[]
  ): Promise<CharacterOptionSelectionApi[]> {
    if (!selections.length) return [];

    const [options, groups] = await Promise.all([
      this.groupOptionRepository.getByIds(selections.map(selection => selection.optionId)),
      this.optionGroupRepository.getByIds(selections.map(selection => selection.groupId))
    ]);
    const optionById = new Map(options.map(option => [option.id, option]));
    const groupById = new Map(groups.map(group => [group.id, group]));

    return selections.map(selection => ({
      ...selection,
      groupName: groupById.get(selection.groupId)?.name,
      trait: optionById.get(selection.optionId)?.trait
    }));
  }

  private async withRaceLevel(
    personaje: CharacterMongo,
    classTraits: TraitApi[],
    classTraitsData: TraitDataMongo,
    characterLevel: number,
    raceRows?: Map<number, RaceLevelMongo | undefined>
  ): Promise<{ traits: TraitApi[]; traits_data: TraitDataMongo }> {
    if (!personaje.raceId) {
      return mergeClassAndRaceLevelUp(classTraits, classTraitsData, [], undefined);
    }

    const raceLevel = raceRows
      ? raceRows.get(characterLevel)
      : await this.raceRepository.getLevelUpData(personaje.raceId, characterLevel);

    return mergeClassAndRaceLevelUp(classTraits, classTraitsData, [], raceLevel?.traits_data);
  }

  private async translateLevelUpTraits(
    personaje: CharacterMongo,
    traits: TraitApi[],
    traitsData: TraitDataMongo,
    characterLevel: number,
    proficiencyBonus: number,
    extraChangedIds: string[] = [],
    raceRows?: Map<number, RaceLevelMongo | undefined>,
    rulesConfig?: SystemRulesConfig
  ): Promise<TraitApi[]> {
    const changedIds = [
      ...await this.raceChangedTraitIds(personaje, characterLevel, raceRows),
      ...extraChangedIds
    ];
    const ids = levelUpTraitIds(traits, changedIds);
    if (!ids.length) return [];

    const translated = orderTraitsByIds(
      await this.traitRepository.getTraitsByIndexes(ids, traitsData),
      ids
    );
    const sourceIds = damageChoiceSourceIdsToLoad(translated);
    const sources = sourceIds.length
      ? await this.traitRepository.getTraitsByIndexes(sourceIds, traitsData)
      : [];
    const pool = [...translated, ...sources];
    const expanded = await this.expandTraitsForSystems(
      pool,
      personaje.systems,
      this.chosenCreatureTypeIds(pool, personaje.traitChoices),
      this.chosenDamageTypeIds(pool, personaje.traitChoices)
    );
    const visibleIds = new Set(ids);
    const visible = orderTraitsByIds(
      expanded.filter(trait => trait.id && visibleIds.has(trait.id)),
      ids
    );
    const extraSources = expanded.filter(trait => trait.id && !visibleIds.has(trait.id));
    const attributes = await this.formatSheetAttributes(personaje, undefined, undefined, rulesConfig);
    const raceRefs = await this.raceRefsForLabels(personaje.traitChoices);

    return closeLevelUpTraitText(
      visible,
      extraSources,
      personaje.traitChoices,
      raceRefs,
      attributes,
      proficiencyBonus
    );
  }

  private async raceChangedTraitIds(
    personaje: CharacterMongo,
    characterLevel: number,
    raceRows?: Map<number, RaceLevelMongo | undefined>
  ): Promise<string[]> {
    if (!personaje.raceId) return [];

    const rows = raceRows ?? await this.raceRepository.getLevelUpDataByLevels(
      personaje.raceId,
      [characterLevel, characterLevel - 1]
    );
    return traitIdsWithChangedData(
      rows.get(characterLevel)?.traits_data,
      rows.get(characterLevel - 1)?.traits_data
    );
  }

  private async catalogChangedTraitIds(
    classId: string,
    classLevel: number,
    subclassIds: string[],
    catalog?: CharacterClassApi | null
  ): Promise<string[]> {
    const [classDoc, subclasses] = await Promise.all([
      catalog ? Promise.resolve(catalog) : this.characterClassRepository.getById(classId),
      this.getAssignedSubclassesForClass(subclassIds, classId)
    ]);
    const sources = [
      classDoc?.levels ?? [],
      ...subclasses.map(item => item.levels)
    ];
    return traitIdsWithChangedData(
      mergedTraitsDataAtLevel(sources, classLevel),
      mergedTraitsDataAtLevel(sources, classLevel - 1)
    );
  }

  private async resolveLevelUpSubclassIds(
    personaje: CharacterMongo,
    classId: string,
    nextLevel: number,
    subclassId?: string
  ): Promise<string[]> {
    const assigned = await this.getAssignedSubclassesForClass(personaje.subclasses ?? [], classId);
    const classDoc = await this.characterClassRepository.getById(classId);
    const choiceLevel = classDoc?.subclassChoice?.level;
    const needsSubclass = Boolean(choiceLevel && nextLevel >= choiceLevel && assigned.length === 0);
    const currentIds = [...(personaje.subclasses ?? [])];

    if (needsSubclass) {
      if (!subclassId) {
        throw new ValidationError("Debe elegir una subclase al subir de nivel");
      }
      const picked = await this.assertSubclassAvailable(subclassId, classId, personaje.systems ?? []);
      return [...new Set([...currentIds, picked.id])];
    }

    if (subclassId) {
      if (assigned.length && !assigned.some(item => item.id === subclassId)) {
        throw new ValidationError("El personaje ya tiene una subclase para esta clase");
      }
      const picked = await this.assertSubclassAvailable(subclassId, classId, personaje.systems ?? []);
      return [...new Set([...currentIds, picked.id])];
    }

    return currentIds;
  }

  private async getAssignedSubclassesForClass(subclassIds: string[], classId: string): Promise<SubclassRulesRef[]> {
    if (!subclassIds.length) return [];
    const docs = await this.subclassRepository.getRulesByIds(subclassIds);
    return docs.filter(item => item.classId === classId);
  }

  private async expandedSpellsFromRules(
    subclasses: SubclassRulesRef[],
    compact?: boolean
  ): Promise<Array<SpellApi | SpellRef>> {
    const ids = [...new Set(subclasses.flatMap(item => item.expandedSpells))];
    if (!ids.length) return [];
    return compact
      ? this.spellRepository.getSpellRefsByIndexes(ids)
      : this.spellRepository.getSpellsByIndexes(ids);
  }

  private async extraClassSpellIds(personaje: CharacterMongo, classId: string): Promise<string[]> {
    const subclasses = await this.getAssignedSubclassesForClass(personaje.subclasses ?? [], classId);
    return subclasses.flatMap(item => item.expandedSpells);
  }

  private async assertSubclassAvailable(
    subclassId: string,
    classId: string,
    systems: string[]
  ): Promise<SubclassApi> {
    const subclass = await this.subclassRepository.getById(subclassId);
    if (!subclass || subclass.deletedAt) {
      throw new NotFoundError("Subclase no encontrada");
    }
    if (subclass.classId !== classId) {
      throw new ValidationError("La subclase no pertenece a la clase del personaje");
    }
    const tree = await this.systemRepository.getSystemsAndAncestors(systems);
    if (!tree.includes(subclass.ruleset)) {
      throw new ValidationError("La subclase no está disponible en los sistemas del personaje");
    }
    return subclass;
  }

  private async applyWeaponBondUse(
    inventory: CharacterEquipmentMongo[],
    config: NonNullable<TraitApi["weaponBond"]>,
    equipmentId?: string
  ): Promise<CharacterEquipmentMongo[]> {
    const resolved = resolveWeaponBondUse(inventory);
    if (resolved.kind === "already-manifest") {
      throw new ValidationError("El arma vinculada ya está manifiesta");
    }

    if (resolved.kind === "manifest" && resolved.instanceId) {
      const manifested = applyManifestWeaponBond(inventory);
      if (!manifested.ok || !manifested.instanceId) {
        throw new ValidationError(manifested.ok ? "No hay un arma vinculada guardada" : manifested.message);
      }
      return manifested.inventory;
    }

    if (!equipmentId) {
      throw new ValidationError("Debe indicar la forma del arma vinculada");
    }
    const catalog = await this.equipmentRepository.getById(equipmentId);
    const formError = weaponBondFormRejection(config, catalog);
    if (!catalog || formError) {
      throw new ValidationError(formError ?? "La forma del arma vinculada debe ser un arma");
    }

    const instance = createInventoryInstance({
      equipmentId,
      quantity: 1,
      isMagic: config.magical ? true : catalog.isMagic === true,
      isBond: true,
      bondOrigin: "summoned",
      equipped: false
    });
    return applySummonWeaponBond(inventory, instance).inventory;
  }

  private async ensureUniqueEquipmentGranted(
    inventory: CharacterEquipmentMongo[],
    traits: TraitApi[]
  ): Promise<CharacterEquipmentMongo[]> {
    const equipmentId = ownedUniqueEquipmentGrant(traits);
    if (!equipmentId) return inventory;
    return this.materializeUniqueEquipmentGrant(inventory, equipmentId, applyGrantUniqueEquipment);
  }

  private async replaceUniqueEquipmentGrant(
    inventory: CharacterEquipmentMongo[],
    equipmentId: string
  ): Promise<CharacterEquipmentMongo[]> {
    return this.materializeUniqueEquipmentGrant(inventory, equipmentId, applyReplaceUniqueEquipment);
  }

  private async materializeUniqueEquipmentGrant(
    inventory: CharacterEquipmentMongo[],
    equipmentId: string,
    apply: (
      current: CharacterEquipmentMongo[],
      instance: CharacterEquipmentMongo
    ) => CharacterEquipmentMongo[]
  ): Promise<CharacterEquipmentMongo[]> {
    const catalog = await this.equipmentRepository.getById(equipmentId);
    if (!catalog) {
      throw new ValidationError("El objeto concedido no existe en el catálogo");
    }
    const instance = createInventoryInstance({
      equipmentId: catalog.id,
      quantity: 1,
      isMagic: catalog.isMagic === true,
      uniqueGranted: true
    });
    return apply(inventory, instance);
  }

  private async persistTraitStance(
    id: string,
    traitResources: CharacterTraitResource[],
    activeTraitIds: string[],
    traitChoices?: TraitChoices,
    extras?: { hpCurrent?: number; hitDiceSpent?: CharacterHitDiceSpent[]; spellSlotsSpent?: CharacterSpellSlotSpent[]; activeConditions?: CharacterActiveCondition[]; equipment?: CharacterEquipmentMongo[] }
  ): Promise<CharacterMongo> {
    const resultado = await CharacterModel.findByIdAndUpdate(
      id,
      {
        $set: {
          traitResources,
          activeTraitIds,
          ...(traitChoices !== undefined ? { traitChoices } : {}),
          ...(extras?.hpCurrent !== undefined ? { hpCurrent: extras.hpCurrent } : {}),
          ...(extras?.hitDiceSpent !== undefined ? { hitDiceSpent: extras.hitDiceSpent } : {}),
          ...(extras?.spellSlotsSpent !== undefined ? { spellSlotsSpent: extras.spellSlotsSpent } : {}),
          ...(extras?.activeConditions !== undefined ? { activeConditions: extras.activeConditions } : {}),
          ...(extras?.equipment !== undefined ? { equipment: extras.equipment } : {})
        }
      },
      { returnDocument: "after" }
    );
    if (!resultado) {
      throw new NotFoundError("Personaje no encontrado");
    }
    if (extras?.equipment !== undefined) {
      await this.refreshStoredAc(resultado);
    }
    return resultado;
  }

  private async persistActiveConditions(id: string, activeConditions: CharacterActiveCondition[]): Promise<CharacterStatePatch> {
    const updated = await CharacterModel.findByIdAndUpdate(
      id,
      { $set: { activeConditions } },
      { returnDocument: "after" }
    );
    if (!updated) {
      throw new NotFoundError("Personaje no encontrado");
    }
    return { activeConditions: await this.formatActiveConditionsApi(updated) };
  }

  private async requireAccessibleCharacter(id: string, userId: string): Promise<CharacterMongo> {
    const personaje = await CharacterModel.findById(id);
    if (!personaje) {
      throw new NotFoundError("Personaje no encontrado");
    }
    await this.assertCanAccessCharacter(personaje, userId);
    return personaje;
  }

  private async requireAvailableCondition(conditionId: string, systems: string[]): Promise<ConditionApi> {
    const condition = await this.conditionRepository.getById(conditionId);
    if (!condition || condition.deletedAt) {
      throw new NotFoundError("Estado no encontrado");
    }
    const tree = await this.systemRepository.getSystemsAndAncestors(systems);
    if (!tree.includes(condition.ruleset)) {
      throw new ValidationError("El estado no está disponible en los sistemas del personaje");
    }
    return condition;
  }

  private async loadExpandedTraits(personaje: CharacterMongo): Promise<TraitApi[]> {
    const loaded = await this.traitRepository.getTraitsByIndexes(personaje.traits ?? []);
    return this.expandTraitsForSystems(
      loaded,
      personaje.systems,
      this.chosenCreatureTypeIds(loaded, personaje.traitChoices),
      this.chosenDamageTypeIds(loaded, personaje.traitChoices)
    );
  }

  private async loadSpellSlotPools(personaje: CharacterMongo) {
    const sources = (await this.characterClassRepository.getSpellcastingSources?.(
      (personaje.classes ?? []).map((entry) => ({
        id: entry.class,
        level: entry.level
      }))
    )) ?? [];
    return slotPoolsFromSources(sources);
  }

  private async loadGrantingClasses(
    personaje: CharacterMongo,
    subclassById?: Map<string, SubclassRulesRef>,
    classRules?: Map<string, ClassRulesRef>
  ) {
    const classCatalogs = classRules
      ? [...classRules.values()]
      : await this.characterClassRepository.getRulesByIds(
        (personaje.classes ?? []).map(entry => entry.class)
      );
    const subclasses = subclassById
      ? [...subclassById.values()]
      : await this.subclassRepository.getRulesByIds(personaje.subclasses ?? []);
    return buildTraitGrantingClasses(
      personaje.classes ?? [],
      classCatalogs,
      subclasses
    );
  }

  private async loadGrantingClassLevels(
    personaje: CharacterMongo,
    subclassById?: Map<string, SubclassRulesRef>,
    classRules?: Map<string, ClassRulesRef>
  ): Promise<Map<string, number>> {
    const levels = new Map<string, number>();
    for (const [traitId, grant] of await this.loadGrantingClasses(personaje, subclassById, classRules)) {
      levels.set(traitId, grant.level);
    }
    return levels;
  }

  private async getSubclassRulesMapByIds(ids: string[]): Promise<Map<string, SubclassRulesRef>> {
    const uniqueIds = [...new Set(ids.filter(Boolean))];
    if (!uniqueIds.length) return new Map();
    const docs = await this.subclassRepository.getRulesByIds(uniqueIds);
    return new Map(docs.map(item => [item.id, item]));
  }

  private async getSubclassSummaryMapByIds(ids: string[]): Promise<Map<string, SubclassNameRef>> {
    const uniqueIds = [...new Set(ids.filter(Boolean))];
    if (!uniqueIds.length) return new Map();
    const docs = await this.subclassRepository.getSummariesByIds(uniqueIds);
    return new Map(docs.map(item => [item.id, item]));
  }

  private mapSubclassSummaries(ids: string[], byId: Map<string, SubclassNameRef>): CharacterSubclassApi[] {
    const summaries: CharacterSubclassApi[] = [];
    for (const id of ids) {
      const subclass = byId.get(id);
      if (subclass) {
        summaries.push({
          class: subclass.classId,
          name: subclass.name,
          id: subclass.id
        });
      }
    }
    return summaries;
  }

  private async hydrateSubclasses(
    ids: string[],
    subclassById?: Map<string, SubclassNameRef>
  ): Promise<CharacterSubclassApi[]> {
    if (!ids.length) return [];
    const byId = subclassById ?? await this.getSubclassSummaryMapByIds(ids);
    return this.mapSubclassSummaries(ids, byId);
  }

  private async buildCantripSpellChoices(
    classId: string,
    levels: { level: number; spellcasting?: { cantrips?: number } }[],
    targetLevel: number,
    knownSpellIds: string[],
    persistedChoices?: ChoiceApi<SpellApi | SpellRef>[],
    expandedSpells: Array<SpellApi | SpellRef> = [],
    compact?: boolean
  ): Promise<ChoiceApi<SpellApi | SpellRef>[] | undefined> {
    if (hasCantripSpellChoice(persistedChoices)) return undefined;

    const cap = resolveClassSpellSlotsForLevel(levels, targetLevel)?.cantrips;
    const knownSpells = knownSpellIds.length
      ? (compact
        ? await this.spellRepository.getSpellRefsByIndexes(knownSpellIds)
        : await this.spellRepository.getSpellsByIndexes(knownSpellIds))
      : [];
    const knownCantrips = knownSpells.filter(spell => spell.level === 0);
    const choose = remainingCantripPicks(cap, knownCantrips.length);
    if (choose <= 0) return undefined;

    const formatted = compact
      ? await this.spellRepository.formatSpellChoiceRefs([buildCantripSpellChoice(classId, choose)])
      : await this.spellRepository.formatSpellChoices([buildCantripSpellChoice(classId, choose)]);
    if (!formatted?.length) return undefined;

    const knownCantripIds = knownCantrips
      .map(spell => spell.id)
      .filter((id): id is string => Boolean(id));

    return excludeKnownSpellOptions(
      mergeExpandedSpellsIntoChoices(formatted, expandedSpells) ?? formatted,
      knownCantripIds
    );
  }

  private async buildKnownSpellChoices(
    classId: string,
    levels: { level: number; spellcasting?: { cantrips?: number; spellsLearned?: number; slots?: Record<string, number> } }[],
    targetLevel: number,
    knownSpellIds: string[],
    persistedChoices?: ChoiceApi<SpellApi | SpellRef>[],
    expandedSpells: Array<SpellApi | SpellRef> = [],
    compact?: boolean
  ): Promise<ChoiceApi<SpellApi | SpellRef>[] | undefined> {
    const synthesized = buildSynthesizedKnownSpellChoice(
      classId,
      levels,
      targetLevel,
      persistedChoices
    );
    if (!synthesized) return undefined;

    const formatted = compact
      ? await this.spellRepository.formatSpellChoiceRefs([synthesized])
      : await this.spellRepository.formatSpellChoices([synthesized]);
    if (!formatted?.length) return undefined;

    return excludeKnownSpellOptions(
      mergeExpandedSpellsIntoChoices(formatted, expandedSpells) ?? formatted,
      knownSpellIds
    );
  }

  private async buildSpellReplacementMenu(
    classId: string,
    clase: CharacterClassApi | null,
    nextLevel: number,
    knownSpellIds: string[],
    expandedSpells: Array<SpellApi | SpellRef> = [],
    compact?: boolean
  ): Promise<LevelUpSpellChanges | { choose: number; from: SpellRef[]; to: ChoiceApi<SpellRef> } | undefined> {
    const config = clase?.spellReplacement;
    if (!config) return undefined;

    const includeCantrips = Boolean(config.includeCantrips);
    const knownSpells = knownSpellIds.length
      ? (compact
        ? await this.spellRepository.getSpellRefsByIndexes(knownSpellIds)
        : await this.spellRepository.getSpellsByIndexes(knownSpellIds))
      : [];
    const knownInputs = knownSpells
      .filter((spell): spell is (SpellApi | SpellRef) & { id: string } => Boolean(spell.id))
      .map(spell => ({ id: spell.id, level: spell.level }));
    const eligible = eligibleSpellReplacementFrom(knownInputs, includeCantrips);
    if (!shouldOfferSpellReplacement({
      config,
      nextLevel,
      eligibleFromCount: eligible.length,
    })) {
      return undefined;
    }

    const toChoice = buildSpellReplacementToChoice(
      classId,
      config.count,
      castableSpellLevels(resolveSlotProgressionForLevel(clase?.levels ?? [], nextLevel)),
      includeCantrips
    );
    if (!toChoice) return undefined;

    const formatted = compact
      ? await this.spellRepository.formatSpellChoiceRefs([toChoice])
      : await this.spellRepository.formatSpellChoices([toChoice]);
    if (!formatted?.length) return undefined;

    const [to] = excludeKnownSpellOptions(
      mergeExpandedSpellsIntoChoices(formatted, expandedSpells) ?? formatted,
      knownSpellIds
    );
    if (!to?.options.length) return undefined;

    const eligibleIds = new Set(eligible.map(spell => spell.id));
    const from = knownSpells.filter(spell => spell.id && eligibleIds.has(spell.id));
    if (!from.length) return undefined;

    return {
      choose: config.count,
      from,
      to,
    } as LevelUpSpellChanges;
  }

  private async assertCanLearnClassCantrips(
    personaje: CharacterMongo,
    classId: string,
    newSpellIds: string[]
  ): Promise<void> {
    const clase = await this.characterClassRepository.getById(classId);
    if (!clase) return;

    const classLevel = personaje.classes?.find(clas => clas.class === classId)?.level ?? 1;
    const currentCap = resolveClassSpellSlotsForLevel(clase.levels ?? [], classLevel)?.cantrips;
    const nextCap = resolveClassSpellSlotsForLevel(clase.levels ?? [], classLevel + 1)?.cantrips;
    const caps = [currentCap, nextCap].filter((value): value is number => value !== undefined);
    if (!caps.length) return;

    const tope = Math.max(...caps);
    const existingIds = this.getClassSpellIds(personaje, classId);
    const existingSpells = existingIds.length
      ? await this.spellRepository.getSpellsByIndexes(existingIds)
      : [];
    const ownedCantripIds = new Set(
      existingSpells
        .filter(spell => spell.level === 0 && spell.id)
        .map(spell => spell.id as string)
    );
    const remaining = remainingCantripPicks(tope, ownedCantripIds.size);
    const incoming = newSpellIds.length
      ? await this.spellRepository.getSpellsByIndexes(newSpellIds)
      : [];
    const newCantrips = incoming.filter(
      spell => spell.level === 0 && spell.id && !ownedCantripIds.has(spell.id)
    );

    if (newCantrips.length > remaining) {
      throw new ValidationError(`No se pueden conocer más de ${tope} trucos de esta clase`);
    }
  }

  private async loadAccessibleCharacter(
    id: string,
    userId: string
  ): Promise<{ personaje: CharacterMongo; campaign: CampaignSummary | null }> {
    const personaje = await CharacterModel.findById(id).lean<CharacterMongo | null>();
    if (!personaje) {
      throw new NotFoundError("Personaje no encontrado");
    }
    const campaign = await this.assertCanAccessCharacter(personaje, userId);
    return { personaje, campaign };
  }

  private async assertCanAccessCharacter(
    personaje: CharacterMongo,
    userId: string
  ): Promise<CampaignSummary | null> {
    const campaign = personaje.campaign
      ? await this.campaignReader.getById(personaje.campaign)
      : null;

    if (!canAccessCharacter({
      ownerId: personaje.user,
      campaignMasterId: campaign?.master,
      userId,
    })) {
      throw new AppError('No tienes permiso para consultar este personaje', 403);
    }

    return campaign;
  }

  private toCharacterListItem(basic: CharacterBasic, includeCombatSeed: boolean): CharacterListItem {
    if (includeCombatSeed) return basic;
    const { attributes: _attributes, speed: _speed, systems: _systems, ...card } = basic;
    return card;
  }

  private storedAcOf(personaje: CharacterMongo): number | undefined {
    return storedAcNumber(personaje.ac)
      ?? storedAcNumber((personaje as CharacterMongo & { CA?: unknown }).CA);
  }

  private async persistStoredAc(personaje: CharacterMongo, ac: number): Promise<void> {
    if (!personaje._id) return;
    await CharacterModel.updateOne({ _id: personaje._id }, { $set: { ac } });
    personaje.ac = ac;
  }

  async refreshStoredAc(personaje: CharacterMongo): Promise<number> {
    const ac = await this.computeStoredAc(personaje);
    if (this.storedAcOf(personaje) !== ac) {
      await this.persistStoredAc(personaje, ac);
    }
    return ac;
  }

  private syncStoredAc(personaje: CharacterMongo, ac: number): void {
    if (this.storedAcOf(personaje) === ac) return;
    void this.persistStoredAc(personaje, ac).catch(error => {
      console.warn("No se pudo persistir ac del personaje", error);
    });
  }

  private async computeStoredAc(personaje: CharacterMongo): Promise<number> {
    const normalized = normalizeCharacterDocument(personaje);
    const [traits, equipment, rulesConfig] = await Promise.all([
      this.traitRepository.getArmorClassInputsByIds(normalized.traits ?? []),
      this.equipmentRepository.getArmorClassInputsByIds(
        this.toHydrationRows((normalized.equipment ?? []).filter(item => item.equipped && !item.holderId))
      ),
      this.systemRepository.getMergedRulesConfig(normalized.systems ?? [])
    ]);
    return listArmorClassFromRules({
      attributes: normalized.attributes ?? [],
      traits,
      equipment,
      rulesConfig
    }).ac;
  }

  async backfillMissingArmorClass(): Promise<{ scanned: number; modified: number }> {
    const cursor = CharacterModel.find({
      $or: [{ ac: { $exists: false } }, { ac: null }]
    })
      .select("_id attributes traits equipment systems ac CA")
      .lean()
      .cursor();

    const batch: CharacterMongo[] = [];
    let scanned = 0;
    let modified = 0;

    const flush = async () => {
      if (batch.length === 0) return;
      const ops = await Promise.all(batch.map(async doc => ({
        updateOne: {
          filter: { _id: doc._id },
          update: { $set: { ac: await this.computeStoredAc(doc) } }
        }
      })));
      const result = await CharacterModel.bulkWrite(ops, { ordered: false });
      modified += result.modifiedCount;
      batch.length = 0;
    };

    for await (const doc of cursor) {
      scanned += 1;
      batch.push(doc as CharacterMongo);
      if (batch.length >= 500) {
        await flush();
      }
    }
    await flush();
    return { scanned, modified };
  }

  private toTraitArmorClassInputs(traits: TraitApi[]): TraitArmorClassInput[] {
    return traits.map(trait => ({
      id: trait.id,
      ...(trait.acFormula ? { acFormula: trait.acFormula } : {}),
      ...(trait.suppressedByArmorTypeIds?.length
        ? { suppressedByArmorTypeIds: trait.suppressedByArmorTypeIds }
        : {}),
      ...(trait.bonuses ? { bonuses: trait.bonuses } : {}),
      ...(Array.isArray(trait.abilityScores) && trait.abilityScores.length
        ? { abilityScores: trait.abilityScores }
        : {})
    }));
  }

  private toArmorClassEquipmentInputs(
    equipment: Array<{
      equipped?: boolean;
      equipSlot?: string | EquipSlot | null;
      isMagic?: boolean;
      bonuses?: ArmorClassEquipmentInput["bonuses"];
      armor?: ArmorClassEquipmentInput["armor"];
    }>
  ): ArmorClassEquipmentInput[] {
    return equipment.filter(item => item.equipped).map(item => ({
      equipped: true,
      equipSlot: (item.equipSlot ?? null) as EquipSlot | null,
      isMagic: item.isMagic === true,
      ...(item.bonuses ? { bonuses: item.bonuses } : {}),
      ...(item.armor ? { armor: item.armor } : {})
    }));
  }

  private async formatBasicCharacters(
    personajes: CharacterMongo[],
    userName?: string,
    options?: { skipAttributeOverlay?: boolean }
  ): Promise<CharacterBasic[]> {
    const campaignIds = [...new Set(
      personajes
        .map((p) => p.campaign)
        .filter((id): id is string => Boolean(id))
    )];

    const getRulesConfig = createMergedRulesConfigMemo(
      (systemIds) => this.systemRepository.getMergedRulesConfig(systemIds)
    );
    const campaignMap = await this.campaignReader.getNamesByIds(campaignIds);
    const subclassById = await this.getSubclassSummaryMapByIds(
      personajes.flatMap((personaje) => personaje.subclasses ?? [])
    );
    const skipOverlay = options?.skipAttributeOverlay === true;
    const needLightIndexes = personajes.flatMap((personaje, index) =>
      !skipOverlay || this.storedAcOf(personaje) === undefined ? [index] : []
    );
    const needLight = needLightIndexes.map(index => personajes[index]);
    const equippedRowsByNeed = needLight.map(personaje =>
      this.toHydrationRows((personaje.equipment ?? []).filter(item => item.equipped && !item.holderId))
    );
    const allEquipped = equippedRowsByNeed.flat();
    const traitIds = [...new Set(needLight.flatMap(personaje => personaje.traits ?? []).filter(Boolean))];
    const [traitInputs, allEquipmentInputs] = needLight.length
      ? await Promise.all([
          this.traitRepository.getArmorClassInputsByIds(traitIds),
          allEquipped.length
            ? this.equipmentRepository.getArmorClassInputsByIds(allEquipped)
            : Promise.resolve([])
        ])
      : [[], [] as ArmorClassEquipmentInput[]];
    const traitsById = new Map(traitInputs.map(trait => [trait.id, trait]));
    let equipmentOffset = 0;
    const equipmentByNeed = equippedRowsByNeed.map(rows => {
      const slice = allEquipmentInputs.slice(equipmentOffset, equipmentOffset + rows.length);
      equipmentOffset += rows.length;
      return slice;
    });
    const lightByIndex = new Map<number, {
      traits: TraitArmorClassInput[];
      equipment: ArmorClassEquipmentInput[];
    }>();
    needLightIndexes.forEach((characterIndex, needIndex) => {
      const personaje = personajes[characterIndex];
      lightByIndex.set(characterIndex, {
        traits: (personaje.traits ?? [])
          .map(id => traitsById.get(id))
          .filter((trait): trait is TraitArmorClassInput => Boolean(trait)),
        equipment: equipmentByNeed[needIndex]
      });
    });

    return Promise.all(personajes.map((personaje, index) => {
      const campaignName = personaje.campaign
        ? campaignMap.get(personaje.campaign.toString())
        : undefined;
      const light = lightByIndex.get(index);
      return this.formatBasicCharacter(personaje, {
        userName,
        campaignName,
        subclassById,
        getRulesConfig,
        traitsForAc: light?.traits,
        equipmentForAc: light?.equipment,
        skipAttributeOverlay: skipOverlay,
      });
    }));
  }

  private async formatBasicCharacter(
    personaje: CharacterMongo,
    options?: {
      userName?: string;
      campaignName?: string;
      subclassById?: Map<string, SubclassNameRef>;
      getRulesConfig?: (systemIds: string[]) => Promise<SystemRulesConfig>;
      traitsForAc?: TraitArmorClassInput[];
      equipmentForAc?: ArmorClassEquipmentInput[];
      skipAttributeOverlay?: boolean;
    }
  ): Promise<CharacterBasic> {
    const userName = options?.userName;
    const campaignName = options?.campaignName;
    const subclassById = options?.subclassById;
    const getRulesConfig = options?.getRulesConfig
      ?? ((systemIds: string[]) => this.systemRepository.getMergedRulesConfig(systemIds));
    const traitsForAc = options?.traitsForAc;
    const equipmentForAc = options?.equipmentForAc;
    const skipAttributeOverlay = options?.skipAttributeOverlay === true;
    personaje = normalizeCharacterDocument(personaje);
    const level = personaje?.classes?.map((cl: any) => cl.level).reduce((acumulador: number, valorActual: number) => acumulador + valorActual, 0) ?? 0
    const user = userName ?? await this.userRepository.getUserName(personaje?.user ?? null)
    const stored = this.storedAcOf(personaje);
    const useStored = skipAttributeOverlay && stored !== undefined;
    let ac: number;
    let overlaidAttributes = personaje.attributes ?? [];
    const rulesConfig = await getRulesConfig(personaje.systems ?? []);

    if (useStored) {
      ac = stored;
    } else {
      const traits = traitsForAc
        ?? await this.traitRepository.getArmorClassInputsByIds(personaje.traits ?? []);
      const equipment = equipmentForAc
        ?? await this.equipmentRepository.getArmorClassInputsByIds(
          this.toHydrationRows((personaje.equipment ?? []).filter(item => item.equipped && !item.holderId))
        );
      const computed = listArmorClassFromRules({
        attributes: personaje.attributes ?? [],
        traits,
        equipment,
        rulesConfig
      });
      ac = computed.ac;
      overlaidAttributes = computed.attributes;
      this.syncStoredAc(personaje, ac);
    }

    let finalCampaignName = campaignName;
    if (finalCampaignName === undefined) {
      if (personaje?.campaign) {
        const campaign = await this.campaignReader.getById(personaje.campaign);
        finalCampaignName = campaign?.name ?? '';
      } else {
        finalCampaignName = '';
      }
    }

    const subclasses = await this.hydrateSubclasses(personaje.subclasses ?? [], subclassById);

    return {
      id: personaje?._id?.toString() ?? '',
      img: personaje.img,
      name: personaje.name,
      user,
      userId: personaje?.user ?? '',
      attributes: overlaidAttributes,
      systems: personaje.systems ?? [],
      speed: personaje.speed,
      race: personaje.race,
      campaign: finalCampaignName,
      classes: personaje?.classes?.map((clas: any) => { return { name: clas.name, level: clas.level } }) ?? [],
      subclasses,
      ac,
      hpMax: personaje.hpMax,
      hpCurrent: personaje.hpCurrent,
      xp: personaje.xp,
      xpMax: xpMaxForLevel(level, rulesConfig.xpProgression),
    }
  }

  private async calculateAc(
    personaje: CharacterMongo,
    traits: TraitApi[],
    options?: {
      equipment?: ArmorRulesEquipment[];
      attributes?: CharacterAttributeApi[];
      rulesConfig?: SystemRulesConfig;
    }
  ) {
    const equipment = options?.equipment
      ?? (await this.equipmentRepository.getCharacterEquipmentsByIds(
        this.toHydrationRows((personaje.equipment ?? []).filter(eq => eq.equipped && !eq.holderId))
      ))
      ?? [];

    const rulesConfig = options?.rulesConfig
      ?? await this.systemRepository.getMergedRulesConfig(personaje.systems ?? []);
    const attributes = options?.attributes
      ?? await this.formatSheetAttributes(personaje, traits, rulesConfig.defaultMaxAttributeValue, rulesConfig);
    let baseUnarmoredAc: number;
    if (rulesConfig.baseAcFormula) {
      baseUnarmoredAc = evaluateFormula(rulesConfig.baseAcFormula, attributes);
    } else {
      const dexAttr = attributes.find(a => a.key === "dex");
      const dexMod = dexAttr?.modifier ?? Math.floor(((dexAttr?.value ?? 10) / 2) - 5);
      baseUnarmoredAc = 10 + dexMod;
    }

    return {
      ac: computeArmorClass({
        equipment,
        traits,
        attributes,
        baseUnarmoredAc
      })
    };
  }

  private async formatCharacter(
    personaje: CharacterMongo,
    options?: GetCharacterOptions,
    campaignSummary?: CampaignSummary | null
  ): Promise<CharacterApi> {
    personaje = normalizeCharacterDocument(personaje);
    const view = options?.view ?? "full"
    const isCombat = view === "combat"
    const isSheet = view === "sheet"
    const useSpellRefs = isCombat || isSheet
    const level = personaje.classes.map(cl => cl.level).reduce((acumulador: number, valorActual: number) => acumulador + valorActual, 0)
    const classIds = (personaje.classes ?? []).map(entry => entry.class)
    const storedForms = normalizeCharacterForms(personaje?.forms)
    const activeFormIdEarly = typeof personaje.activeFormId === "string" ? personaje.activeFormId : null
    const overlayForm = storedForms.find(form =>
      form.id === activeFormIdEarly && formPurposeOverlaysCharacter(form.purpose)
    )
    const overlayCreatureIds = overlayForm ? [overlayForm.creatureId] : []
    const overlayCreatureIdSet = new Set(overlayCreatureIds)
    const summaryCreatureIds = [...new Set(
      storedForms
        .map(form => form.creatureId)
        .filter(id => Boolean(id) && !overlayCreatureIdSet.has(id))
    )]
    const storedCompanions = isCombat ? [] : normalizeCompanions(personaje.companions)
    const companionCreatureIds = [...new Set(
      storedCompanions.flatMap(companion => companion.creatureId ? [companion.creatureId] : [])
    )]
    const fullFormCreatureIds = isCombat || isSheet
      ? overlayCreatureIds
      : [...new Set(storedForms.map(form => form.creatureId))]
    const fullCreatureIds = [...new Set([...fullFormCreatureIds, ...companionCreatureIds])]
    const formSpellIds = [...new Set(storedForms.flatMap(form => form.spellId ? [form.spellId] : []))]
    const storedConditions = normalizeActiveConditions(personaje.activeConditions)
    const equippedRows = (personaje.equipment ?? []).filter(eq => eq.equipped && !eq.holderId)

    const [
      loadedTraits,
      optionSelections,
      baseProficiencies,
      equipment,
      acEquipment,
      spellcastingSourcesRaw,
      classRulesList,
      subclassRulesById,
      subclassSummariesById,
      rulesConfig,
      systemAttributes,
      money,
      formCreatures,
      formSummaries,
      conditionDocs,
      resolvedCampaign,
      ownerName
    ] = await Promise.all([
      this.traitRepository.getTraitsByIndexes(personaje?.traits, personaje?.traitsData),
      isCombat
        ? Promise.resolve([] as CharacterOptionSelectionApi[])
        : this.formatOptionSelections(personaje.optionSelections ?? []),
      this.proficiencyRepository.getProficienciesByIndices(personaje?.proficiencies ?? []),
      isCombat
        ? Promise.resolve([] as CharacterEquipmentApi[])
        : this.equipmentRepository.getCharacterEquipmentsByIds(this.toHydrationRows(personaje.equipment)),
      isCombat
        ? this.equipmentRepository.getArmorClassInputsByIds(equippedRows)
        : Promise.resolve([]),
      this.characterClassRepository.getSpellcastingSources?.(
        personaje.classes.map(clase => ({ id: clase.class, level: clase.level }))
      ) ?? Promise.resolve([]),
      this.characterClassRepository.getRulesByIds(classIds),
      this.getSubclassRulesMapByIds(personaje.subclasses ?? []),
      this.getSubclassSummaryMapByIds(personaje.subclasses ?? []),
      this.systemRepository.getMergedRulesConfig(personaje.systems ?? []),
      this.attributeService.getBySystems(personaje.systems ?? []),
      isCombat ? Promise.resolve([]) : this.normalizeAndFormatMoney(personaje),
      fullCreatureIds.length ? this.creatureRepository.getByIds(fullCreatureIds) : Promise.resolve([]),
      isSheet && summaryCreatureIds.length
        ? this.creatureRepository.getSummariesByIds(summaryCreatureIds)
        : Promise.resolve([] as CreatureFormSummary[]),
      storedConditions.length
        ? this.conditionRepository.getByIds(storedConditions.map(item => item.conditionId))
        : Promise.resolve([]),
      campaignSummary !== undefined
        ? Promise.resolve(campaignSummary)
        : (personaje.campaign ? this.campaignReader.getById(personaje.campaign) : Promise.resolve(null)),
      this.userRepository.getUserName(personaje.user ?? "")
    ])

    const expandedTraits = await this.expandTraitsForSystems(
      loadedTraits,
      personaje.systems,
      this.chosenCreatureTypeIds(loadedTraits, personaje.traitChoices),
      this.chosenDamageTypeIds(loadedTraits, personaje.traitChoices)
    )
    const raceRefs = await this.raceRefsForLabels(personaje.traitChoices)
    const resolvedSheet = resolveCharacterTraitChoices(expandedTraits, personaje.traitChoices, raceRefs)
    const traits = resolvedSheet.traits
    const skills = [...(personaje?.skills ?? [])]

    const idiomasId = personaje?.languages ?? []
    const proficiencies = [...baseProficiencies]
    const spellcastingSources = spellcastingSourcesRaw ?? []
    const classRulesById = new Map(classRulesList.map(item => [item.id, item]))
    const campaign = resolvedCampaign

    const resistances: Damage[] = []

    const conditionImmunities: { name: string, conditions: ConditionApi[] }[] = []

    let speed = personaje?.speed

    traits.forEach(trait => {
      if (trait?.skills) {
        skills.push(...trait?.skills)
      }

      if (trait.resistances) {
        resistances.push(...trait.resistances)
      }

      if (trait.condition_inmunities.length > 0) {
        conditionImmunities.push({
          name: trait.name,
          conditions: trait?.condition_inmunities ?? []
        })
      }

      if (trait?.proficiencies) {
        proficiencies.push(...trait?.proficiencies)
      }
    })

    const conditionalResistances = aggregateConditionalResistances(traits)
    const conditionalConditionImmunities = aggregateConditionalConditionImmunities(traits)

    for (const damage of resolvedSheet.grantedResistances) {
      if (damage.id && resistances.some(item => item.id === damage.id)) continue
      resistances.push(damage)
    }

    const indexSet = new Set(proficiencies.map(item => item.id));

    // Remove old desc filtering
    const proficienciesFiltrados = proficiencies;

    const proficienciesUnicos = [
      ...new Map(proficienciesFiltrados.map(item => [item.id, item])).values()
    ];

    const descendantProficiencies = isCombat
      ? []
      : await this.proficiencyRepository.getDescendantProficiencies(
        proficienciesUnicos.map(item => item.id)
      );
    const proficienciesForEquipmentCheck = [
      ...new Map(
        [...proficienciesUnicos, ...descendantProficiencies].map(item => [item.id, item])
      ).values(),
    ];

    const mergedLanguageIds = mergeTraitLanguageIds(
      {
        speaks: personaje.languages?.speaks ?? [],
        understands: personaje.languages?.understands ?? []
      },
      traits,
      catalogSpeakIds(traits, personaje.traitChoices)
    )
    const catalogLanguages = await this.languageRepository.getByIds(
      collectCatalogLanguageIds(mergedLanguageIds.understands, mergedLanguageIds.speaks)
    )
    const languageCatalog = languageApiById(catalogLanguages)
    const idiomas_understands = hydrateLanguageGrants(mergedLanguageIds.understands, languageCatalog)
    const idiomas_speaks = hydrateLanguageGrants(mergedLanguageIds.speaks, languageCatalog)

    const clases = personaje.classes

    const abilityScoreOverlay = applyTraitAbilityScores(personaje.attributes, traits)
    let apiAttributes: CharacterAttributeApi[] = await this.attributeService.formatAttributes(
      abilityScoreOverlay.attributes,
      personaje.systems ?? [],
      {
        globalModifierFormula: rulesConfig.globalModifierFormula,
        catalog: systemAttributes,
        ...(isCombat ? { omitDescription: true } : {})
      }
    )

    const attributesByKey = new Map(systemAttributes.map(attr => [attr.key, attr]))

    const spellcasting: SpellcastingLevel[] = spellcastingSources
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .map(source => {
        const ability = attributesByKey.get(source.abilityKey)
        if (!ability) return null
        return buildSpellcastingLevel(
          source,
          ability,
          apiAttributes,
          personaje.proficiencyBonus ?? 0
        )
      })
      .filter((item): item is SpellcastingLevel => item !== null)

    const omitSpells = options?.omitSpellHydration === true
    const {
      spells: updatedSpells,
      spellPrivileges: hydratedPrivileges,
      spellById
    } = omitSpells
      ? { spells: {} as CharacterApi["spells"], spellPrivileges: [] as CharacterSpellPrivilegeApi[], spellById: new Map<string, (SpellApi | SpellRef) & { id: string }>() }
      : await this.hydrateCharacterSpells(personaje, {
        traits,
        classRulesById,
        subclassRulesById,
        spellcasting,
        systemAttributes,
        attributesByKey,
        extraSpellIdsToLoad: formSpellIds,
        useSpellRefs,
        hydratePrivileges: !isCombat
      })

    const initiativeBonusFormula = rulesConfig.initiativeBonusFormula;
    let initiativeBonus = 0;
    if (initiativeBonusFormula) {
      initiativeBonus = evaluateFormula(initiativeBonusFormula, apiAttributes);
    } else {
      const dexAttr = apiAttributes.find(a => a.key === 'dex');
      initiativeBonus = dexAttr?.modifier ?? 0;
    }

    apiAttributes = withAttributeMax(
      apiAttributes,
      abilityScoreOverlay.maxByKey,
      rulesConfig.defaultMaxAttributeValue
    );

    const maxCarryingCapacity = characterCarryingCapacity(
      apiAttributes,
      rulesConfig.carryingCapacityFormula
    );

    const proficientIds = collectProficientSkillIds(personaje?.skills, traits ?? []);
    const skillsListEvaluated = await this.skillService.getCharacterSkills(
      skills,
      apiAttributes,
      personaje?.proficiencyBonus ?? 0,
      [
        ...collectTraitSkillProficiencies(traits),
        ...overlaysToSkillProficiencies(personaje.skillProficiencyOverlays)
      ],
      isCombat ? { omitDescription: true } : undefined
    );

    const skillsWithPassive = enrichSkillsWithPassive(
      rulesConfig.passiveSkillFormula,
      skillsListEvaluated,
      { attributes: apiAttributes }
    );

    const equipmentWithCombatBonuses = isCombat
      ? []
      : enrichEquipmentWithCombatBonuses({
        equipment: equipment ?? [],
        attributes: apiAttributes,
        proficiencies: proficienciesForEquipmentCheck,
        proficiencyBonus: personaje?.proficiencyBonus ?? 0,
        level,
        rules: rulesConfig,
        pactProficiency: ownedWeaponBond(traits ?? [])?.grantsProficiency === true,
      });
    const characterWornEquipment = equipmentWithCombatBonuses.filter(item => !item.holderId);
    const armorEquipment: ArmorRulesEquipment[] = isCombat
      ? acEquipment
      : characterWornEquipment;

    const { ac } = await this.calculateAc(personaje, traits, {
      equipment: armorEquipment,
      attributes: apiAttributes,
      rulesConfig
    });
    this.syncStoredAc(personaje, listArmorClassFromRules({
      attributes: personaje.attributes ?? [],
      traits: this.toTraitArmorClassInputs(traits),
      equipment: this.toArmorClassEquipmentInputs(armorEquipment),
      rulesConfig
    }).ac);
    const equippedArmor = collectEquippedArmorSuppression(armorEquipment);
    const speedWithTraits = applyTraitSpeed(speed, traits, equippedArmor);
    const bodyArmor = findBodyArmor(armorEquipment);
    const finalSpeed = applyArmorStrengthSpeedPenalty(speedWithTraits, bodyArmor, apiAttributes, traits);
    const stealthKeys = collectStealthDisadvantageSkillKeys(armorEquipment);
    const skillsWithArmor = skillsWithPassive.map(skill =>
      stealthKeys.includes(skill.key) ? { ...skill, disadvantage: true } : skill
    );
    const wearingArmorWithoutProficiency = isCombat
      ? false
      : isWearingArmorWithoutProficiency(characterWornEquipment);

    const formCreatureById = new Map(formCreatures.map(creature => [creature.id, creature]));
    const formSummaryById = new Map(formSummaries.map(creature => [creature.id, creature]));
    const formSpellById = spellById;
    const activeFormId = typeof personaje.activeFormId === "string" ? personaje.activeFormId : null;
    const forms: CharacterFormApi[] = storedForms.map(form => {
      const spell = form.spellId ? formSpellById.get(form.spellId) : undefined;
      const hydrated: CharacterFormApi = {
        id: form.id,
        creature: formCreatureById.get(form.creatureId) ?? formSummaryById.get(form.creatureId),
        active: activeFormId === form.id && formPurposeOverlaysCharacter(form.purpose)
      };
      if (form.purpose) hydrated.purpose = form.purpose;
      if (form.spellId) hydrated.spellId = form.spellId;
      if (spell) hydrated.spell = { id: spell.id, name: spell.name };
      return hydrated;
    });

    const grantingClassLevelByTraitId = await this.loadGrantingClassLevels(
      personaje,
      subclassRulesById,
      classRulesById
    );
    const traitResources = normalizeTraitResources(personaje.traitResources);
    const spentByTraitId = new Map(traitResources.map(item => [item.traitId, item.spent]));
    const activeTraitIds = normalizeActiveTraitIds(personaje.activeTraitIds);
    const hitDicePools = classPoolsFromCharacter(personaje.classes ?? []);
    const hitDiceBonusPerDie = rulesConfig.restRules?.hitDiceSpending?.bonusFormula
      ? evaluateFormula(
        rulesConfig.restRules.hitDiceSpending.bonusFormula,
        apiAttributes,
        { proficiencyBonus: Number(personaje.proficiencyBonus) || 0 }
      )
      : 0;
    const hitDice = toHitDiceApi(
      hitDicePools,
      normalizeHitDiceSpent(personaje.hitDiceSpent, hitDicePools.map((pool) => pool.classId)),
      hitDiceBonusPerDie
    );
    const spellSlotPools = slotPoolsFromSources(spellcastingSources);
    const spellSlots = toSpellSlotsApi(
      spellSlotPools,
      normalizeSpellSlotsSpent(personaje.spellSlotsSpent, spellSlotPools)
    );
    const conditionById = new Map(
      conditionDocs.map((condition) => [condition.id, condition])
    );
    const activeConditions = storedConditions.map((item) => ({
      conditionId: item.conditionId,
      name: conditionById.get(item.conditionId)?.name ?? "",
      ...(item.level !== undefined ? { level: item.level } : {})
    }));

    const hydratedCompanions = isCombat
      ? []
      : hydrateCompanions(storedCompanions, formCreatures);
    const holderState = isCombat
      ? { equipment: [] as CharacterEquipmentApi[], companions: hydratedCompanions, characterLoad: 0 }
      : applyInventoryHolderState(equipmentWithCombatBonuses, hydratedCompanions, rulesConfig);

    const sheet: CharacterApi = {
      id: personaje._id.toString(),
      img: personaje.img,
      name: personaje.name,
      race: personaje.race,
      user: ownerName,
      userId: personaje.user ?? "",
      size: formatSize(personaje.size),
      classes: clases,
      subclasses: this.mapSubclassSummaries(personaje.subclasses ?? [], subclassSummariesById),
      campaign: personaje?.campaign ? { id: personaje?.campaign, name: campaign?.name } : null,
      appearance: personaje?.appearance,
      background: personaje?.background,
      level,
      xp: personaje.xp,
      xpMax: xpMaxForLevel(level, rulesConfig.xpProgression),
      attributes: apiAttributes,
      systems: personaje.systems ?? [],
      initiativeBonus,
      hpMax: personaje?.hpMax,
      hpCurrent: personaje?.hpCurrent,
      ac,
      speed: finalSpeed,
      skills: skillsWithArmor,
      languages: {
        understands: idiomas_understands,
        speaks: idiomas_speaks,
        notes: idiomasId.notes
      },
      proficiencies: proficienciesUnicos,
      traits: resolveTraitActions(
        hydrateCatalogChoiceLanguages(
          traits,
          personaje.traitChoices,
          catalogLanguagesById(idiomas_speaks),
          raceRefs
        ),
        apiAttributes,
        personaje.proficiencyBonus ?? 0,
        {
          grantingClassLevelByTraitId,
          spentByTraitId,
          activeTraitIds: new Set(activeTraitIds)
        }
      ).map(trait => ({
        ...trait,
        summary: displaySummary(trait.summary, trait.description)
      })),
      traitsData: personaje.traitsData,
      resistances,
      conditionalResistances,
      conditionImmunities,
      conditionalConditionImmunities,
      proficiencyBonus: personaje.proficiencyBonus,
      savingThrows: personaje.savingThrows,
      equipment: isCombat
        ? (armorEquipment as unknown as CharacterEquipmentApi[])
        : holderState.equipment,
      wearingArmorWithoutProficiency,
      money,
      spells: updatedSpells,
      maxCarryingCapacity,
      load: holderState.characterLoad,
      spellcasting,
      optionSelections,
      forms,
      activeFormId,
      spellPrivileges: hydratedPrivileges,
      companions: holderState.companions,
      traitResources,
      activeTraitIds,
      hitDice,
      spellSlots,
      activeConditions
    };

    const withTraits = options?.applyActiveTraits === false
      ? sheet
      : applyActiveTraitOverlays(sheet, rulesConfig);

    return applyActiveFormOverlay(withTraits, { initiativeBonusFormula });
  }

  private toInventoryRows(equipment: CharacterEquipmentMongo[] | undefined): CharacterEquipmentMongo[] {
    return cloneInventory(equipment ?? []);
  }

  private requireInventoryInstance(
    inventory: CharacterEquipmentMongo[],
    instanceId: string
  ): CharacterEquipmentMongo {
    const item = inventory.find(eq => eq.instanceId === instanceId);
    if (!item) {
      throw new NotFoundError("No se encontró el equipamiento en el personaje");
    }
    return item;
  }

  private toHydrationRows(equipment: CharacterEquipmentMongo[] | undefined): CharacterEquipmentMongo[] {
    return this.toInventoryRows(equipment).map(item => ({
      instanceId: item.instanceId,
      equipmentId: item.equipmentId,
      id: item.equipmentId,
      quantity: item.quantity,
      equipped: item.equipped,
      isMagic: item.isMagic,
      isBond: item.isBond,
      isFavorite: item.isFavorite,
      ...(item.bondOrigin ? { bondOrigin: item.bondOrigin } : {}),
      ...(item.bondStored ? { bondStored: true } : {}),
      ...(item.uniqueGranted ? { uniqueGranted: true } : {}),
      ...(item.customization ?? {}),
      ...(item.holderId ? { holderId: item.holderId } : {}),
      ...(item.drawnBy !== undefined ? { drawnBy: item.drawnBy } : {}),
      ...(item.hpCurrent !== undefined ? { hpCurrent: item.hpCurrent } : {}),
    }));
  }

  private slotLookupFrom(
    formatted: EquipmentInstanceApi[]
  ): (item: CharacterEquipmentMongo) => EquipSlot | null {
    const slotByInstanceId = new Map(
      formatted.map(item => [item.instanceId, item.equipSlot ?? null] as const)
    );
    const slotByEquipmentId = new Map(
      formatted.map(item => [item.id, item.equipSlot ?? null] as const)
    );

    return (item: CharacterEquipmentMongo) =>
      slotByInstanceId.get(item.instanceId)
      ?? slotByEquipmentId.get(item.equipmentId)
      ?? null;
  }

  private mountGearLookupFrom(
    formatted: EquipmentInstanceApi[]
  ): (item: CharacterEquipmentMongo) => MountGearSlot | null {
    const slotByInstanceId = new Map(
      formatted.map(item => [item.instanceId, item.mountGear?.slot ?? null] as const)
    );
    const slotByEquipmentId = new Map(
      formatted.map(item => [item.id, item.mountGear?.slot ?? null] as const)
    );

    return (item: CharacterEquipmentMongo) =>
      slotByInstanceId.get(item.instanceId)
      ?? slotByEquipmentId.get(item.equipmentId)
      ?? null;
  }

  private applyEquipOrThrow(
    inventory: CharacterEquipmentMongo[],
    instanceId: string,
    equipped: boolean,
    slotOf: (item: CharacterEquipmentMongo) => EquipSlot | null
  ): CharacterEquipmentMongo[] {
    try {
      return applyEquip(inventory, instanceId, equipped, slotOf);
    } catch (error) {
      if (error instanceof Error && error.message === "NO_EQUIP_SLOT") {
        throw new ValidationError("El equipamiento no tiene ranura de equipamiento (equipSlot)");
      }
      if (error instanceof Error && error.message === "INVENTORY_INSTANCE_NOT_FOUND") {
        throw new NotFoundError("No se encontró el equipamiento en el personaje");
      }
      throw error;
    }
  }

  private applyMountGearOrThrow(
    inventory: CharacterEquipmentMongo[],
    instanceId: string,
    equipped: boolean,
    slotOf: (item: CharacterEquipmentMongo) => MountGearSlot | null
  ): CharacterEquipmentMongo[] {
    try {
      return applyMountGear(inventory, instanceId, equipped, slotOf);
    } catch (error) {
      if (error instanceof Error && error.message === "NO_MOUNT_GEAR_SLOT") {
        throw new ValidationError("El arreo o la barda solo se equipan en una montura");
      }
      if (error instanceof Error && error.message === "INVENTORY_INSTANCE_NOT_FOUND") {
        throw new NotFoundError("No se encontró el equipamiento en el personaje");
      }
      throw error;
    }
  }

  private async saveInventory(
    id: string,
    equipment: CharacterEquipmentMongo[]
  ): Promise<UpdateCharacterEquipmentResponse> {
    const resultado = await CharacterModel.findByIdAndUpdate(
      id,
      { $set: { equipment } },
      { returnDocument: "after" }
    );

    if (!resultado) {
      throw new NotFoundError("Personaje no encontrado");
    }

    return {
      equipment: await this.formatCharacterEquipment(resultado),
    };
  }

  private async saveInventoryAndFormatCharacter(
    id: string,
    equipment: CharacterEquipmentMongo[]
  ): Promise<{ full: CharacterApi, basic: CharacterBasic }> {
    const resultado = await CharacterModel.findByIdAndUpdate(
      id,
      { $set: { equipment } },
      { returnDocument: "after" }
    );

    if (!resultado) {
      throw new NotFoundError("Personaje no encontrado");
    }

    return this.formatFullAndListCard(resultado);
  }

  private async formatSpellState(
    personaje: CharacterMongo,
    options?: { includePrivileges?: boolean }
  ): Promise<CharacterSpellStateResponse> {
    personaje = normalizeCharacterDocument(personaje);
    const classIds = (personaje.classes ?? []).map(entry => entry.class);
    const includePrivileges = options?.includePrivileges === true;
    const [
      loadedTraits,
      classRulesList,
      subclassRulesById,
      systemAttributes
    ] = await Promise.all([
      this.traitRepository.getTraitsByIndexes(personaje?.traits, personaje?.traitsData),
      this.characterClassRepository.getRulesByIds(classIds),
      this.getSubclassRulesMapByIds(personaje.subclasses ?? []),
      this.attributeService.getBySystems(personaje.systems ?? [])
    ]);
    const classRulesById = new Map(classRulesList.map(item => [item.id, item]));
    const attributesByKey = new Map(systemAttributes.map(attr => [attr.key, attr]));
    const { spells, spellPrivileges } = await this.hydrateCharacterSpells(personaje, {
      traits: loadedTraits,
      classRulesById,
      subclassRulesById,
      spellcasting: [],
      systemAttributes,
      attributesByKey,
      useSpellRefs: true,
      hydratePrivileges: includePrivileges
    });
    const sheet = toSheetSpellState(spells, includePrivileges ? spellPrivileges : undefined);
    return includePrivileges ? { ...sheet, spellPrivileges } : sheet;
  }

  private async hydrateCharacterSpells(
    personaje: CharacterMongo,
    input: {
      traits: TraitApi[];
      classRulesById: Map<string, ClassRulesRef>;
      subclassRulesById: Map<string, SubclassRulesRef>;
      spellcasting: SpellcastingLevel[];
      systemAttributes: AttributeApi[];
      attributesByKey: Map<string, AttributeApi>;
      extraSpellIdsToLoad?: string[];
      useSpellRefs: boolean;
      hydratePrivileges: boolean;
    }
  ): Promise<{
    spells: CharacterApi["spells"];
    spellPrivileges: CharacterSpellPrivilegeApi[];
    spellById: Map<string, (SpellApi | SpellRef) & { id: string }>;
  }> {
    const {
      traits,
      classRulesById,
      subclassRulesById,
      spellcasting,
      systemAttributes,
      attributesByKey,
      extraSpellIdsToLoad = [],
      useSpellRefs,
      hydratePrivileges
    } = input;
    const privilegeInstances = getCharacterSpellPrivileges(personaje.spellPrivileges);
    const spells = personaje.spells && typeof personaje.spells === "object" ? { ...personaje.spells } : {};
    const preparedSpellsMap = personaje.preparedSpells && typeof personaje.preparedSpells === "object"
      ? personaje.preparedSpells
      : {};
    const extraSpellsMap = personaje.extraSpells && typeof personaje.extraSpells === "object"
      ? personaje.extraSpells
      : {};
    const grantedExtraInput = {
      traits,
      optionSelections: personaje.optionSelections ?? [],
      classes: personaje.classes ?? [],
      classCatalogs: [...classRulesById.values()],
      subclasses: [...subclassRulesById.values()]
    };
    const derivedExtraByClass = grantedExtraSpellIdsByClass(grantedExtraInput);
    const ritualOnlyExtraByClass = ritualOnlyGrantedExtraIdsByClass(grantedExtraInput);
    const updatedSpells: CharacterApi["spells"] = {};

    const classLevelByClassId = this.classLevelByClassId(personaje);
    const loadedTraitIds = new Set(traits.map(trait => trait.id));
    const missingPrivilegeTraitIds = [...new Set(
      privilegeInstances
        .map(item => item.traitId)
        .filter(traitId => !loadedTraitIds.has(traitId) && !(personaje.traits ?? []).includes(traitId))
    )];
    const extraPrivilegeTraits = missingPrivilegeTraitIds.length
      ? await this.traitRepository.getTraitsByIndexes(missingPrivilegeTraitIds)
      : [];
    const privilegeTraits = [...traits, ...extraPrivilegeTraits];
    const rulesByTraitId = this.buildPrivilegeRulesMap(privilegeTraits, privilegeInstances);

    const spellGroupKeys = new Set([
      ...Object.keys(spells),
      ...Object.keys(extraSpellsMap),
      ...Object.keys(derivedExtraByClass),
      ...Object.keys(preparedSpellsMap).filter(key => key !== "race"),
      ...privilegeInstances.map(item => item.classId)
    ]);

    let raceSpellcastingAttr: AttributeApi | undefined;
    if (personaje.raceId && spellGroupKeys.has("race")) {
      const raceAttr = await this.raceRepository.getSpellcastingAttribute(personaje.raceId);
      raceSpellcastingAttr = raceAttr
        ? (attributesByKey.get(raceAttr.key) ?? raceAttr)
        : undefined;
    }

    const gatedUniqueGrantTraitIds = hasUniqueGranted(this.toInventoryRows(personaje.equipment))
      ? []
      : privilegeTraits
        .filter(trait => trait.uniqueEquipmentGrant && trait.id)
        .map(trait => trait.id as string);

    type SpellGroupPayload = {
      groupSpells: string;
      knownIds: string[];
      extraIds: string[];
      preparedIds: string[];
      hasPreparedKey: boolean;
      ritualOnlyExtraIds: string[];
    };
    const groupPayloads: SpellGroupPayload[] = [];
    const spellIdsToLoad = new Set<string>(extraSpellIdsToLoad);
    for (const instance of privilegeInstances) {
      for (const selection of instance.selections ?? []) {
        for (const spellId of selection ?? []) {
          if (spellId) spellIdsToLoad.add(spellId);
        }
      }
    }

    for (const groupSpells of spellGroupKeys) {
      const knownIds = Array.isArray(spells[groupSpells]) ? [...spells[groupSpells]] : [];
      const persistedExtraIds = getExtraSpellIds(extraSpellsMap, groupSpells);
      const privilegeExtraIds = extraPrivilegeSpellIds(
        privilegeInstances,
        rulesByTraitId,
        groupSpells,
        classLevelByClassId,
        gatedUniqueGrantTraitIds
      );
      const extraIds = mergeExtraSpellIds(
        persistedExtraIds,
        [
          ...(derivedExtraByClass[groupSpells] ?? []),
          ...privilegeExtraIds
        ],
        knownIds
      );
      const ritualOnlyExtraIds = ritualOnlyExtraSpellIds({
        extraIds,
        persistedExtraIds,
        otherDerivedExtraIds: privilegeExtraIds,
        ritualOnlyFromTraits: ritualOnlyExtraByClass[groupSpells] ?? []
      });
      const alwaysIds = groupSpells === "race"
        ? []
        : alwaysPreparedSpellIds(privilegeInstances, rulesByTraitId, groupSpells, classLevelByClassId);
      const preparedIds = groupSpells === "race"
        ? []
        : mergePreparedWithPrivileges(
          getPreparedSpellIds(preparedSpellsMap, groupSpells),
          alwaysIds
        );
      const hasPreparedKey = groupSpells !== "race"
        && (Array.isArray(preparedSpellsMap[groupSpells]) || alwaysIds.length > 0);

      if (knownIds.length === 0 && extraIds.length === 0 && preparedIds.length === 0 && !hasPreparedKey) {
        continue;
      }

      groupPayloads.push({ groupSpells, knownIds, extraIds, preparedIds, hasPreparedKey, ritualOnlyExtraIds });
      for (const id of [...knownIds, ...extraIds, ...preparedIds]) {
        if (id) spellIdsToLoad.add(id);
      }
    }

    const loadedSpells = spellIdsToLoad.size
      ? (useSpellRefs
        ? await this.spellRepository.getSpellRefsByIndexes([...spellIdsToLoad])
        : await this.spellRepository.getSpellsByIndexes([...spellIdsToLoad]))
      : [];
    const spellById = new Map(
      loadedSpells
        .filter((spell): spell is (SpellApi | SpellRef) & { id: string } => Boolean(spell.id))
        .map(spell => [spell.id, spell])
    );
    const spellsFromIds = (ids: string[]) => ids
      .map(id => spellById.get(id))
      .filter((spell): spell is (SpellApi | SpellRef) & { id: string } => Boolean(spell));

    for (const payload of groupPayloads) {
      let type: AttributeApi | undefined;
      if (payload.groupSpells === "race") {
        type = raceSpellcastingAttr;
      } else {
        const classSpellcasting = spellcasting.find(item => item.class === payload.groupSpells);
        if (classSpellcasting?.ability) {
          type = classSpellcasting.ability;
        } else {
          const classRules = classRulesById.get(payload.groupSpells);
          const spellcastingKey = classRules?.spellcasting;
          type = spellcastingKey
            ? (attributesByKey.get(spellcastingKey)
              ?? systemAttributes.find(attr => attr.id === spellcastingKey))
            : undefined;
        }
      }

      const knownSpellsForGroup = spellsFromIds(payload.knownIds);
      const extraSpellsForGroup = spellsFromIds(payload.extraIds);
      const preparedSpellsForGroup = spellsFromIds(payload.preparedIds);
      const overlaidKnown = useSpellRefs
        ? knownSpellsForGroup
        : overlaySpellsCreatureForms(knownSpellsForGroup as SpellApi[], traits);
      const overlaidExtra = useSpellRefs
        ? extraSpellsForGroup
        : overlaySpellsCreatureForms(extraSpellsForGroup as SpellApi[], traits);
      const overlaidPrepared = useSpellRefs
        ? preparedSpellsForGroup
        : overlaySpellsCreatureForms(preparedSpellsForGroup as SpellApi[], traits);
      updatedSpells[payload.groupSpells] = {
        list: overlaidExtra.length ? [...overlaidKnown, ...overlaidExtra] : overlaidKnown,
        ...(overlaidExtra.length ? { extra: overlaidExtra } : {}),
        ...(payload.hasPreparedKey ? { prepared: overlaidPrepared } : {}),
        ...(payload.ritualOnlyExtraIds.length ? { ritualOnlyExtraIds: payload.ritualOnlyExtraIds } : {}),
        type
      } as CharacterApi["spells"][string];
    }

    const spellPrivileges: CharacterSpellPrivilegeApi[] = hydratePrivileges
      ? privilegeInstances.map(instance => {
        const rules = rulesByTraitId.get(instance.traitId)
          ?? privilegeTraits.find(trait => trait.id === instance.traitId)?.spellPrivileges
          ?? [];
        const classLevel = classLevelByClassId.get(instance.classId) ?? 0;
        const activeIndexes = activeSpellPrivilegeRuleIndexes(rules, classLevel);
        return {
          traitId: instance.traitId,
          classId: instance.classId,
          rules,
          selections: activeIndexes.map(ruleIndex => {
            const hydrated: SpellApi[] = [];
            for (const spellId of instance.selections?.[ruleIndex] ?? []) {
              const spell = spellById.get(spellId);
              if (spell) hydrated.push(spell as SpellApi);
            }
            return hydrated;
          })
        };
      })
      : [];

    return { spells: updatedSpells, spellPrivileges, spellById };
  }

  private async formatSheetAndListCard(
    personaje: CharacterMongo
  ): Promise<CharacterLevelUpResponse> {
    await this.refreshStoredAc(personaje);
    const sheet = await this.formatCharacter(personaje, { view: "sheet" });
    return {
      full: toSheetCharacter(sheet),
      basic: toCharacterBasic(sheet, {
        ac: this.storedAcOf(personaje),
        speed: personaje.speed,
      }),
    };
  }

  private async formatFullAndListCard(
    personaje: CharacterMongo
  ): Promise<{ full: CharacterApi; basic: CharacterBasic }> {
    await this.refreshStoredAc(personaje);
    const full = await this.formatCharacter(personaje);
    return {
      full,
      basic: toCharacterBasic(full, {
        ac: this.storedAcOf(personaje),
        speed: personaje.speed,
      }),
    };
  }

  private async saveInventoryAndFormatEquipmentState(
    id: string,
    equipment: CharacterEquipmentMongo[]
  ): Promise<CharacterEquipmentStateResponse> {
    const resultado = await CharacterModel.findByIdAndUpdate(
      id,
      { $set: { equipment } },
      { returnDocument: "after" }
    );

    if (!resultado) {
      throw new NotFoundError("Personaje no encontrado");
    }

    return this.formatEquipmentState(resultado);
  }

  private async formatEquipmentState(
    personaje: CharacterMongo
  ): Promise<CharacterEquipmentStateResponse> {
    personaje = normalizeCharacterDocument(personaje);
    const level =
      personaje.classes?.map(cl => cl.level).reduce((acc, value) => acc + value, 0) ?? 0;

    const [loadedTraits, baseProficiencies, equipment, rulesConfig] = await Promise.all([
      this.traitRepository.getTraitsByIndexes(personaje.traits, personaje.traitsData),
      this.proficiencyRepository.getProficienciesByIndices(personaje.proficiencies ?? []),
      this.equipmentRepository.getCharacterEquipmentsByIds(this.toHydrationRows(personaje.equipment ?? [])),
      this.systemRepository.getMergedRulesConfig(personaje.systems ?? []),
    ]);

    const expandedTraits = await this.expandTraitsForSystems(
      loadedTraits,
      personaje.systems,
      this.chosenCreatureTypeIds(loadedTraits, personaje.traitChoices),
      this.chosenDamageTypeIds(loadedTraits, personaje.traitChoices)
    );
    const raceRefs = await this.raceRefsForLabels(personaje.traitChoices);
    const resolvedSheet = resolveCharacterTraitChoices(expandedTraits, personaje.traitChoices, raceRefs);
    const traits = resolvedSheet.traits;
    const apiAttributes = await this.formatSheetAttributes(
      personaje,
      traits,
      rulesConfig.defaultMaxAttributeValue,
      rulesConfig
    );

    const proficiencies = [
      ...new Map(
        [
          ...baseProficiencies,
          ...traits.flatMap(trait => trait.proficiencies ?? []),
        ].map(item => [item.id, item])
      ).values(),
    ];
    const descendantProficiencies = await this.proficiencyRepository.getDescendantProficiencies(
      proficiencies.map(item => item.id)
    );
    const proficienciesForEquipmentCheck = [
      ...new Map(
        [...proficiencies, ...descendantProficiencies].map(item => [item.id, item])
      ).values(),
    ];

    const equipmentWithCombatBonuses = enrichEquipmentWithCombatBonuses({
      equipment: equipment ?? [],
      attributes: apiAttributes,
      proficiencies: proficienciesForEquipmentCheck,
      proficiencyBonus: personaje.proficiencyBonus ?? 0,
      level,
      rules: rulesConfig,
      pactProficiency: ownedWeaponBond(traits)?.grantsProficiency === true,
    });

    const { ac } = await this.calculateAc(personaje, traits, {
      equipment: equipmentWithCombatBonuses.filter(item => !item.holderId),
      attributes: apiAttributes,
      rulesConfig
    });
    await this.refreshStoredAc(personaje);

    const delta = toCharacterEquipmentStateDelta({
      equipment: equipmentWithCombatBonuses,
      traits,
      attributes: apiAttributes,
      baseSpeed: personaje.speed,
      ac,
      grantedResistances: resolvedSheet.grantedResistances,
      activeTraitIds: personaje.activeTraitIds,
      overlayRules: {
        meleeAttackAttributes: rulesConfig.meleeAttackAttributes,
        rangedAttackAttributes: rulesConfig.rangedAttackAttributes
      }
    });
    const basic = await this.formatBasicCharacter(personaje, { skipAttributeOverlay: true });
    return { basic, ...delta };
  }

  private async formatCharacterEquipment(
    personaje: CharacterMongo
  ): Promise<CharacterEquipmentApi[]> {
    const level =
      personaje.classes?.map(cl => cl.level).reduce((acc, value) => acc + value, 0) ?? 0;

    const [equipment, baseProficiencies, traits, rulesConfig] = await Promise.all([
      this.equipmentRepository.getCharacterEquipmentsByIds(this.toHydrationRows(personaje.equipment ?? [])),
      this.proficiencyRepository.getProficienciesByIndices(personaje?.proficiencies ?? []),
      this.traitRepository.getTraitsByIndexes(personaje?.traits, personaje?.traitsData),
      this.systemRepository.getMergedRulesConfig(personaje.systems ?? []),
    ]);
    const apiAttributes = await this.formatSheetAttributes(
      personaje,
      traits,
      rulesConfig.defaultMaxAttributeValue
    );

    const proficiencies = [
      ...new Map(
        [
          ...baseProficiencies,
          ...traits.flatMap(trait => trait.proficiencies ?? []),
        ].map(item => [item.id, item])
      ).values(),
    ];

    const descendantProficiencies = await this.proficiencyRepository.getDescendantProficiencies(
      proficiencies.map(item => item.id)
    );
    const proficienciesForEquipmentCheck = [
      ...new Map(
        [...proficiencies, ...descendantProficiencies].map(item => [item.id, item])
      ).values(),
    ];

    const enriched = enrichEquipmentWithCombatBonuses({
      equipment: equipment ?? [],
      attributes: apiAttributes,
      proficiencies: proficienciesForEquipmentCheck,
      proficiencyBonus: personaje?.proficiencyBonus ?? 0,
      level,
      rules: rulesConfig,
      pactProficiency: ownedWeaponBond(traits ?? [])?.grantsProficiency === true,
    });
    return applyInventoryHolderState(
      enriched,
      hydrateCompanions(normalizeCompanions(personaje.companions), []),
      rulesConfig
    ).equipment;
  }

  private async normalizeAndFormatMoney(personaje: CharacterMongo): Promise<({ quantity: number } & CoinApi)[]> {
    const systems = personaje.systems ?? [];
    const raw = personaje?.money;

    if (systems.length === 0) {
      return this.formatMoneyFromUnitsOnly(raw);
    }

    const systemCoins = await this.coinRepository.getBySystems(systems);
    const quantities = parseCharacterMoneyQuantities(raw, systemCoins);
    const orphanUnitIds = getOrphanUnitIds(quantities, systemCoins);
    const orphanCoins = orphanUnitIds.length > 0
      ? await this.coinRepository.getCoinsByIds(orphanUnitIds)
      : [];

    return buildCharacterMoneyItems(systemCoins, quantities, orphanCoins);
  }

  private async formatMoneyFromUnitsOnly(raw: unknown): Promise<({ quantity: number } & CoinApi)[]> {
    const quantities = parseCharacterMoneyQuantities(raw);
    const unitIds = [...quantities.keys()];

    if (unitIds.length === 0) {
      return [];
    }

    const coins = await this.coinRepository.getCoinsByIds(unitIds);
    return unitIds
      .map(unitId => {
        const coin = coins.find(c => c.id === unitId);
        if (!coin) return null;
        return {
          quantity: quantities.get(unitId) ?? 0,
          ...coin,
        };
      })
      .filter(Boolean) as ({ quantity: number } & CoinApi)[];
  }

  private async resolveHitDiceBonusPerDie(
    personaje: Pick<CharacterMongo, "attributes" | "systems" | "traits" | "proficiencyBonus">,
    restRules?: { hitDiceSpending?: { bonusFormula?: string } }
  ): Promise<number> {
    const formula = restRules?.hitDiceSpending?.bonusFormula;
    if (!formula) return 0;
    const attributes = await this.formatSheetAttributes(personaje);
    return evaluateFormula(formula, attributes, {
      proficiencyBonus: Number(personaje.proficiencyBonus) || 0
    });
  }

  private async formatSheetAttributes(
    personaje: Pick<CharacterMongo, "attributes" | "systems" | "traits">,
    traits?: TraitApi[],
    defaultMax?: number,
    rulesConfig?: SystemRulesConfig,
    attributeCatalog?: AttributeApi[]
  ): Promise<CharacterAttributeApi[]> {
    const resolvedTraits = traits
      ?? await this.traitRepository.getTraitsByIndexes(personaje.traits ?? []);
    const overlay = applyTraitAbilityScores(personaje.attributes, resolvedTraits);
    const formatted = await this.attributeService.formatAttributes(
      overlay.attributes,
      personaje.systems ?? [],
      rulesConfig
        ? { globalModifierFormula: rulesConfig.globalModifierFormula, catalog: attributeCatalog }
        : (attributeCatalog ? { catalog: attributeCatalog } : undefined)
    );
    const max = defaultMax
      ?? rulesConfig?.defaultMaxAttributeValue
      ?? (rulesConfig
        ? undefined
        : (await this.systemRepository.getMergedRulesConfig(personaje.systems ?? [])).defaultMaxAttributeValue);
    return withAttributeMax(formatted, overlay.maxByKey, max);
  }

}
