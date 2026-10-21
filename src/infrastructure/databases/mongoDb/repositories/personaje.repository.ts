import IPersonajeRepository from '../../../../domain/repositories/IPersonajeRepository';
import Personaje from '../schemas/Personaje';
import IUserRepository from '../../../../domain/repositories/IUserRepository';
import ISpellRepository from '../../../../domain/repositories/ISpellRepository';
import { Types } from 'mongoose';
import { CharacterCampaignLink, CharacterSubclassApi, ConsultarPersonajeOptions, LevelUpData, LevelUpDipData, LevelUpSpellChanges, PendingSkillProficiencyChoice, PersonajeApi, PersonajeBasico, PersonajeMongo, PersonajeEquipmentMongo, TypeAddEquipment, TypeCrearPersonaje, TypeDeleteEquipment, TypeEquipEquipment, TypeToggleFavoriteEquipment, ToggleFavoriteEquipmentResponse, TypeBindPactEquipment, TypeLearnSpells, TypeLevelUp, TypePrepareSpells, TypeBindSpellPrivileges, TypeUseTrait, TypeRestCharacter, TypeSpendHitDice, TypeSpendSpellSlot, TypeApplyCharacterCondition, TypeUpdateCharacterCondition, TypeRemoveCharacterCondition, TypeAddCharacterFormPersist, TypeSetCharacterFormActive, UpdateCharacterMoneyResponse, UpdateCharacterEquipmentResponse, CharacterSpellPrivilegeMongo, CharacterSpellPrivilegeApi, CharacterCompanionInput, UpdateCharacterCompanionsResponse, CharacterHitDiceSpent, CharacterSpellSlotSpent, CharacterActiveCondition, CharacterTraitResource } from '../../../../domain/types/personajes.types';
import { CharacterFormApi, CharacterFormMongo, formPurposeOverlaysCharacter } from '../../../../domain/types/creatureForm.types';
import {
  CharacterOptionSelection,
  CharacterOptionSelectionApi,
  OptionChoiceMongo,
  PendingOptionChoice
} from '../../../../domain/types/optionGroup.types';
import { PrerequisiteContext } from '../../../../domain/types/prerequisite.types';
import IGroupOptionRepository from '../../../../domain/repositories/IGroupOptionRepository';
import IOptionGroupRepository from '../../../../domain/repositories/IOptionGroupRepository';
import { characterRestRejection, resolveHitPointRecovery, resolveSpellSlotRecovery } from '../../../../domain/services/restRules';
import { NotFoundError, ConflictError, ValidationError, AppError } from '../../../../domain/errors/AppError';
import { ChoiceApi, Damage } from '../../../../domain/types';
import AttributeService from '../../../../domain/services/attribute.service';
import SkillService from '../../../../domain/services/skill.service';
import { canAccessCharacter } from '../../../../domain/services/characterAccess';
import { ICampaignReader } from '../../../../domain/ports/ICampaignReader';
import IFeatRepository from '../../../../domain/repositories/IFeatRepository';
import ICharacterClassRepository from '../../../../domain/repositories/ICharacterClassRepository';
import ISubclassRepository from '../../../../domain/repositories/ISubclassRepository';
import IEquipmentRepository from '../../../../domain/repositories/IEquipmentRepository';
import ITraitRepository from '../../../../domain/repositories/ITraitRepository';
import IProficiencyRepository from '../../../../domain/repositories/IProficiencyRepository';
import ILanguageRepository from "../../../../domain/repositories/ILanguageRepository";
import { SpellApi } from '../../../../domain/types/spell.types';
import { FeatApi } from '../../../../domain/types/feat.types';
import { SkillApi } from '../../../../domain/types/skill.types';
import { ConditionApi } from '../../../../domain/types/condition.types';
import { CharacterEquipmentApi, CharacterEquipmentMongo, EquipmentInstanceApi, EquipSlot } from '../../../../domain/types/equipment.types';
import { findBlockedEquipmentRestriction } from '../../../../utils/equipmentRestriction';
import IRaceRepository from '../../../../domain/repositories/IRaceRepository';
import ICreatureTypeRepository from '../../../../domain/repositories/ICreatureTypeRepository';
import IDamageRepository from '../../../../domain/repositories/IDamageRepository';
import IConditionRepository from '../../../../domain/repositories/IConditionRepository';
import { PendingCatalogChoice, TraitApi, TraitChoiceValue, TraitChoices, TraitDataMongo, SpellPrivilegeRule } from '../../../../domain/types/traits.types';
import { CreatureTypeApi } from '../../../../domain/types/creatureType.types';
import { RaceRef } from '../../../../domain/types/race.types';
import { applyTraitStacking, closeLevelUpTraitText, damageChoiceSourceIdsToLoad, levelUpTraitIds, mergeClassAndRaceLevelUp, mergeLevelUpTraits, mergedTraitsDataAtLevel, mergeTraitDataMaps, orderTraitsByIds, traitIdsWithChangedData } from '../../../../utils/characterLevelUpTraits';
import {
  buildPendingOptionChoices,
  mergeOptionChoices,
  optionReplacementsToChoices,
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
import { CharacterClassApi } from '../../../../domain/types/characterClass.types';
import { resolveTraitActions } from '../../../../utils/resolveTraitActions';
import { displaySummary } from '../../../../utils/traitSummary';
import { buildTraitGrantingClassLevels } from '../../../../utils/traitProgression';
import { grantedExtraSpellIdsByClass, mergeExtraSpellIds } from '../../../../utils/traitGrantedSpells';
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
  filterLevelUpFeatChoices,
  getOwnedFeatIds,
  validateLevelUpAbilityScorePick
} from '../../../../utils/characterLevelUpAbilityScore';
import ICreatureRepository from '../../../../domain/repositories/ICreatureRepository';
import { CharacterAttributeApi, AttributeApi } from '../../../../domain/types/attribute.types';
import { evaluateFormula, enrichSkillsWithPassive } from '../../../../utils/formulaEvaluator';
import {
  applySpellReplacements,
  buildCantripSpellChoice,
  buildSpellReplacementToChoice,
  buildSynthesizedKnownSpellChoice,
  buildSpellcastingLevel,
  castableSpellLevels,
  collectExpandedSpells,
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
  validateLevelUpSpellPicks,
  validatePreparedSpellPicks,
  validateSpellReplacements,
  validateSpellPrivilegePicks,
  canReplaceSpellPrivileges,
  characterHasTrait,
  findSpellPrivilegeInstance,
  getCharacterSpellPrivileges,
  privilegeSpellIdsExcludedFromCap,
  alwaysPreparedSpellIds,
  mergePreparedWithPrivileges,
} from '../../../../utils/characterSpellcasting';
import { enrichEquipmentWithCombatBonuses } from '../../../../utils/combatBonuses';
import {
  addToInventory,
  cloneInventory,
  createInventoryInstance,
  removeOrDecrement,
  splitOne,
  tryMerge,
} from '../../../../utils/inventoryStacks';
import { normalizeCompanions } from '../../../../utils/normalizeCompanions';
import { applyEquip } from '../../../../utils/inventorySlots';
import ISystemRepository from '../../../../domain/repositories/ISystemRepository';
import { SubclassApi } from '../../../../domain/types/subclass.types';
import ICoinRepository from '../../../../domain/repositories/ICoinRepository';
import { CoinApi } from '../../../../domain/types/coin.types';
import {
  buildPersonajeMoneyItems,
  getOrphanUnitIds,
  parseCharacterMoneyQuantities,
} from '../../../../utils/characterMoney';
import {
  DEFAULT_PROFICIENCY_PROGRESSION,
  DEFAULT_XP_PROGRESSION,
} from '../../../../utils/systemRulesMerge';
import { SpellcastingLevel, SubclassChoiceMenuApi } from '../../../../domain/types/characterClass.types';
import { aggregateConditionalConditionImmunities, aggregateConditionalResistances } from '../../../../utils/aggregateConditionalResistances';
import { applyActiveTraitOverlays } from '../../../../utils/applyActiveTraitOverlays';
import { applyActiveFormOverlay } from '../../../../utils/applyActiveFormOverlay';
import { MAX_CHARACTER_FORMS, normalizeCharacterForms } from '../../../../utils/normalizeCharacterForms';
import { normalizeActiveTraitIds, normalizeTraitResources } from '../../../../utils/traitResources';
import {
  applyHitPointRecovery,
  applySpendHitDice,
  classPoolsFromCharacter,
  HIT_DICE_ABILITY_KEY,
  normalizeHitDiceSpent,
  toHitDiceApi
} from '../../../../utils/hitDice';
import {
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

function choiceEntryName(value: TraitChoiceValue): string | null {
  if (typeof value === "string") return value.length > 0 ? value : null;
  if (value && typeof value.name === "string" && value.name.length > 0) return value.name;
  return null;
}

export default class PersonajeRepository implements IPersonajeRepository {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly equipmentRepository: IEquipmentRepository,
    private readonly traitRepository: ITraitRepository,
    private readonly proficiencyRepository: IProficiencyRepository,
    private readonly languageRepository: ILanguageRepository,
    private readonly skillService: SkillService,
    private readonly spellRepository: ISpellRepository,
    private readonly featRepository: IFeatRepository,
    private readonly claseRepository: ICharacterClassRepository,
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

  async consultarPorUsuario(id: string): Promise<PersonajeBasico[]> {
    try {
      const personajes = await Personaje.find({ user: id })
        .collation({ locale: 'es', strength: 1 })
        .sort({ name: 1 });

      const userName = await this.userRepository.getUserName(id);
      return this.formatBasicCharacters(personajes, userName)
    } catch (error) {
      console.error("Error obteniendo personajes:", error);
      throw new Error("No se pudieron obtener los personajes");
    }
  }

  async crear(data: TypeCrearPersonaje) {
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
      claseId,
      clase,
      saving_throws,
      proficiencies,
      subclase,
      equipment,
      traits,
      traits_data,
      money,
      feats,
      hit_die,
      prof_bonus,
      skillProficiencyPicks
    } = data

    const dataBackground = {
      ...background,
      history: background?.history?.split(/\r?\n/) ?? []
    }

    const rulesConfig = await this.systemRepository.getMergedRulesConfig(systems ?? []);
    const resolvedProfBonus = rulesConfig.proficiencyProgression?.[0] ?? prof_bonus ?? 0;

    let moneyArray: { quantity: number; unit: string }[] = [];
    if (Array.isArray(money)) {
      moneyArray = money;
    } else if (money && typeof money === 'object' && 'unit' in money) {
      moneyArray = [money as any];
    }

    let resolvedTraits = [...(traits ?? [])];
    let resolvedTraitsData = { ...(traits_data ?? {}) };
    let resolvedSubclasses: string[] = [];
    const characterClass = await this.claseRepository.getById(claseId);
    let subclassForTraits: Awaited<ReturnType<typeof this.assertSubclassAvailable>> | undefined;

    if (subclase) {
      subclassForTraits = await this.assertSubclassAvailable(subclase, claseId, systems ?? []);
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
        { classVariables: { hitDie: hit_die ?? 1 } }
      ));
    } else {
      HP = hit_die ?? 1;
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

    const personaje = new Personaje({
      name,
      user,
      img,
      background: dataBackground,
      appearance,
      attributes,
      systems,
      raceId: raceId,
      campaign,
      classes: [{ class: claseId, name: clase ?? "Ninguna", level: 1, hit_die }],
      subclasses: resolvedSubclasses,
      race: race,
      traits: resolvedTraits,
      traits_data: resolvedTraitsData,
      traitChoices: choiceResult.traitChoices,
      ...(overlayResult.overlays.length ? { skillProficiencyOverlays: overlayResult.overlays } : {}),
      prof_bonus: resolvedProfBonus,
      speed,
      size,
      languages: languages,
      saving_throws: saving_throws ?? [],
      skills: [...skills ?? []],
      proficiencies,
      spells,
      equipment: equipment,
      feats: feats ?? [],
      money: moneyArray,
      HPMax: HP,
      HPActual: HP,
      XP: 0,
      companions: normalizeCompanions(data.companions),
      traitResources: [],
      activeTraitIds: [],
      forms: [],
      activeFormId: null
    })

    const resultado = await personaje.save()

    if (resultado) {
      return await this.formatBasicCharacter(resultado)
    } else {
      return null
    }
  }

  async consultarPorId(
    idCharacter: string,
    user: string,
    options?: ConsultarPersonajeOptions
  ): Promise<PersonajeApi> {
    const personaje = await Personaje.findById(idCharacter);

    if (!personaje) {
      throw new NotFoundError("Personaje no encontrado");
    }

    await this.assertCanAccessCharacter(personaje, user);

    return this.formatCharacter(personaje, options);
  }

  async addEquipment(data: TypeAddEquipment): Promise<UpdateCharacterEquipmentResponse> {
    const { id, equipmentId, quantity, isMagic } = data;
    const personaje = await Personaje.findById(id);

    if (!personaje) {
      throw new NotFoundError("Personaje no encontrado");
    }

    const equipment = addToInventory(
      this.toInventoryRows(personaje.equipment),
      createInventoryInstance({ equipmentId, quantity, isMagic })
    );

    return this.saveInventory(id, equipment);
  }

  async deleteEquipment(data: TypeDeleteEquipment): Promise<UpdateCharacterEquipmentResponse> {
    const { id, instanceId, quantity } = data;
    const personaje = await Personaje.findById(id);

    if (!personaje) {
      throw new NotFoundError("Personaje no encontrado");
    }

    const inventory = this.toInventoryRows(personaje.equipment);
    const item = this.requireInventoryInstance(inventory, instanceId);

    if (item.isFavorite || item.equipped) {
      throw new ConflictError(
        "No se puede eliminar un equipamiento favorito o equipado"
      );
    }

    return this.saveInventory(id, removeOrDecrement(inventory, instanceId, quantity));
  }

  async equipEquipment(data: TypeEquipEquipment): Promise<{ completo: PersonajeApi, basico: PersonajeBasico }> {
    const { id, instanceId, equipped } = data;
    const personaje = await Personaje.findById(id);
    if (!personaje) {
      throw new NotFoundError("Personaje no encontrado");
    }

    let inventory = this.toInventoryRows(personaje.equipment);
    this.requireInventoryInstance(inventory, instanceId);

    if (equipped) {
      const formatted = await this.equipmentRepository.getCharacterEquipmentsByIds(
        this.toHydrationRows(inventory)
      ) ?? [];
      const slotOf = this.slotLookupFrom(formatted);
      const { inventory: next, instance } = splitOne(inventory, instanceId);
      const catalogItem = formatted.find(item => item.instanceId === instanceId);
      const traits = await this.traitRepository.getTraitsByIndexes(
        personaje.traits ?? [],
        personaje.traits_data
      );
      const blocked = catalogItem
        ? findBlockedEquipmentRestriction(catalogItem, traits)
        : undefined;
      if (blocked) {
        throw new ConflictError(
          "Un rasgo del personaje impide equipar armadura o escudo de este material"
        );
      }
      inventory = this.applyEquipOrThrow(next, instance.instanceId, true, slotOf);
    } else {
      inventory = applyEquip(inventory, instanceId, false, () => null);
    }

    return this.saveInventoryAndFormatCharacter(id, inventory);
  }

  async toggleFavoriteEquipment(data: TypeToggleFavoriteEquipment): Promise<ToggleFavoriteEquipmentResponse> {
    const { id, instanceId, isFavorite } = data;
    const personaje = await Personaje.findById(id);

    if (!personaje) {
      throw new NotFoundError("Personaje no encontrado");
    }

    let inventory = this.toInventoryRows(personaje.equipment);
    this.requireInventoryInstance(inventory, instanceId);

    let targetInstanceId = instanceId;
    if (isFavorite) {
      const split = splitOne(inventory, instanceId);
      inventory = split.inventory;
      targetInstanceId = split.instance.instanceId;
    }

    const idx = inventory.findIndex(eq => eq.instanceId === targetInstanceId);
    inventory[idx] = { ...inventory[idx], isFavorite };

    const resultado = await Personaje.findByIdAndUpdate(
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
    };
  }

  async updateMoney(id: string, money: { quantity: number; unit: string }[]): Promise<UpdateCharacterMoneyResponse> {
    const moneyArray = Array.isArray(money)
      ? money
      : (money && typeof money === "object" && "unit" in money ? [money] : []);

    const resultado = await Personaje.findByIdAndUpdate(
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

  async updateXp(id: string, xp: number, userId: string): Promise<void> {
    const personaje = await Personaje.findById(id);

    if (!personaje) {
      throw new NotFoundError("Personaje no encontrado");
    }

    await this.assertCanAccessCharacter(personaje, userId);

    await Personaje.findByIdAndUpdate(id, { $set: { XP: xp } });
  }

  async updateCompanions(
    id: string,
    companions: CharacterCompanionInput[],
    userId: string
  ): Promise<UpdateCharacterCompanionsResponse> {
    const personaje = await Personaje.findById(id);

    if (!personaje) {
      throw new NotFoundError("Personaje no encontrado");
    }

    await this.assertCanAccessCharacter(personaje, userId);

    const normalized = normalizeCompanions(companions);
    await Personaje.findByIdAndUpdate(id, { $set: { companions: normalized } });

    return { companions: normalized };
  }

  async getLevelUpData(id: string, classId: string, userId: string): Promise<LevelUpData> {
    const personaje = await Personaje.findById(id);

    if (!personaje) {
      throw new NotFoundError("Personaje no encontrado");
    }

    await this.assertCanAccessCharacter(personaje, userId);

    const { catalog, currentEntry, isNewClass } = await this.resolveLevelUpTargetClass(personaje, classId);
    const nextLevel = (currentEntry?.level ?? 0) + 1;
    const totalLevels = personaje.classes?.reduce((acc, clas) => acc + clas.level, 0) ?? 0;
    const rulesConfig = await this.systemRepository.getMergedRulesConfig(personaje.systems ?? []);
    const classLevel = await this.resolveLevelUpClassData(personaje, classId, nextLevel);
    const raceMerged = await this.withRaceLevel(
      personaje,
      classLevel.traits,
      classLevel.traits_data,
      totalLevels + 1
    );
    const ownedTraits = await this.traitRepository.getTraitsByIndexes(personaje.traits ?? []);
    const stacked = applyTraitStacking(ownedTraits, raceMerged.traits);
    const prof_bonus = rulesConfig.proficiencyProgression?.[totalLevels]
      ?? DEFAULT_PROFICIENCY_PROGRESSION[totalLevels]
      ?? 0;
    const traits = await this.translateLevelUpTraits(
      personaje,
      stacked.granted,
      mergeTraitDataMaps(personaje.traits_data, raceMerged.traits_data),
      totalLevels + 1,
      prof_bonus,
      await this.catalogChangedTraitIds(classId, nextLevel, personaje.subclasses ?? [])
    );
    const traits_data = raceMerged.traits_data;
    const { spell_choices, spell_changes, subclassChoice, ability_score, feats, skill_choices: levelSkillChoices } = classLevel;
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
    const optionChoices = await this.pendingLevelOptionChoices(
      personaje,
      classId,
      nextLevel,
      totalLevels + 1,
      stacked.granted,
      optionChoiceConfigs
    );

    return {
      class: classId,
      hit_die: this.levelUpHitDie(catalog, currentEntry, isNewClass),
      prof_bonus,
      spell_choices,
      ...(spell_changes ? { spell_changes } : {}),
      traits,
      traits_data,
      subclassChoice: subclassChoice ?? null,
      ability_score,
      feats,
      catalogChoices,
      ...(damageChoices.length ? { damageChoices } : {}),
      ...(skillProficiencyChoices.length ? { skillProficiencyChoices } : {}),
      ...(skill_choices ? { skill_choices } : {}),
      newClass: isNewClass,
      ...(requirementsMet !== undefined ? { requirementsMet } : {}),
      ...(isNewClass ? { dip: this.buildLevelUpDip(personaje, catalog, requirementsMet ?? true) } : {}),
      ...(optionChoices.length ? { optionChoices } : {}),
    };
  }

  async levelUp(data: TypeLevelUp): Promise<{ completo: PersonajeApi, basico: PersonajeBasico }> {
    const { id, classId, hpIncrease, userId, spells, subclass, abilityScore, feat, traitChoices, skillPicks, skillProficiencyPicks, proficiencyPicks, spellReplacements, optionPicks } = data;
    const personaje = await Personaje.findById(id);

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
    const classLevel = await this.resolveLevelUpClassData(personaje, classId, nextLevel, nextSubclassIds);
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
    const { spell_choices, ability_score, feats } = classLevel;
    const levelTraits = mergedLevel.traits;
    const levelTraitsData = mergedLevel.traits_data;
    const pickResult = validateLevelUpSpellPicks(spell_choices, spells, ownedSpellIds);
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
    const ownedFeatIds = getOwnedFeatIds(personaje);
    const asiResult = validateLevelUpAbilityScorePick({
      abilityScoreGranted: ability_score,
      increases: abilityScore?.increases,
      featId: feat,
      attributes: personaje.attributes ?? [],
      availableFeatIds: feats?.options.map(option => option.id) ?? [],
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
      personaje.traits_data,
      levelTraits,
      levelTraitsData,
      ownedTraits
    );
    const optionAssignedSubclasses = await this.getAssignedSubclassesForClass(nextSubclassIds, classId);
    const optionPickResult = await this.applyLevelUpOptionPicks({
      personaje,
      classId,
      nextLevel,
      characterLevel: totalLevels + 1,
      extraTraitIds: nextTraits,
      configs: this.mergeLevelOptionChoiceConfigs(
        classLevel.optionChoices,
        catalog.optionReplacements,
        optionAssignedSubclasses,
        personaje.optionSelections ?? [],
        classId
      ),
      picks: optionPicks
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
    const levelUpClassDoc = await this.claseRepository.getById(classId);
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
      ?? personaje.prof_bonus
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

    const resultado = await Personaje.findByIdAndUpdate(
      id,
      {
        $set: {
          XP: 0,
          prof_bonus: Math.max(newProfBonus, personaje.prof_bonus ?? 0),
          traits: nextTraits,
          traits_data: nextTraitsData,
          traitChoices: choiceResult.traitChoices,
          skillProficiencyOverlays: overlayResult.overlays,
          subclasses: nextSubclassIds,
          ...(spellsUpdate ? { spells: spellsUpdate } : {}),
          ...(extraSpellsUpdate ? { extraSpells: extraSpellsUpdate } : {}),
          ...(preparedSpellsUpdate ? { preparedSpells: preparedSpellsUpdate } : {}),
          ...(nextAttributes ? { attributes: nextAttributes } : {}),
          ...(asiResult.kind === "feat" ? { feats: [...ownedFeatIds, asiResult.featId] } : {}),
          ...(isNewClass || skillPickResult.ids.length ? { skills: nextSkills } : {}),
          ...(isNewClass ? { proficiencies: nextProficiencies } : {}),
          optionSelections: optionPickResult.selections,
        },
        $inc: isNewClass
          ? { HPMax: HP, HPActual: HP }
          : { "classes.$[elem].level": 1, HPMax: HP, HPActual: HP },
        ...(isNewClass
          ? {
              $push: {
                classes: {
                  class: classId,
                  name: catalog.name,
                  level: 1,
                  hit_die: catalog.hit_die ?? 8
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

    const completo = await this.formatCharacter(resultado);
    const basico = await this.formatBasicCharacter(resultado);

    return {
      completo,
      basico,
    };
  }

  async getByIds(indices: string[]): Promise<PersonajeBasico[]> {
    try {
      const personajes = await Personaje.find().where('_id').in(indices)
        .collation({ locale: 'es', strength: 1 })
        .sort({ name: 1 });
      return this.formatBasicCharacters(personajes)
    } catch (error) {
      console.error("Error obteniendo personajes:", error);
      throw new Error("No se pudieron obtener los personajes");
    }
  }

  async getCampaignLink(characterId: string): Promise<CharacterCampaignLink | null> {
    const personaje = await Personaje.findById(characterId).lean<PersonajeMongo | null>();

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

  async assignToCampaign(characterId: string, campaignId: string): Promise<PersonajeBasico | null> {
    const resultado = await Personaje.findByIdAndUpdate(
      characterId,
      { $set: { campaign: campaignId } },
      { returnDocument: "after" }
    );

    if (!resultado) {
      return null;
    }

    return this.formatBasicCharacter(resultado);
  }

  async bindPactEquipment(data: TypeBindPactEquipment): Promise<{ completo: PersonajeApi, basico: PersonajeBasico }> {
    const { id, instanceId, isBond } = data;
    const personaje = await Personaje.findById(id);

    if (!personaje) {
      throw new NotFoundError("Personaje no encontrado");
    }

    let inventory = this.toInventoryRows(personaje.equipment);
    const item = this.requireInventoryInstance(inventory, instanceId);

    if (isBond) {
      if (!item.isMagic) {
        throw new ValidationError("Solo se puede vincular un pacto con equipamiento mágico");
      }

      const split = splitOne(inventory, instanceId);
      inventory = split.inventory;
      const idx = inventory.findIndex(eq => eq.instanceId === split.instance.instanceId);
      inventory[idx] = { ...inventory[idx], isBond: true, quantity: 1 };
    } else {
      const idx = inventory.findIndex(eq => eq.instanceId === instanceId);
      inventory[idx] = { ...inventory[idx], isBond: false };
      inventory = tryMerge(inventory, instanceId);
    }

    return this.saveInventoryAndFormatCharacter(id, inventory);
  }

  async learnSpells(data: TypeLearnSpells): Promise<PersonajeApi> {
    const { id, classId, spells, userId } = data
    const personaje = await Personaje.findById(id)

    if (!personaje) {
      throw new NotFoundError("Personaje no encontrado")
    }

    await this.assertCanAccessCharacter(personaje, userId)

    const classEntry = personaje.classes?.find(clas => clas.class === classId)
    if (!classEntry) {
      throw new ValidationError("El personaje no tiene esa clase")
    }

    const sources = await this.claseRepository.getSpellcastingSources([
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

    const resultado = await Personaje.findByIdAndUpdate(
      id,
      { $set: { spells: spellsUpdate } },
      { returnDocument: "after" }
    )

    if (!resultado) {
      throw new NotFoundError("Personaje no encontrado")
    }

    return this.formatCharacter(resultado)
  }

  async prepareSpells(data: TypePrepareSpells): Promise<PersonajeApi> {
    const { id, classId, spells, userId } = data
    const personaje = await Personaje.findById(id)

    if (!personaje) {
      throw new NotFoundError("Personaje no encontrado")
    }

    await this.assertCanAccessCharacter(personaje, userId)

    const classEntry = personaje.classes?.find(clas => clas.class === classId)
    if (!classEntry) {
      throw new ValidationError("El personaje no tiene esa clase")
    }

    const sources = await this.claseRepository.getSpellcastingSources([
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
      personaje.prof_bonus ?? 0
    )
    const privilegeInstances = getCharacterSpellPrivileges(personaje.spellPrivileges)
    const privilegeTraitIds = [...new Set(
      privilegeInstances.filter(item => item.classId === classId).map(item => item.traitId)
    )]
    const privilegeTraits = privilegeTraitIds.length
      ? await this.traitRepository.getTraitsByIndexes(privilegeTraitIds)
      : []
    const rulesByTraitId = this.buildPrivilegeRulesMap(privilegeTraits, privilegeInstances)
    const excludedFromCap = privilegeSpellIdsExcludedFromCap(privilegeInstances, rulesByTraitId, classId)
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

    const resultado = await Personaje.findByIdAndUpdate(
      id,
      { $set: { preparedSpells } },
      { returnDocument: "after" }
    )

    if (!resultado) {
      throw new NotFoundError("Personaje no encontrado")
    }

    return this.formatCharacter(resultado)
  }

  async bindSpellPrivileges(data: TypeBindSpellPrivileges): Promise<PersonajeApi> {
    const { id, traitId, classId, selections, userId } = data
    const personaje = await Personaje.findById(id)

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
    const replaceCheck = canReplaceSpellPrivileges({
      hasExistingInstance: Boolean(existing),
      rules
    })
    if (replaceCheck.error) {
      throw new ValidationError(replaceCheck.error)
    }

    const selectionIds = selections.flat()
    const [loadedSpells, extraClassSpellIds] = await Promise.all([
      selectionIds.length
        ? this.spellRepository.getSpellsByIndexes(selectionIds)
        : Promise.resolve([]),
      this.extraClassSpellIds(personaje, classId)
    ])
    const classEntry = personaje.classes?.find(clas => clas.class === classId)
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
          classIds: (spell.classes ?? []).map(clas => clas.id)
        })),
      extraClassSpellIds
    })
    if (validation.error) {
      throw new ValidationError(validation.error)
    }

    const nextInstance: CharacterSpellPrivilegeMongo = {
      traitId,
      classId,
      selections: selections.map(group => [...group])
    }
    const nextPrivileges = [
      ...instances.filter(item =>
        !(item.classId === classId && (item.traitId === traitId || item.traitId === trait.id))
      ),
      nextInstance
    ]

    const resultado = await Personaje.findByIdAndUpdate(
      id,
      { $set: { spellPrivileges: nextPrivileges } },
      { returnDocument: "after" }
    )

    if (!resultado) {
      throw new NotFoundError("Personaje no encontrado")
    }

    return this.formatCharacter(resultado)
  }

  async useTrait(data: TypeUseTrait): Promise<PersonajeApi> {
    const { id, traitId, userId } = data;
    const personaje = await Personaje.findById(id);
    if (!personaje) {
      throw new NotFoundError("Personaje no encontrado");
    }
    await this.assertCanAccessCharacter(personaje, userId);

    const loadedTraits = await this.traitRepository.getTraitsByIndexes([traitId]);
    const trait = loadedTraits[0];
    if (!trait?.id) {
      throw new NotFoundError("Rasgo no encontrado");
    }

    const grantingClassLevelByTraitId = await this.loadGrantingClassLevels(personaje);
    const traitResources = normalizeTraitResources(personaje.traitResources);
    const activeTraitIds = normalizeActiveTraitIds(personaje.activeTraitIds);
    const equipment = await this.equipmentRepository.getCharacterEquipmentsByIds(
      this.toHydrationRows(personaje.equipment)
    );
    const result = applyUseTraitAction({
      ownsTrait: characterHasTrait(personaje.traits ?? [], [traitId, trait.id]),
      trait,
      requestedTraitId: traitId,
      classLevel: grantingClassLevelByTraitId.get(trait.id),
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

    return this.persistTraitStance(id, result.traitResources, result.activeTraitIds);
  }

  async deactivateTrait(data: TypeUseTrait): Promise<PersonajeApi> {
    const { id, traitId, userId } = data;
    const personaje = await Personaje.findById(id);
    if (!personaje) {
      throw new NotFoundError("Personaje no encontrado");
    }
    await this.assertCanAccessCharacter(personaje, userId);

    const loadedTraits = await this.traitRepository.getTraitsByIndexes([traitId]);
    const trait = loadedTraits[0];
    const result = applyDeactivateTrait({
      traitId,
      aliases: trait?.id ? [trait.id] : [],
      traitResources: normalizeTraitResources(personaje.traitResources),
      activeTraitIds: normalizeActiveTraitIds(personaje.activeTraitIds)
    });
    if (!result.ok) {
      throw new ValidationError(result.message);
    }

    return this.persistTraitStance(id, result.traitResources, result.activeTraitIds);
  }

  async restCharacter(data: TypeRestCharacter): Promise<PersonajeApi> {
    const { id, type, userId } = data;
    const personaje = await Personaje.findById(id);
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
    const recovery = resolveHitPointRecovery(rulesConfig.restRules, type);
    const recovered = applyHitPointRecovery({
      hp: recovery.hp,
      hitDice: recovery.hitDice,
      pools,
      spent,
      hpActual: Number(personaje.HPActual) || 0,
      hpMax: Number(personaje.HPMax) || 0,
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

    return this.persistTraitStance(
      id,
      next.traitResources,
      next.activeTraitIds,
      data.traitChoices !== undefined ? choiceResult.traitChoices : undefined,
      {
        HPActual: recovered.hpActual,
        hitDiceSpent: recovered.spent,
        spellSlotsSpent: recoveredSlots,
        activeConditions: recoveredConditions
      }
    );
  }

  async spendHitDice(data: TypeSpendHitDice): Promise<PersonajeApi> {
    const { id, classId, count, hpGained, userId } = data;
    const personaje = await Personaje.findById(id);
    if (!personaje) {
      throw new NotFoundError("Personaje no encontrado");
    }
    await this.assertCanAccessCharacter(personaje, userId);

    const pools = classPoolsFromCharacter(personaje.classes ?? []);
    const spent = normalizeHitDiceSpent(
      personaje.hitDiceSpent,
      pools.map((pool) => pool.classId)
    );
    const attributes = await this.formatSheetAttributes(personaje);
    const abilityModifier = attributes.find((attr) => attr.key === HIT_DICE_ABILITY_KEY)?.modifier ?? 0;
    const result = applySpendHitDice({
      classId,
      count,
      hpGained,
      pools,
      spent,
      hpActual: Number(personaje.HPActual) || 0,
      hpMax: Number(personaje.HPMax) || 0,
      abilityModifier,
    });
    if (!result.ok) {
      throw new ValidationError(result.message);
    }

    const updated = await Personaje.findByIdAndUpdate(
      id,
      { $set: { HPActual: result.hpActual, hitDiceSpent: result.spent } },
      { returnDocument: "after" }
    );
    if (!updated) {
      throw new NotFoundError("Personaje no encontrado");
    }
    return this.formatCharacter(updated);
  }

  async spendSpellSlot(data: TypeSpendSpellSlot): Promise<PersonajeApi> {
    const { id, classId, pool, level, userId } = data;
    const personaje = await Personaje.findById(id);
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

    const updated = await Personaje.findByIdAndUpdate(
      id,
      { $set: { spellSlotsSpent: result.spent } },
      { returnDocument: "after" }
    );
    if (!updated) {
      throw new NotFoundError("Personaje no encontrado");
    }
    return this.formatCharacter(updated);
  }

  async applyCharacterCondition(data: TypeApplyCharacterCondition): Promise<PersonajeApi> {
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

  async updateCharacterCondition(data: TypeUpdateCharacterCondition): Promise<PersonajeApi> {
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

  async removeCharacterCondition(data: TypeRemoveCharacterCondition): Promise<PersonajeApi> {
    const { id, conditionId, userId } = data;
    const personaje = await this.requireAccessibleCharacter(id, userId);
    const result = removeCondition(normalizeActiveConditions(personaje.activeConditions), conditionId);
    if (!result.ok) {
      throw new ValidationError(result.message);
    }
    return this.persistActiveConditions(id, result.next);
  }

  async getOwnedTraitIds(id: string, userId: string): Promise<string[]> {
    const personaje = await Personaje.findById(id);
    if (!personaje) {
      throw new NotFoundError("Personaje no encontrado");
    }
    await this.assertCanAccessCharacter(personaje, userId);
    return Array.isArray(personaje.traits) ? [...personaje.traits] : [];
  }

  async addForm(data: TypeAddCharacterFormPersist): Promise<PersonajeApi> {
    const { id, userId, entry, choose, replaceOnRecast } = data;
    const personaje = await Personaje.findById(id);
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
      if (activeFormId && ids.has(activeFormId) && formPurposeOverlaysCharacter(entry.purpose)) {
        activeFormId = newForm.id;
      } else if (activeFormId && ids.has(activeFormId)) {
        activeFormId = null;
      }
      if (next.length > MAX_CHARACTER_FORMS) {
        throw new ValidationError(`No se pueden registrar más de ${MAX_CHARACTER_FORMS} formas`);
      }
      return this.persistCharacterForms(id, next, activeFormId);
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

  async activateForm(data: TypeSetCharacterFormActive): Promise<PersonajeApi> {
    const { id, formId, userId } = data;
    const personaje = await Personaje.findById(id);
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

    return this.persistCharacterForms(id, forms, formId);
  }

  async deactivateForm(data: TypeSetCharacterFormActive): Promise<PersonajeApi> {
    const { id, formId, userId } = data;
    const personaje = await Personaje.findById(id);
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

    return this.persistCharacterForms(id, forms, null);
  }

  private async persistCharacterForms(
    id: string,
    forms: CharacterFormMongo[],
    activeFormId: string | null
  ): Promise<PersonajeApi> {
    const resultado = await Personaje.findByIdAndUpdate(
      id,
      { $set: { forms, activeFormId } },
      { returnDocument: "after" }
    );
    if (!resultado) {
      throw new NotFoundError("Personaje no encontrado");
    }
    return this.formatCharacter(resultado);
  }

  private getClassSpellIds(personaje: PersonajeMongo, classId: string): string[] {
    const ids = personaje.spells?.[classId];
    return Array.isArray(ids) ? ids : [];
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
    personaje: PersonajeMongo,
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
    personaje: PersonajeMongo,
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
    personaje: PersonajeMongo,
    classId: string,
    classLevel: number,
    enteringTraits: TraitApi[]
  ): Promise<PendingCatalogChoice[]> {
    const classDoc = await this.claseRepository.getById(classId);
    const subclasses = await this.getAssignedSubclassesForClass(personaje.subclasses ?? [], classId);
    const grantedIds = collectClassGrantedTraitIds(
      classDoc?.levels ?? [],
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
    personaje: PersonajeMongo,
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
    personaje: PersonajeMongo,
    classId: string
  ): Promise<{ catalog: CharacterClassApi; currentEntry?: PersonajeMongo["classes"][number]; isNewClass: boolean }> {
    const catalog = await this.claseRepository.getById(classId);
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
    currentEntry: PersonajeMongo["classes"][number] | undefined,
    isNewClass: boolean
  ): number {
    if (isNewClass) return catalog.hit_die ?? 8;
    const stored = Number(currentEntry?.hit_die);
    if (Number.isFinite(stored) && stored > 0) return stored;
    return catalog.hit_die ?? 8;
  }

  private async levelUpRequirementsMet(
    personaje: PersonajeMongo,
    catalog: CharacterClassApi,
    isNewClass: boolean
  ): Promise<boolean | undefined> {
    const ownedCount = personaje.classes?.length ?? 0;
    if (!shouldEnforceMulticlassRequirements(ownedCount, isNewClass)) return undefined;

    const ownedIds = (personaje.classes ?? []).map(item => item.class);
    const ids = isNewClass ? [...ownedIds, catalog.id] : ownedIds;
    const catalogs = await Promise.all(
      ids.map(id => id === catalog.id ? Promise.resolve(catalog) : this.claseRepository.getById(id))
    );

    return characterMeetsAllClassRequirements(
      catalogs.map(item => item?.multiclass),
      personaje.attributes ?? []
    );
  }

  private buildLevelUpDip(
    personaje: PersonajeMongo,
    catalog: CharacterClassApi,
    requirementsMet: boolean
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
      proficiencies: granted,
      skill_choices,
      ...(proficiencies_choices.length ? { proficiencies_choices } : {})
    };
  }

  private validateDipPicks(
    personaje: PersonajeMongo,
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
    personaje: PersonajeMongo,
    classId: string,
    nextLevel: number,
    subclassIds?: string[]
  ): Promise<{
    hit_die: number;
    spell_choices?: ChoiceApi<SpellApi>[];
    spell_changes?: LevelUpSpellChanges;
    traits: TraitApi[];
    traits_data: TraitDataMongo;
    subclassChoice?: SubclassChoiceMenuApi | null;
    ability_score: boolean;
    feats?: ChoiceApi<FeatApi>;
    skill_choices?: ChoiceApi<SkillApi>;
    skillProficiencyChoices?: LevelSkillProficiencyChoice[];
    optionChoices?: OptionChoiceMongo[];
  }> {
    const assignedSubclassIds = subclassIds ?? personaje.subclasses ?? [];
    const [dataLevel, clase, assignedSubclasses] = await Promise.all([
      this.claseRepository.dataLevelUp(
        classId,
        nextLevel,
        assignedSubclassIds,
        personaje.systems ?? []
      ),
      this.claseRepository.getById(classId),
      this.getAssignedSubclassesForClass(assignedSubclassIds, classId)
    ]);
    const expandedSpells = collectExpandedSpells(assignedSubclasses);
    const knownSpellIds = this.getClassSpellIds(personaje, classId);
    const ownedSpellIds = [...knownSpellIds, ...getExtraSpellIds(personaje.extraSpells, classId)];
    const extraSpellIdsForClass = getExtraSpellIds(personaje.extraSpells, classId);
    const cantripChoicesRaw = await this.buildCantripSpellChoices(
      classId,
      clase?.levels ?? [],
      nextLevel,
      knownSpellIds,
      dataLevel?.spell_choices,
      expandedSpells
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
      expandedSpells
    );
    const extraChoices = dataLevel?.spell_choices?.length
      ? excludeKnownSpellOptions(dataLevel.spell_choices, ownedSpellIds)
      : dataLevel?.spell_choices;
    const synthesized = [...(cantripChoices ?? []), ...(knownSpellChoices ?? [])];
    const spell_choices = synthesized.length
      ? [...synthesized, ...(extraChoices ?? [])]
      : extraChoices;
    const spell_changes = await this.buildSpellReplacementMenu(
      classId,
      clase,
      nextLevel,
      knownSpellIds,
      expandedSpells
    );

    const ability_score = Boolean(dataLevel?.ability_score);
    const feats = ability_score
      ? filterLevelUpFeatChoices(
          dataLevel?.feats,
          getOwnedFeatIds(personaje),
          personaje.attributes ?? []
        )
      : undefined;

    return {
      hit_die: dataLevel?.hit_die ?? 8,
      spell_choices,
      ...(spell_changes ? { spell_changes } : {}),
      traits: dataLevel?.traits ?? [],
      traits_data: dataLevel?.traits_data ?? {},
      subclassChoice: dataLevel?.subclassChoice ?? null,
      ability_score,
      feats,
      skill_choices: dataLevel?.skill_choices,
      skillProficiencyChoices: dataLevel?.skillProficiencyChoices,
      optionChoices: dataLevel?.optionChoices,
    };
  }

  private characterSpellIds(personaje: PersonajeMongo): string[] {
    const known = Object.values(personaje.spells ?? {}).flat();
    const extra = Object.values(personaje.extraSpells ?? {}).flat();
    return [...new Set([...known, ...extra])];
  }

  private classLevelsMap(personaje: PersonajeMongo, classId: string, nextLevel: number): Record<string, number> {
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
    personaje: PersonajeMongo,
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
    subclasses: SubclassApi[],
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

  private async pendingLevelOptionChoices(
    personaje: PersonajeMongo,
    classId: string,
    nextLevel: number,
    characterLevel: number,
    extraTraits: TraitApi[],
    configs: OptionChoiceMongo[] | undefined
  ): Promise<PendingOptionChoice[]> {
    if (!configs?.length) return [];

    const extraTraitIds = extraTraits.map(trait => trait.id).filter((id): id is string => Boolean(id));
    const options = await this.groupOptionRepository.getBySystems(personaje.systems ?? []);
    const groups = await this.optionGroupRepository.getByIds(configs.map(config => config.groupId));
    const groupNames = Object.fromEntries(groups.map(group => [group.id, group.name]));

    return buildPendingOptionChoices({
      configs,
      options,
      selections: personaje.optionSelections ?? [],
      context: this.prerequisiteContext(personaje, classId, nextLevel, characterLevel, extraTraitIds),
      groupNames
    });
  }

  private async applyLevelUpOptionPicks(params: {
    personaje: PersonajeMongo;
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
    const options = params.configs?.length
      ? await this.groupOptionRepository.getBySystems(params.personaje.systems ?? [])
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
    personaje: PersonajeMongo,
    classTraits: TraitApi[],
    classTraitsData: TraitDataMongo,
    characterLevel: number
  ): Promise<{ traits: TraitApi[]; traits_data: TraitDataMongo }> {
    if (!personaje.raceId) {
      return mergeClassAndRaceLevelUp(classTraits, classTraitsData, [], undefined);
    }

    const raceLevel = await this.raceRepository.getLevelUpData(personaje.raceId, characterLevel);

    return mergeClassAndRaceLevelUp(classTraits, classTraitsData, [], raceLevel?.traits_data);
  }

  private async translateLevelUpTraits(
    personaje: PersonajeMongo,
    traits: TraitApi[],
    traitsData: TraitDataMongo,
    characterLevel: number,
    proficiencyBonus: number,
    extraChangedIds: string[] = []
  ): Promise<TraitApi[]> {
    const changedIds = [
      ...await this.raceChangedTraitIds(personaje, characterLevel),
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
    const attributes = await this.formatSheetAttributes(personaje);
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

  private async raceChangedTraitIds(personaje: PersonajeMongo, characterLevel: number): Promise<string[]> {
    if (!personaje.raceId) return [];

    const [raceLevel, previousRaceLevel] = await Promise.all([
      this.raceRepository.getLevelUpData(personaje.raceId, characterLevel),
      this.raceRepository.getLevelUpData(personaje.raceId, characterLevel - 1)
    ]);
    return traitIdsWithChangedData(raceLevel?.traits_data, previousRaceLevel?.traits_data);
  }

  private async catalogChangedTraitIds(
    classId: string,
    classLevel: number,
    subclassIds: string[]
  ): Promise<string[]> {
    const [classDoc, subclasses] = await Promise.all([
      this.claseRepository.getById(classId),
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
    personaje: PersonajeMongo,
    classId: string,
    nextLevel: number,
    subclassId?: string
  ): Promise<string[]> {
    const assigned = await this.getAssignedSubclassesForClass(personaje.subclasses ?? [], classId);
    const classDoc = await this.claseRepository.getById(classId);
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

  private async getAssignedSubclassesForClass(subclassIds: string[], classId: string): Promise<SubclassApi[]> {
    if (!subclassIds.length) return [];
    const docs = await this.subclassRepository.getByIds(subclassIds);
    return docs.filter(item => item.classId === classId);
  }

  private async extraClassSpellIds(personaje: PersonajeMongo, classId: string): Promise<string[]> {
    const subclasses = await this.getAssignedSubclassesForClass(personaje.subclasses ?? [], classId);
    return collectExpandedSpells(subclasses)
      .map(spell => spell.id)
      .filter((id): id is string => Boolean(id));
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

  private async persistTraitStance(
    id: string,
    traitResources: CharacterTraitResource[],
    activeTraitIds: string[],
    traitChoices?: TraitChoices,
    extras?: { HPActual?: number; hitDiceSpent?: CharacterHitDiceSpent[]; spellSlotsSpent?: CharacterSpellSlotSpent[]; activeConditions?: CharacterActiveCondition[] }
  ): Promise<PersonajeApi> {
    const resultado = await Personaje.findByIdAndUpdate(
      id,
      {
        $set: {
          traitResources,
          activeTraitIds,
          ...(traitChoices !== undefined ? { traitChoices } : {}),
          ...(extras?.HPActual !== undefined ? { HPActual: extras.HPActual } : {}),
          ...(extras?.hitDiceSpent !== undefined ? { hitDiceSpent: extras.hitDiceSpent } : {}),
          ...(extras?.spellSlotsSpent !== undefined ? { spellSlotsSpent: extras.spellSlotsSpent } : {}),
          ...(extras?.activeConditions !== undefined ? { activeConditions: extras.activeConditions } : {})
        }
      },
      { returnDocument: "after" }
    );
    if (!resultado) {
      throw new NotFoundError("Personaje no encontrado");
    }
    return this.formatCharacter(resultado);
  }

  private async persistActiveConditions(id: string, activeConditions: CharacterActiveCondition[]): Promise<PersonajeApi> {
    const updated = await Personaje.findByIdAndUpdate(
      id,
      { $set: { activeConditions } },
      { returnDocument: "after" }
    );
    if (!updated) {
      throw new NotFoundError("Personaje no encontrado");
    }
    return this.formatCharacter(updated);
  }

  private async requireAccessibleCharacter(id: string, userId: string): Promise<PersonajeMongo> {
    const personaje = await Personaje.findById(id);
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

  private async loadExpandedTraits(personaje: PersonajeMongo): Promise<TraitApi[]> {
    const loaded = await this.traitRepository.getTraitsByIndexes(personaje.traits ?? []);
    return this.expandTraitsForSystems(
      loaded,
      personaje.systems,
      this.chosenCreatureTypeIds(loaded, personaje.traitChoices),
      this.chosenDamageTypeIds(loaded, personaje.traitChoices)
    );
  }

  private async loadSpellSlotPools(personaje: PersonajeMongo) {
    const sources = (await this.claseRepository.getSpellcastingSources?.(
      (personaje.classes ?? []).map((entry) => ({
        id: entry.class,
        level: entry.level
      }))
    )) ?? [];
    return slotPoolsFromSources(sources);
  }

  private async loadGrantingClassLevels(
    personaje: PersonajeMongo,
    subclassById?: Map<string, SubclassApi>
  ): Promise<Map<string, number>> {
    const classCatalogs = (
      await Promise.all(
        (personaje.classes ?? []).map(entry => this.claseRepository.getById(entry.class))
      )
    ).filter((item): item is CharacterClassApi => Boolean(item));
    const subclasses = subclassById ?? await this.getSubclassMapByIds(personaje.subclasses ?? []);
    return buildTraitGrantingClassLevels(
      personaje.classes ?? [],
      classCatalogs,
      [...subclasses.values()]
    );
  }

  private async getSubclassMapByIds(ids: string[]): Promise<Map<string, SubclassApi>> {
    const uniqueIds = [...new Set(ids.filter(Boolean))];
    if (!uniqueIds.length) return new Map();
    const docs = await this.subclassRepository.getByIds(uniqueIds);
    return new Map(docs.map(item => [item.id, item]));
  }

  private mapSubclassSummaries(ids: string[], byId: Map<string, SubclassApi>): CharacterSubclassApi[] {
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
    subclassById?: Map<string, SubclassApi>
  ): Promise<CharacterSubclassApi[]> {
    if (!ids.length) return [];
    const byId = subclassById ?? await this.getSubclassMapByIds(ids);
    return this.mapSubclassSummaries(ids, byId);
  }

  private async buildCantripSpellChoices(
    classId: string,
    levels: { level: number; spellcasting?: { cantrips?: number } }[],
    targetLevel: number,
    knownSpellIds: string[],
    persistedChoices?: ChoiceApi<SpellApi>[],
    expandedSpells: SpellApi[] = []
  ): Promise<ChoiceApi<SpellApi>[] | undefined> {
    if (hasCantripSpellChoice(persistedChoices)) return undefined;

    const cap = resolveClassSpellSlotsForLevel(levels, targetLevel)?.cantrips;
    const knownSpells = knownSpellIds.length
      ? await this.spellRepository.getSpellsByIndexes(knownSpellIds)
      : [];
    const knownCantrips = knownSpells.filter(spell => spell.level === 0);
    const choose = remainingCantripPicks(cap, knownCantrips.length);
    if (choose <= 0) return undefined;

    const formatted = await this.spellRepository.formatSpellChoices([
      buildCantripSpellChoice(classId, choose),
    ]);
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
    persistedChoices?: ChoiceApi<SpellApi>[],
    expandedSpells: SpellApi[] = []
  ): Promise<ChoiceApi<SpellApi>[] | undefined> {
    const synthesized = buildSynthesizedKnownSpellChoice(
      classId,
      levels,
      targetLevel,
      persistedChoices
    );
    if (!synthesized) return undefined;

    const formatted = await this.spellRepository.formatSpellChoices([synthesized]);
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
    expandedSpells: SpellApi[] = []
  ): Promise<LevelUpSpellChanges | undefined> {
    const config = clase?.spellReplacement;
    if (!config) return undefined;

    const includeCantrips = Boolean(config.includeCantrips);
    const knownSpells = knownSpellIds.length
      ? await this.spellRepository.getSpellsByIndexes(knownSpellIds)
      : [];
    const knownInputs = knownSpells
      .filter((spell): spell is SpellApi & { id: string } => Boolean(spell.id))
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

    const formatted = await this.spellRepository.formatSpellChoices([toChoice]);
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
    };
  }

  private async assertCanLearnClassCantrips(
    personaje: PersonajeMongo,
    classId: string,
    newSpellIds: string[]
  ): Promise<void> {
    const clase = await this.claseRepository.getById(classId);
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

  private async assertCanAccessCharacter(
    personaje: PersonajeMongo,
    userId: string
  ): Promise<void> {
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
  }

  private async formatBasicCharacters(personajes: PersonajeMongo[], userName?: string): Promise<PersonajeBasico[]> {
    const campaignIds = [...new Set(
      personajes
        .map((p) => p.campaign)
        .filter((id): id is string => Boolean(id))
    )];

    const campaignMap = await this.campaignReader.getNamesByIds(campaignIds);
    const subclassById = await this.getSubclassMapByIds(
      personajes.flatMap((personaje) => personaje.subclasses ?? [])
    );

    return Promise.all(personajes.map((personaje) => {
      const campaignName = personaje.campaign
        ? campaignMap.get(personaje.campaign.toString())
        : undefined;
      return this.formatBasicCharacter(personaje, userName, campaignName, subclassById);
    }));
  }

  private async formatBasicCharacter(
    personaje: PersonajeMongo,
    userName?: string,
    campaignName?: string,
    subclassById?: Map<string, SubclassApi>
  ): Promise<PersonajeBasico> {
    const level = personaje?.classes?.map((cl: any) => cl.level).reduce((acumulador: number, valorActual: number) => acumulador + valorActual, 0) ?? 0
    const user = userName ?? await this.userRepository.getUserName(personaje?.user ?? null)

    const traits = await this.traitRepository.getTraitsByIndexes(personaje?.traits, personaje?.traits_data)
    const overlaidAttributes = applyTraitAbilityScores(personaje.attributes, traits).attributes
    const { CA } = await this.calcularCA(personaje, traits)
    const rulesConfig = await this.systemRepository.getMergedRulesConfig(personaje.systems ?? []);

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
      attributes: overlaidAttributes,
      systems: personaje.systems ?? [],
      speed: personaje.speed,
      race: personaje.race,
      campaign: finalCampaignName,
      classes: personaje?.classes?.map((clas: any) => { return { name: clas.name, level: clas.level } }) ?? [],
      subclasses,
      CA,
      HPMax: personaje.HPMax,
      HPActual: personaje.HPActual,
      XP: personaje.XP,
      XPMax: rulesConfig.xpProgression?.[level]
        ?? DEFAULT_XP_PROGRESSION[level]
        ?? DEFAULT_XP_PROGRESSION[level - 1]
        ?? 0,
    }
  }

  private async calcularCA(
    personaje: PersonajeMongo,
    traits: TraitApi[],
    options?: {
      equipment?: CharacterEquipmentApi[];
      attributes?: CharacterAttributeApi[];
    }
  ) {
    const equipment = options?.equipment
      ?? await this.equipmentRepository.getCharacterEquipmentsByIds(
        this.toHydrationRows((personaje.equipment ?? []).filter(eq => eq.equipped))
      )
      ?? [];

    const attributes = options?.attributes ?? await this.formatSheetAttributes(personaje, traits);

    const rulesConfig = await this.systemRepository.getMergedRulesConfig(personaje.systems ?? []);
    let baseUnarmoredAc: number;
    if (rulesConfig.baseAcFormula) {
      baseUnarmoredAc = evaluateFormula(rulesConfig.baseAcFormula, attributes);
    } else {
      const dexAttr = attributes.find(a => a.key === "dex");
      const dexMod = dexAttr?.modifier ?? Math.floor(((dexAttr?.value ?? 10) / 2) - 5);
      baseUnarmoredAc = 10 + dexMod;
    }

    return {
      CA: computeArmorClass({
        equipment,
        traits,
        attributes,
        baseUnarmoredAc
      })
    };
  }

  private async formatCharacter(
    personaje: PersonajeMongo,
    options?: ConsultarPersonajeOptions
  ): Promise<PersonajeApi> {
    const level = personaje.classes.map(cl => cl.level).reduce((acumulador: number, valorActual: number) => acumulador + valorActual, 0)

    const loadedTraits = await this.traitRepository.getTraitsByIndexes(personaje?.traits, personaje?.traits_data)
    const expandedTraits = await this.expandTraitsForSystems(
      loadedTraits,
      personaje.systems,
      this.chosenCreatureTypeIds(loadedTraits, personaje.traitChoices),
      this.chosenDamageTypeIds(loadedTraits, personaje.traitChoices)
    )
    const raceRefs = await this.raceRefsForLabels(personaje.traitChoices)
    const resolvedSheet = resolveCharacterTraitChoices(expandedTraits, personaje.traitChoices, raceRefs)
    const traits = resolvedSheet.traits
    const optionSelections = await this.formatOptionSelections(personaje.optionSelections ?? [])
    const skills = [...(personaje?.skills ?? [])]

    const idiomasId = personaje?.languages ?? []
    const proficiencies = await this.proficiencyRepository.getProficienciesByIndices(personaje?.proficiencies ?? [])

    const resistances: Damage[] = []

    const condition_inmunities: { name: string, estados: ConditionApi[] }[] = []

    let speed = personaje?.speed

    traits.forEach(trait => {
      if (trait?.skills) {
        skills.push(...trait?.skills)
      }

      if (trait.resistances) {
        resistances.push(...trait.resistances)
      }

      if (trait.condition_inmunities.length > 0) {
        condition_inmunities.push({
          name: trait.name,
          estados: trait?.condition_inmunities ?? []
        })
      }

      if (trait?.proficiencies) {
        proficiencies.push(...trait?.proficiencies)
      }
    })

    const conditional_resistances = aggregateConditionalResistances(traits)
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

    const descendantProficiencies = await this.proficiencyRepository.getDescendantProficiencies(
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
    const equipment = await this.equipmentRepository.getCharacterEquipmentsByIds(this.toHydrationRows(personaje.equipment))

    const clases = personaje.classes

    const spellcastingSources = (await this.claseRepository.getSpellcastingSources?.(
      personaje.classes.map(clase => {
        return {
          id: clase.class,
          level: clase.level
        }
      })
    )) ?? []

    const abilityScoreOverlay = applyTraitAbilityScores(personaje.attributes, traits)
    let apiAttributes: CharacterAttributeApi[] = await this.attributeService.formatAttributes(
      abilityScoreOverlay.attributes,
      personaje.systems ?? []
    )

    const systemAttributes = await this.attributeService.getBySystems(personaje.systems ?? [])
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
          personaje.prof_bonus ?? 0
        )
      })
      .filter((item): item is SpellcastingLevel => item !== null)

    const spells = personaje.spells && typeof personaje.spells === "object" ? { ...personaje.spells } : {}
    const preparedSpellsMap = personaje.preparedSpells && typeof personaje.preparedSpells === "object"
      ? personaje.preparedSpells
      : {}
    const extraSpellsMap = personaje.extraSpells && typeof personaje.extraSpells === "object"
      ? personaje.extraSpells
      : {}
    const subclassById = await this.getSubclassMapByIds(personaje.subclasses ?? []);
    const classCatalogs = (
      await Promise.all(
        (personaje.classes ?? []).map(entry => this.claseRepository.getById(entry.class))
      )
    ).filter((item): item is CharacterClassApi => Boolean(item));
    const derivedExtraByClass = grantedExtraSpellIdsByClass({
      traits,
      optionSelections: personaje.optionSelections ?? [],
      classes: personaje.classes ?? [],
      classCatalogs,
      subclasses: [...subclassById.values()]
    });
    const updatedSpells: Record<string, {
      list: SpellApi[],
      extra?: SpellApi[],
      prepared?: SpellApi[],
      type?: AttributeApi
    }> = {}

    const privilegeInstances = getCharacterSpellPrivileges(personaje.spellPrivileges)
    const loadedTraitIds = new Set(traits.map(trait => trait.id))
    const missingPrivilegeTraitIds = [...new Set(
      privilegeInstances
        .map(item => item.traitId)
        .filter(traitId => !loadedTraitIds.has(traitId) && !(personaje.traits ?? []).includes(traitId))
    )]
    const extraPrivilegeTraits = missingPrivilegeTraitIds.length
      ? await this.traitRepository.getTraitsByIndexes(missingPrivilegeTraitIds)
      : []
    const privilegeTraits = [...traits, ...extraPrivilegeTraits]
    const rulesByTraitId = this.buildPrivilegeRulesMap(privilegeTraits, privilegeInstances)

    const spellGroupKeys = new Set([
      ...Object.keys(spells),
      ...Object.keys(extraSpellsMap),
      ...Object.keys(derivedExtraByClass),
      ...Object.keys(preparedSpellsMap).filter(key => key !== "race"),
      ...privilegeInstances.map(item => item.classId)
    ])

    let raceSpellcastingAttr: AttributeApi | undefined
    if (personaje.raceId && spellGroupKeys.has("race")) {
      const raceAttr = await this.raceRepository.getSpellcastingAttribute(personaje.raceId)
      raceSpellcastingAttr = raceAttr
        ? (attributesByKey.get(raceAttr.key) ?? raceAttr)
        : undefined
    }

    await Promise.all(
      [...spellGroupKeys].map(async groupSpells => {
        const knownIds = Array.isArray(spells[groupSpells]) ? [...spells[groupSpells]] : []
        const extraIds = mergeExtraSpellIds(
          getExtraSpellIds(extraSpellsMap, groupSpells),
          derivedExtraByClass[groupSpells] ?? [],
          knownIds
        )
        const alwaysIds = groupSpells === "race"
          ? []
          : alwaysPreparedSpellIds(privilegeInstances, rulesByTraitId, groupSpells)
        const preparedIds = groupSpells === "race"
          ? []
          : mergePreparedWithPrivileges(
            getPreparedSpellIds(preparedSpellsMap, groupSpells),
            alwaysIds
          )
        const hasPreparedKey = groupSpells !== "race"
          && (Array.isArray(preparedSpellsMap[groupSpells]) || alwaysIds.length > 0)

        if (knownIds.length === 0 && extraIds.length === 0 && preparedIds.length === 0 && !hasPreparedKey) {
          return
        }

        const [dataList, extraList, preparedList] = await Promise.all([
          knownIds.length ? this.spellRepository.getSpellsByIndexes(knownIds) : Promise.resolve([]),
          extraIds.length ? this.spellRepository.getSpellsByIndexes(extraIds) : Promise.resolve([]),
          preparedIds.length ? this.spellRepository.getSpellsByIndexes(preparedIds) : Promise.resolve([])
        ])
        let type: AttributeApi | undefined

        if (groupSpells === "race") {
          type = raceSpellcastingAttr
        } else {
          const classSpellcasting = spellcasting.find(item => item.class === groupSpells)
          if (classSpellcasting?.ability) {
            type = classSpellcasting.ability
          } else {
            const claseData = await this.claseRepository.getById(groupSpells)
            type = claseData?.spellcasting
          }
        }

        const overlaidKnown = overlaySpellsCreatureForms(dataList, traits)
        const overlaidExtra = overlaySpellsCreatureForms(extraList, traits)
        const overlaidPrepared = overlaySpellsCreatureForms(preparedList, traits)
        updatedSpells[groupSpells] = {
          list: overlaidExtra.length ? [...overlaidKnown, ...overlaidExtra] : overlaidKnown,
          ...(overlaidExtra.length ? { extra: overlaidExtra } : {}),
          ...(hasPreparedKey ? { prepared: overlaidPrepared } : {}),
          type
        }
      })
    )

    const campaignSummary = personaje?.campaign
      ? await this.campaignReader.getById(personaje.campaign)
      : null;
    const feats = await this.featRepository.getFeatsByIds(personaje?.feats ?? personaje?.dotes ?? [])

    const initiativeBonusFormula = await this.systemRepository.getInitiativeBonusFormula(personaje.systems ?? []);
    let initiativeBonus = 0;
    if (initiativeBonusFormula) {
      initiativeBonus = evaluateFormula(initiativeBonusFormula, apiAttributes);
    } else {
      const dexAttr = apiAttributes.find(a => a.key === 'dex');
      initiativeBonus = dexAttr?.modifier ?? 0;
    }

    const rulesConfig = await this.systemRepository.getMergedRulesConfig(personaje.systems ?? []);
    apiAttributes = withAttributeMax(
      apiAttributes,
      abilityScoreOverlay.maxByKey,
      rulesConfig.defaultMaxAttributeValue
    );

    let maxCarryingCapacity: number;
    if (rulesConfig.carryingCapacityFormula) {
      maxCarryingCapacity = evaluateFormula(rulesConfig.carryingCapacityFormula, apiAttributes);
    } else {
      const strVal = apiAttributes.find(a => a.key === 'str')?.value ?? 10;
      maxCarryingCapacity = strVal * 15;
    }

    if (traits?.find(trait => trait.id === "semblance-beast-bear")) {
      maxCarryingCapacity *= 2
    }

    const proficientIds = collectProficientSkillIds(personaje?.skills, traits ?? []);
    const skillsListEvaluated = await this.skillService.getCharacterSkills(
      skills,
      apiAttributes,
      personaje?.prof_bonus ?? 0,
      [
        ...collectTraitSkillProficiencies(traits),
        ...overlaysToSkillProficiencies(personaje.skillProficiencyOverlays)
      ]
    );

    const skillsWithPassive = enrichSkillsWithPassive(
      rulesConfig.passiveSkillFormula,
      skillsListEvaluated,
      { attributes: apiAttributes }
    );

    const equipmentWithCombatBonuses = enrichEquipmentWithCombatBonuses({
      equipment: equipment ?? [],
      attributes: apiAttributes,
      proficiencies: proficienciesForEquipmentCheck,
      proficiencyBonus: personaje?.prof_bonus ?? 0,
      level,
      rules: rulesConfig,
    });

    const { CA } = await this.calcularCA(personaje, traits, {
      equipment: equipmentWithCombatBonuses,
      attributes: apiAttributes
    });
    const equippedArmor = collectEquippedArmorSuppression(equipmentWithCombatBonuses);
    const speedWithTraits = applyTraitSpeed(speed, traits, equippedArmor);
    const bodyArmor = findBodyArmor(equipmentWithCombatBonuses);
    const finalSpeed = applyArmorStrengthSpeedPenalty(speedWithTraits, bodyArmor, apiAttributes, traits);
    const stealthKeys = collectStealthDisadvantageSkillKeys(equipmentWithCombatBonuses);
    const skillsWithArmor = skillsWithPassive.map(skill =>
      stealthKeys.includes(skill.key) ? { ...skill, disadvantage: true } : skill
    );
    const wearingArmorWithoutProficiency = isWearingArmorWithoutProficiency(equipmentWithCombatBonuses);

    const storedForms = normalizeCharacterForms(personaje?.forms);
    const formCreatureIds = [...new Set(storedForms.map(form => form.creatureId))];
    const formSpellIds = [...new Set(storedForms.flatMap(form => form.spellId ? [form.spellId] : []))];
    const [formCreatures, formSpells] = await Promise.all([
      formCreatureIds.length ? this.creatureRepository.getByIds(formCreatureIds) : Promise.resolve([]),
      formSpellIds.length ? this.spellRepository.getSpellsByIndexes(formSpellIds) : Promise.resolve([])
    ]);
    const formCreatureById = new Map(formCreatures.map(creature => [creature.id, creature]));
    const formSpellById = new Map(
      formSpells
        .filter((spell): spell is SpellApi & { id: string } => Boolean(spell.id))
        .map(spell => [spell.id, spell])
    );
    const activeFormId = typeof personaje.activeFormId === "string" ? personaje.activeFormId : null;
    const forms: CharacterFormApi[] = storedForms.map(form => {
      const spell = form.spellId ? formSpellById.get(form.spellId) : undefined;
      const hydrated: CharacterFormApi = {
        id: form.id,
        creature: formCreatureById.get(form.creatureId),
        active: activeFormId === form.id && formPurposeOverlaysCharacter(form.purpose)
      };
      if (form.purpose) hydrated.purpose = form.purpose;
      if (form.spellId) hydrated.spellId = form.spellId;
      if (spell) hydrated.spell = { id: spell.id, name: spell.name };
      return hydrated;
    });
    const money = await this.normalizeAndFormatMoney(personaje);

    const privilegeSpellIds = [...new Set(privilegeInstances.flatMap(item => item.selections.flat()))]
    const privilegeSpells = privilegeSpellIds.length
      ? await this.spellRepository.getSpellsByIndexes(privilegeSpellIds)
      : []
    const privilegeSpellById = new Map(
      privilegeSpells
        .filter((spell): spell is SpellApi & { id: string } => Boolean(spell.id))
        .map(spell => [spell.id, spell])
    )
    const hydratedPrivileges: CharacterSpellPrivilegeApi[] = privilegeInstances.map(instance => {
      const rules = rulesByTraitId.get(instance.traitId)
        ?? privilegeTraits.find(trait => trait.id === instance.traitId)?.spellPrivileges
        ?? []
      return {
        traitId: instance.traitId,
        classId: instance.classId,
        rules,
        selections: (instance.selections ?? []).map(group => {
          const hydrated: SpellApi[] = []
          for (const spellId of group) {
            const spell = privilegeSpellById.get(spellId)
            if (spell) hydrated.push(spell)
          }
          return hydrated
        })
      }
    })

    const grantingClassLevelByTraitId = await this.loadGrantingClassLevels(personaje, subclassById);
    const traitResources = normalizeTraitResources(personaje.traitResources);
    const spentByTraitId = new Map(traitResources.map(item => [item.traitId, item.spent]));
    const activeTraitIds = normalizeActiveTraitIds(personaje.activeTraitIds);
    const hitDicePools = classPoolsFromCharacter(personaje.classes ?? []);
    const hitDice = toHitDiceApi(
      hitDicePools,
      normalizeHitDiceSpent(personaje.hitDiceSpent, hitDicePools.map((pool) => pool.classId))
    );
    const spellSlotPools = slotPoolsFromSources(spellcastingSources);
    const spellSlots = toSpellSlotsApi(
      spellSlotPools,
      normalizeSpellSlotsSpent(personaje.spellSlotsSpent, spellSlotPools)
    );
    const storedConditions = normalizeActiveConditions(personaje.activeConditions);
    const conditionById = new Map(
      (await this.conditionRepository.getByIds(storedConditions.map((item) => item.conditionId)))
        .map((condition) => [condition.id, condition])
    );
    const activeConditions = storedConditions.map((item) => ({
      conditionId: item.conditionId,
      name: conditionById.get(item.conditionId)?.name ?? "",
      ...(item.level !== undefined ? { level: item.level } : {})
    }));

    const sheet: PersonajeApi = {
      id: personaje._id.toString(),
      img: personaje.img,
      name: personaje.name,
      race: personaje.race,
      size: personaje.size,
      classes: clases,
      subclasses: this.mapSubclassSummaries(personaje.subclasses ?? [], subclassById),
      campaign: personaje?.campaign ? { id: personaje?.campaign, name: campaignSummary?.name } : null,
      appearance: personaje?.appearance,
      background: personaje?.background,
      level,
      XP: personaje.XP,
      XPMax: rulesConfig.xpProgression?.[level]
        ?? DEFAULT_XP_PROGRESSION[level]
        ?? DEFAULT_XP_PROGRESSION[level - 1]
        ?? 0,
      attributes: apiAttributes,
      systems: personaje.systems ?? [],
      initiativeBonus,
      HPMax: personaje?.HPMax,
      HPActual: personaje?.HPActual,
      CA,
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
        personaje.prof_bonus ?? 0,
        {
          grantingClassLevelByTraitId,
          spentByTraitId,
          activeTraitIds: new Set(activeTraitIds)
        }
      ).map(trait => ({
        ...trait,
        summary: displaySummary(trait.summary, trait.description)
      })),
      traits_data: personaje.traits_data,
      resistances,
      conditional_resistances,
      condition_inmunities,
      conditionalConditionImmunities,
      prof_bonus: personaje.prof_bonus,
      saving_throws: personaje.saving_throws,
      equipment: equipmentWithCombatBonuses,
      wearingArmorWithoutProficiency,
      feats: feats.map(feat => ({
        ...feat,
        summary: displaySummary(feat.summary, feat.description)
      })),
      money,
      spells: updatedSpells,
      maxCarryingCapacity,
      spellcasting,
      optionSelections,
      forms,
      activeFormId,
      spellPrivileges: hydratedPrivileges,
      companions: normalizeCompanions(personaje.companions),
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

  private toInventoryRows(equipment: PersonajeEquipmentMongo[] | undefined): PersonajeEquipmentMongo[] {
    return cloneInventory(equipment ?? []);
  }

  private requireInventoryInstance(
    inventory: PersonajeEquipmentMongo[],
    instanceId: string
  ): PersonajeEquipmentMongo {
    const item = inventory.find(eq => eq.instanceId === instanceId);
    if (!item) {
      throw new NotFoundError("No se encontró el equipamiento en el personaje");
    }
    return item;
  }

  private toHydrationRows(equipment: PersonajeEquipmentMongo[] | undefined): CharacterEquipmentMongo[] {
    return this.toInventoryRows(equipment).map(item => ({
      instanceId: item.instanceId,
      equipmentId: item.equipmentId,
      id: item.equipmentId,
      quantity: item.quantity,
      equipped: item.equipped,
      isMagic: item.isMagic,
      isBond: item.isBond,
      isFavorite: item.isFavorite,
      ...(item.customization ?? {}),
    }));
  }

  private slotLookupFrom(
    formatted: EquipmentInstanceApi[]
  ): (item: PersonajeEquipmentMongo) => EquipSlot | null {
    const slotByInstanceId = new Map(
      formatted.map(item => [item.instanceId, item.equipSlot ?? null] as const)
    );
    const slotByEquipmentId = new Map(
      formatted.map(item => [item.id, item.equipSlot ?? null] as const)
    );

    return (item: PersonajeEquipmentMongo) =>
      slotByInstanceId.get(item.instanceId)
      ?? slotByEquipmentId.get(item.equipmentId)
      ?? null;
  }

  private applyEquipOrThrow(
    inventory: PersonajeEquipmentMongo[],
    instanceId: string,
    equipped: boolean,
    slotOf: (item: PersonajeEquipmentMongo) => EquipSlot | null
  ): PersonajeEquipmentMongo[] {
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

  private async saveInventory(
    id: string,
    equipment: PersonajeEquipmentMongo[]
  ): Promise<UpdateCharacterEquipmentResponse> {
    const resultado = await Personaje.findByIdAndUpdate(
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
    equipment: PersonajeEquipmentMongo[]
  ): Promise<{ completo: PersonajeApi, basico: PersonajeBasico }> {
    const resultado = await Personaje.findByIdAndUpdate(
      id,
      { $set: { equipment } },
      { returnDocument: "after" }
    );

    if (!resultado) {
      throw new NotFoundError("Personaje no encontrado");
    }

    const completo = await this.formatCharacter(resultado);
    const basico = await this.formatBasicCharacter(resultado);
    return { completo, basico };
  }

  private async formatCharacterEquipment(
    personaje: PersonajeMongo
  ): Promise<CharacterEquipmentApi[]> {
    const level =
      personaje.classes?.map(cl => cl.level).reduce((acc, value) => acc + value, 0) ?? 0;

    const [equipment, baseProficiencies, traits, rulesConfig] = await Promise.all([
      this.equipmentRepository.getCharacterEquipmentsByIds(this.toHydrationRows(personaje.equipment ?? [])),
      this.proficiencyRepository.getProficienciesByIndices(personaje?.proficiencies ?? []),
      this.traitRepository.getTraitsByIndexes(personaje?.traits, personaje?.traits_data),
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

    return enrichEquipmentWithCombatBonuses({
      equipment: equipment ?? [],
      attributes: apiAttributes,
      proficiencies: proficienciesForEquipmentCheck,
      proficiencyBonus: personaje?.prof_bonus ?? 0,
      level,
      rules: rulesConfig,
    });
  }

  private async normalizeAndFormatMoney(personaje: PersonajeMongo): Promise<({ quantity: number } & CoinApi)[]> {
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

    return buildPersonajeMoneyItems(systemCoins, quantities, orphanCoins);
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

  private async formatSheetAttributes(
    personaje: Pick<PersonajeMongo, "attributes" | "systems" | "traits">,
    traits?: TraitApi[],
    defaultMax?: number
  ): Promise<CharacterAttributeApi[]> {
    const resolvedTraits = traits
      ?? await this.traitRepository.getTraitsByIndexes(personaje.traits ?? []);
    const overlay = applyTraitAbilityScores(personaje.attributes, resolvedTraits);
    const formatted = await this.attributeService.formatAttributes(
      overlay.attributes,
      personaje.systems ?? []
    );
    const max = defaultMax ?? (
      await this.systemRepository.getMergedRulesConfig(personaje.systems ?? [])
    ).defaultMaxAttributeValue;
    return withAttributeMax(formatted, overlay.maxByKey, max);
  }

}
