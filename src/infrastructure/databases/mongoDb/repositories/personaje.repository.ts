import IPersonajeRepository from '../../../../domain/repositories/IPersonajeRepository';
import Personaje from '../schemas/Personaje';
import IUserRepository from '../../../../domain/repositories/IUserRepository';
import ISpellRepository from '../../../../domain/repositories/ISpellRepository';
import { CharacterCampaignLink, CharacterSubclassApi, LevelUpData, PersonajeApi, PersonajeBasico, PersonajeMongo, PersonajeEquipmentMongo, TypeAddEquipment, TypeCrearPersonaje, TypeDeleteEquipment, TypeEquipEquipment, TypeToggleFavoriteEquipment, ToggleFavoriteEquipmentResponse, TypeBindPactEquipment, TypeLearnSpells, TypeLevelUp, TypePrepareSpells, TypeBindSpellPrivileges, UpdateCharacterMoneyResponse, UpdateCharacterEquipmentResponse, CharacterSpellPrivilegeMongo, CharacterSpellPrivilegeApi, CharacterCompanionInput, UpdateCharacterCompanionsResponse } from '../../../../domain/types/personajes.types';
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
import ISkillRepository from '../../../../domain/repositories/ISkillRepository';
import { SpellApi } from '../../../../domain/types/spell.types';
import { FeatApi } from '../../../../domain/types/feat.types';
import { EstadoApi } from '../../../../domain/types/estados.types';
import { CharacterEquipmentApi, CharacterEquipmentMongo, EquipSlot } from '../../../../domain/types/equipment.types';
import IInvocacionRepository from '../../../../domain/repositories/IInvocacionRepository';
import IRaceRepository from '../../../../domain/repositories/IRaceRepository';
import { TraitApi, TraitDataMongo, SpellPrivilegeRule } from '../../../../domain/types/traits.types';
import { mergeLevelUpTraits } from '../../../../utils/characterLevelUpTraits';
import {
  applyEnteringTraitChoices,
  mergeTraitLanguageIds,
  resolveCharacterTraitChoices
} from '../../../../utils/traitDamageChoices';
import { applyTraitSpeed } from '../../../../utils/applyTraitSpeed';
import {
  applyArmorStrengthSpeedPenalty,
  collectEquippedArmorSuppression,
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
import ICriaturaRepository from '../../../../domain/repositories/ICriaturaRepository';
import { CharacterAttributeApi, AttributeApi } from '../../../../domain/types/attribute.types';
import { evaluateFormula, enrichSkillsWithPassive } from '../../../../utils/formulaEvaluator';
import {
  buildCantripSpellChoice,
  buildSynthesizedKnownSpellChoice,
  buildSpellcastingLevel,
  castableSpellLevels,
  excludeKnownSpellOptions,
  getPreparedSpellIds,
  hasCantripSpellChoice,
  remainingCantripPicks,
  resolveClassSpellSlotsForLevel,
  validateKnownSpellPicks,
  validateLevelUpSpellPicks,
  validatePreparedSpellPicks,
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

const nameTraits: any = {
  "totemic-spirit-bear": "Furia"
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
    private readonly invocacionRepository: IInvocacionRepository,
    private readonly raceRepository: IRaceRepository,
    private readonly criaturaRepository: ICriaturaRepository,
    private readonly attributeService: AttributeService,
    private readonly systemRepository: ISystemRepository,
    private readonly coinRepository: ICoinRepository,
    private readonly campaignReader: ICampaignReader
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
      double_skills,
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
      prof_bonus
    } = data

    const dataBackground = {
      ...background,
      history: background?.history?.split(/\r?\n/) ?? []
    }

    let HP: number;
    const rulesConfig = await this.systemRepository.getMergedRulesConfig(systems ?? []);
    const apiAttributesForHp = await this.attributeService.formatAttributes(attributes, systems ?? []);

    if (rulesConfig.hpInitialFormula) {
      HP = Math.floor(evaluateFormula(
        rulesConfig.hpInitialFormula,
        apiAttributesForHp,
        undefined,
        { classVariables: { hitDie: hit_die ?? 1 } }
      ));
    } else {
      HP = hit_die ?? 1;
      const conVal = attributes.find(a => a.key === 'con')?.value ?? 10;
      HP += Math.floor((conVal / 2) - 5);
    }

    if (traits.includes('dwarven-toughness') || traits.includes('draconid-resistance')) {
      HP += 1
    }

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

    if (subclase) {
      const subclass = await this.assertSubclassAvailable(subclase, claseId, systems ?? []);
      resolvedSubclasses = [subclass.id];
      const characterClass = await this.claseRepository.getById(claseId);
      if (characterClass?.subclassChoice?.level === 1) {
        const level1 = subclass.levels.find(row => row.level === 1);
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

    const loadedTraits = await this.traitRepository.getTraitsByIndexes(resolvedTraits);
    const choiceResult = applyEnteringTraitChoices({
      existing: undefined,
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
      prof_bonus: resolvedProfBonus,
      speed,
      size,
      languages: languages,
      saving_throws: saving_throws ?? [],
      skills: [...skills ?? []],
      double_skills: [...double_skills ?? []],
      proficiencies,
      spells,
      equipment: equipment,
      feats: feats ?? [],
      money: moneyArray,
      HPMax: HP,
      HPActual: HP,
      XP: 0,
      companions: normalizeCompanions(data.companions)
    })

    const resultado = await personaje.save()

    if (resultado) {
      return await this.formatBasicCharacter(resultado)
    } else {
      return null
    }
  }

  async consultarPorId(idCharacter: string, user: string): Promise<PersonajeApi> {
    const personaje = await Personaje.findById(idCharacter);

    if (!personaje) {
      throw new NotFoundError(`No se encontró el personaje con id: ${idCharacter}`);
    }

    await this.assertCanAccessCharacter(personaje, user);

    return this.formatCharacter(personaje);
  }

  async addEquipment(data: TypeAddEquipment): Promise<UpdateCharacterEquipmentResponse> {
    const { id, equipmentId, quantity, isMagic } = data;
    const personaje = await Personaje.findById(id);

    if (!personaje) {
      throw new NotFoundError(`No se encontró el personaje con id: ${id}`);
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
      throw new NotFoundError(`No se encontró el personaje con id: ${id}`);
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
      throw new NotFoundError(`No se encontró el personaje con id: ${id}`);
    }

    let inventory = this.toInventoryRows(personaje.equipment);
    this.requireInventoryInstance(inventory, instanceId);

    if (equipped) {
      const slotOf = await this.buildSlotLookup(inventory);
      const { inventory: next, instance } = splitOne(inventory, instanceId);
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
      throw new NotFoundError(`No se encontró el personaje con id: ${id}`);
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
      throw new NotFoundError(`No se encontró el personaje con id: ${id}`);
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
      throw new NotFoundError(`No se encontró el personaje con id: ${id}`);
    }

    const formattedMoney = await this.normalizeAndFormatMoney(resultado);

    return { money: formattedMoney };
  }

  async updateXp(id: string, xp: number, userId: string): Promise<void> {
    const personaje = await Personaje.findById(id);

    if (!personaje) {
      throw new NotFoundError(`No se encontró el personaje con id: ${id}`);
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
      throw new NotFoundError(`No se encontró el personaje con id: ${id}`);
    }

    await this.assertCanAccessCharacter(personaje, userId);

    const normalized = normalizeCompanions(companions);
    await Personaje.findByIdAndUpdate(id, { $set: { companions: normalized } });

    return { companions: normalized };
  }

  async getLevelUpData(id: string, classId: string, userId: string): Promise<LevelUpData> {
    const personaje = await Personaje.findById(id);

    if (!personaje) {
      throw new NotFoundError(`No se encontró el personaje con id: ${id}`);
    }

    await this.assertCanAccessCharacter(personaje, userId);

    const level = personaje.classes?.find(clas => clas.class === classId)?.level ?? 0;

    const nextLevel = level + 1;
    const totalLevels = personaje.classes?.reduce((acc, clas) => acc + clas.level, 0) ?? 0;
    const rulesConfig = await this.systemRepository.getMergedRulesConfig(personaje.systems ?? []);
    const { hit_die, spell_choices, traits, traits_data, subclassChoice, ability_score, feats } =
      await this.resolveLevelUpClassData(personaje, classId, nextLevel);

    return {
      class: classId,
      hit_die,
      prof_bonus: rulesConfig.proficiencyProgression?.[totalLevels]
        ?? DEFAULT_PROFICIENCY_PROGRESSION[totalLevels]
        ?? 0,
      spell_choices,
      traits,
      traits_data,
      subclassChoice: subclassChoice ?? null,
      ability_score,
      feats,
    };
  }

  async levelUp(data: TypeLevelUp): Promise<{ completo: PersonajeApi, basico: PersonajeBasico }> {
    const { id, classId, hpIncrease, userId, spells, subclass, abilityScore, feat, traitChoices } = data;
    const personaje = await Personaje.findById(id);

    if (!personaje) {
      throw new NotFoundError(`No se encontró el personaje con id: ${id}`);
    }

    await this.assertCanAccessCharacter(personaje, userId);

    const characterClass = personaje.classes?.find((clas) => clas.class === classId);
    if (!characterClass) {
      throw new ValidationError(`El personaje no tiene la clase con id: ${classId}`);
    }

    const hitDie = characterClass.hit_die ?? 8;
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

    const nextLevel = (characterClass.level ?? 0) + 1;
    const nextSubclassIds = await this.resolveLevelUpSubclassIds(
      personaje,
      classId,
      nextLevel,
      subclass
    );
    const knownSpellIds = this.getClassSpellIds(personaje, classId);
    const { spell_choices, traits: levelTraits, traits_data: levelTraitsData, ability_score, feats } =
      await this.resolveLevelUpClassData(personaje, classId, nextLevel, nextSubclassIds);
    const pickResult = validateLevelUpSpellPicks(spell_choices, spells, knownSpellIds);
    if ("error" in pickResult) {
      throw new ValidationError(pickResult.error);
    }

    if (pickResult.spellIds.length > 0) {
      await this.assertCanLearnClassCantrips(personaje, classId, pickResult.spellIds);
    }

    const ownedFeatIds = getOwnedFeatIds(personaje);
    const asiResult = validateLevelUpAbilityScorePick({
      abilityScoreGranted: ability_score,
      increases: abilityScore?.increases,
      featId: feat,
      attributes: personaje.attributes ?? [],
      availableFeatIds: feats?.options.map(option => option.id) ?? [],
      maxAttributeValue: rulesConfig.defaultMaxAttributeValue
    });
    if ("error" in asiResult) {
      throw new ValidationError(asiResult.error);
    }

    const nextAttributes = asiResult.kind === "increases"
      ? applyAbilityScoreIncreases(personaje.attributes ?? [], asiResult.increases)
      : undefined;

    const apiAttributesForHp = await this.attributeService.formatAttributes(
      nextAttributes ?? personaje.attributes ?? [],
      personaje.systems ?? []
    );

    const HP = Math.floor(
      evaluateFormula(
        rulesConfig.hpLevelUpFormula,
        apiAttributesForHp,
        { hpIncrease },
        { classVariables: { hitDie: hpIncrease } }
      )
    );

    const newTotalLevels = totalLevels + 1;
    const newProfBonus =
      rulesConfig.proficiencyProgression?.[newTotalLevels - 1]
      ?? DEFAULT_PROFICIENCY_PROGRESSION[newTotalLevels - 1]
      ?? personaje.prof_bonus
      ?? 0;

    const spellsUpdate = this.mergeClassSpellIds(personaje, classId, pickResult.spellIds);
    const { traits: nextTraits, traits_data: nextTraitsData } = mergeLevelUpTraits(
      personaje.traits ?? [],
      personaje.traits_data,
      levelTraits,
      levelTraitsData
    );
    const ownedTraitIds = new Set(personaje.traits ?? []);
    const enteringTraits = (levelTraits ?? []).filter(trait => trait.id && !ownedTraitIds.has(trait.id));
    const choiceResult = applyEnteringTraitChoices({
      existing: personaje.traitChoices,
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
          subclasses: nextSubclassIds,
          ...(spellsUpdate ? { spells: spellsUpdate } : {}),
          ...(nextAttributes ? { attributes: nextAttributes } : {}),
          ...(asiResult.kind === "feat" ? { feats: [...ownedFeatIds, asiResult.featId] } : {}),
        },
        $inc: {
          "classes.$[elem].level": 1,
          HPMax: HP,
          HPActual: HP,
        },
      },
      {
        arrayFilters: [{ "elem.class": classId }],
        returnDocument: "after",
      }
    );

    if (!resultado) {
      throw new NotFoundError(`No se encontró el personaje con id: ${id}`);
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
      throw new NotFoundError(`No se encontró el personaje con id: ${id}`);
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
      throw new NotFoundError(`No se encontró el personaje con id: ${id}`)
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
    const [loadedSpells, existingSpells] = await Promise.all([
      this.spellRepository.getSpellsByIndexes(spells),
      knownIds.length ? this.spellRepository.getSpellsByIndexes(knownIds) : Promise.resolve([]),
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
      castableLevels: castableSpellLevels(source.slots?.slots),
      cantripCap: source.slots?.cantrips,
      ownedCantripCount: existingSpells.filter(spell => spell.level === 0).length,
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
      throw new NotFoundError(`No se encontró el personaje con id: ${id}`)
    }

    return this.formatCharacter(resultado)
  }

  async prepareSpells(data: TypePrepareSpells): Promise<PersonajeApi> {
    const { id, classId, spells, userId } = data
    const personaje = await Personaje.findById(id)

    if (!personaje) {
      throw new NotFoundError(`No se encontró el personaje con id: ${id}`)
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

    const modifiedAttributes = this.calcularAttributes(personaje)
    const apiAttributes = await this.attributeService.formatAttributes(
      modifiedAttributes,
      personaje.systems ?? []
    )
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
    const loadedSpells = persistIds.length ? await this.spellRepository.getSpellsByIndexes(persistIds) : []
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
      castableLevels: castableSpellLevels(spellcastingLevel.slots?.slots),
      excludeFromCap: excludedFromCap
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
      throw new NotFoundError(`No se encontró el personaje con id: ${id}`)
    }

    return this.formatCharacter(resultado)
  }

  async bindSpellPrivileges(data: TypeBindSpellPrivileges): Promise<PersonajeApi> {
    const { id, traitId, classId, selections, userId } = data
    const personaje = await Personaje.findById(id)

    if (!personaje) {
      throw new NotFoundError(`No se encontró el personaje con id: ${id}`)
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
    const loadedSpells = selectionIds.length
      ? await this.spellRepository.getSpellsByIndexes(selectionIds)
      : []
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
        }))
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
      throw new NotFoundError(`No se encontró el personaje con id: ${id}`)
    }

    return this.formatCharacter(resultado)
  }

  async añadirForma(data: { id: string, form: string }): Promise<PersonajeApi | null> {
    const { id, form } = data
    const personaje = await Personaje.findById(id);

    if (!personaje) {
      return null
    }

    personaje.forms.push(form)

    const resultado = await Personaje.findByIdAndUpdate(
      id,
      {
        $set: {
          forms: personaje.forms
        }
      },
      { returnDocument: 'after' }
    );

    if (!resultado) {
      return null
    }

    const personajeFormateado = await this.formatCharacter(resultado)

    return personajeFormateado
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

    const current = personaje.spells && typeof personaje.spells === "object"
      ? { ...personaje.spells }
      : {};

    current[classId] = [...this.getClassSpellIds(personaje, classId), ...newIds];
    return current;
  }

  private async resolveLevelUpClassData(
    personaje: PersonajeMongo,
    classId: string,
    nextLevel: number,
    subclassIds?: string[]
  ): Promise<{
    hit_die: number;
    spell_choices?: ChoiceApi<SpellApi>[];
    traits: TraitApi[];
    traits_data: TraitDataMongo;
    subclassChoice?: SubclassChoiceMenuApi | null;
    ability_score: boolean;
    feats?: ChoiceApi<FeatApi>;
  }> {
    const dataLevel = await this.claseRepository.dataLevelUp(
      classId,
      nextLevel,
      subclassIds ?? personaje.subclasses ?? [],
      personaje.systems ?? []
    );
    const clase = await this.claseRepository.getById(classId);
    const knownSpellIds = this.getClassSpellIds(personaje, classId);
    const cantripChoices = await this.buildCantripSpellChoices(
      classId,
      clase?.levels ?? [],
      nextLevel,
      knownSpellIds,
      dataLevel?.spell_choices
    );
    const knownSpellChoices = await this.buildKnownSpellChoices(
      classId,
      clase?.levels ?? [],
      nextLevel,
      knownSpellIds,
      dataLevel?.spell_choices
    );
    const synthesized = [...(cantripChoices ?? []), ...(knownSpellChoices ?? [])];
    const spell_choices = synthesized.length
      ? [...synthesized, ...(dataLevel?.spell_choices ?? [])]
      : dataLevel?.spell_choices;

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
      traits: dataLevel?.traits ?? [],
      traits_data: dataLevel?.traits_data ?? {},
      subclassChoice: dataLevel?.subclassChoice ?? null,
      ability_score,
      feats,
    };
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
    persistedChoices?: ChoiceApi<SpellApi>[]
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

    return excludeKnownSpellOptions(formatted, knownCantripIds);
  }

  private async buildKnownSpellChoices(
    classId: string,
    levels: { level: number; spellcasting?: { cantrips?: number; spellsLearned?: number; slots?: Record<string, number> } }[],
    targetLevel: number,
    knownSpellIds: string[],
    persistedChoices?: ChoiceApi<SpellApi>[]
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

    return excludeKnownSpellOptions(formatted, knownSpellIds);
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
      attributes: personaje.attributes,
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

    const attributes = options?.attributes ?? await this.attributeService.formatAttributes(
      this.calcularAttributes(personaje),
      personaje.systems ?? []
    );

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

  private async formatCharacter(personaje: PersonajeMongo): Promise<PersonajeApi> {
    const level = personaje.classes.map(cl => cl.level).reduce((acumulador: number, valorActual: number) => acumulador + valorActual, 0)

    const loadedTraits = await this.traitRepository.getTraitsByIndexes(personaje?.traits, personaje?.traits_data)
    const resolvedSheet = resolveCharacterTraitChoices(loadedTraits, personaje.traitChoices)
    const traits = resolvedSheet.traits
    const invocations = await this.invocacionRepository.obtenerPorIndices(personaje.invocations)
    const skills = [...(personaje?.skills ?? [])]

    const idiomasId = personaje?.languages ?? []
    const proficiencies = await this.proficiencyRepository.getProficienciesByIndices(personaje?.proficiencies ?? [])

    const resistances: Damage[] = []

    const conditional_resistances: { name: string, resistances: Damage[] }[] = []
    const condition_inmunities: { name: string, estados: EstadoApi[] }[] = []

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

      if (trait.conditional_resistances.length > 0) {
        const idx = conditional_resistances.findIndex(name => name.name === (nameTraits[trait.id] ?? trait.name))
        if (idx > -1) {
          conditional_resistances[idx].resistances = trait?.conditional_resistances ?? []
        } else {
          conditional_resistances.push({
            name: nameTraits[trait.name] ?? trait.name,
            resistances: trait?.conditional_resistances ?? []
          })
        }
      }

      if (trait?.proficiencies) {
        proficiencies.push(...trait?.proficiencies)
      }
    })

    for (const damage of resolvedSheet.grantedResistances) {
      if (damage.id && resistances.some(item => item.id === damage.id)) continue
      resistances.push(damage)
    }

    invocations.forEach(invocation => {
      if (invocation?.skills) {
        skills.push(...invocation?.skills)
      }
    })

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
      traits
    )
    const idiomas_understands = await this.languageRepository.getLanguagesByIndex(mergedLanguageIds.understands)
    const idiomas_speaks = await this.languageRepository.getLanguagesByIndex(mergedLanguageIds.speaks)
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

    const modifiedAttributes = this.calcularAttributes(personaje)
    const apiAttributes: CharacterAttributeApi[] = await this.attributeService.formatAttributes(
      modifiedAttributes,
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
    const updatedSpells: Record<string, {
      list: SpellApi[],
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

        if (knownIds.length === 0 && preparedIds.length === 0 && !hasPreparedKey) {
          return
        }

        const [dataList, preparedList] = await Promise.all([
          knownIds.length ? this.spellRepository.getSpellsByIndexes(knownIds) : Promise.resolve([]),
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

        updatedSpells[groupSpells] = {
          list: dataList,
          ...(hasPreparedKey ? { prepared: preparedList } : {}),
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

    const hasJackOfAllTrades = !!traits?.find(trait => trait.id === "jack-of-all-trades");
    const skillsListEvaluated = await this.skillService.getCharacterSkills(
      skills,
      [...(personaje?.double_skills ?? [])],
      apiAttributes,
      personaje?.prof_bonus ?? 0,
      hasJackOfAllTrades
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
    const finalSpeed = applyArmorStrengthSpeedPenalty(speedWithTraits, bodyArmor, apiAttributes);
    const stealthKeys = collectStealthDisadvantageSkillKeys(equipmentWithCombatBonuses);
    const skillsWithArmor = skillsWithPassive.map(skill =>
      stealthKeys.includes(skill.key) ? { ...skill, disadvantage: true } : skill
    );
    const wearingArmorWithoutProficiency = isWearingArmorWithoutProficiency(equipmentWithCombatBonuses);

    const forms = await this.criaturaRepository.obtenerPorIndices(personaje?.forms ?? [])
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

    return {
      id: personaje._id.toString(),
      img: personaje.img,
      name: personaje.name,
      race: personaje.race,
      size: personaje.size,
      classes: clases,
      subclasses: await this.hydrateSubclasses(personaje.subclasses ?? []),
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
      CA,
      speed: finalSpeed,
      skills: skillsWithArmor,
      languages: {
        understands: idiomas_understands,
        speaks: idiomas_speaks,
        notes: idiomasId.notes
      },
      proficiencies: proficienciesUnicos,
      traits,
      traits_data: personaje.traits_data,
      resistances,
      conditional_resistances,
      condition_inmunities,
      prof_bonus: personaje.prof_bonus,
      saving_throws: personaje.saving_throws,
      equipment: equipmentWithCombatBonuses,
      wearingArmorWithoutProficiency,
      feats,
      money,
      spells: updatedSpells,
      maxCarryingCapacity,
      spellcasting,
      invocations,
      forms: forms,
      spellPrivileges: hydratedPrivileges,
      companions: normalizeCompanions(personaje.companions)
    }
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
    }));
  }

  private async buildSlotLookup(
    inventory: PersonajeEquipmentMongo[]
  ): Promise<(item: PersonajeEquipmentMongo) => EquipSlot | null> {
    const formatted = await this.equipmentRepository.getCharacterEquipmentsByIds(
      this.toHydrationRows(inventory)
    ) ?? [];
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
      throw new NotFoundError(`No se encontró el personaje con id: ${id}`);
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
      throw new NotFoundError(`No se encontró el personaje con id: ${id}`);
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

    const [equipment, apiAttributes, baseProficiencies, traits, rulesConfig] = await Promise.all([
      this.equipmentRepository.getCharacterEquipmentsByIds(this.toHydrationRows(personaje.equipment ?? [])),
      this.attributeService.formatAttributes(
        this.calcularAttributes(personaje),
        personaje.systems ?? []
      ),
      this.proficiencyRepository.getProficienciesByIndices(personaje?.proficiencies ?? []),
      this.traitRepository.getTraitsByIndexes(personaje?.traits, personaje?.traits_data),
      this.systemRepository.getMergedRulesConfig(personaje.systems ?? []),
    ]);

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

  private calcularAttributes(personaje: PersonajeMongo): { key: string, value: number }[] {
    const attributes = personaje.attributes ?? []

    if (personaje?.traits?.includes('primal-champion')) {
      return attributes.map(attr => {
        let val = attr.value
        if (attr.key === 'str' || attr.key === 'con') {
          val += 4
        }
        return { key: attr.key, value: val }
      })
    }

    return attributes
  }

}
