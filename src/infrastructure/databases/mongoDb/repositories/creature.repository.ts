import { Types } from "mongoose";
import IAttributeRepository from "../../../../domain/repositories/IAttributeRepository";
import ICreatureRepository from "../../../../domain/repositories/ICreatureRepository";
import ICreatureTypeRepository from "../../../../domain/repositories/ICreatureTypeRepository";
import IDamageRepository from "../../../../domain/repositories/IDamageRepository";
import IEquipmentRepository from "../../../../domain/repositories/IEquipmentRepository";
import IEstadoRepository from "../../../../domain/repositories/IEstadoRepository";
import ILanguageRepository from "../../../../domain/repositories/ILanguageRepository";
import IRaceRepository from "../../../../domain/repositories/IRaceRepository";
import ISkillRepository from "../../../../domain/repositories/ISkillRepository";
import ISpellRepository from "../../../../domain/repositories/ISpellRepository";
import ISystemRepository from "../../../../domain/repositories/ISystemRepository";
import { NotFoundError } from "../../../../domain/errors/AppError";
import { Damage } from "../../../../domain/types";
import { AttributeApi, CharacterAttributeApi } from "../../../../domain/types/attribute.types";
import {
  CREATURE_ANY_RACE,
  CreateCreature,
  CreatureApi,
  CreatureAttack,
  CreatureFeature,
  CreatureFeatureApi,
  CreatureInnateSpellcasting,
  CreatureInnateSpellcastingApi,
  CreatureListFilters,
  CreatureMongo,
  CreatureSpellcasting,
  CreatureSpellcastingApi,
  UpdateCreature
} from "../../../../domain/types/creature.types";
import { RaceRef } from "../../../../domain/types/race.types";
import { SpellApi } from "../../../../domain/types/spell.types";
import { ordenarPorNombre } from "../../../../utils/formatters";
import {
  DEFAULT_ATTRIBUTE_MODIFIER_FORMULA,
  buildCreatureAttributes,
  buildCreatureSkills,
  resolveArmorClass,
  resolveAttackBonus,
  resolvePassivePerception
} from "../../../../utils/creatureStats";
import CreatureModel from "../schemas/Creature";

export default class CreatureRepository implements ICreatureRepository {
  constructor(
    private readonly systemRepository: ISystemRepository,
    private readonly damageRepository: IDamageRepository,
    private readonly estadoRepository: IEstadoRepository,
    private readonly languageRepository: ILanguageRepository,
    private readonly spellRepository: ISpellRepository,
    private readonly skillRepository: ISkillRepository,
    private readonly attributeRepository: IAttributeRepository,
    private readonly creatureTypeRepository: ICreatureTypeRepository,
    private readonly equipmentRepository: IEquipmentRepository,
    private readonly raceRepository: IRaceRepository
  ) {}

  async getBySystems(rulesets: string[], filters?: CreatureListFilters, userId?: string): Promise<CreatureApi[]> {
    const expandedRulesets = await this.systemRepository.getSystemsAndAncestors(rulesets);
    const query: { ruleset: { $in: string[] }; deletedAt?: null; creatureTypeId?: string } = {
      ruleset: { $in: expandedRulesets }
    };

    let includeDeleted = false;
    if (userId) {
      for (const ruleset of expandedRulesets) {
        const system = await this.systemRepository.getById(ruleset);
        if (system && system.publisher === userId) {
          includeDeleted = true;
          break;
        }
      }
    }

    if (!includeDeleted) {
      query.deletedAt = null;
    }

    if (filters?.creatureTypeId) {
      query.creatureTypeId = filters.creatureTypeId;
    }

    const creatures = await CreatureModel.find(query)
      .collation({ locale: "es", strength: 1 })
      .sort({ name: 1 })
      .lean<CreatureMongo[]>();

    const formatted = await Promise.all(creatures.map(creature => this.formatCreature(creature)));
    return ordenarPorNombre(formatted);
  }

  async getById(id: string): Promise<CreatureApi | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const creature = await CreatureModel.findById(id).lean<CreatureMongo>();
    if (!creature) return null;
    return this.formatCreature(creature);
  }

  async getByIds(ids: string[]): Promise<CreatureApi[]> {
    const validIds = creatureObjectIds(ids);
    if (!validIds.length) return [];

    const creatures = await CreatureModel.find({
      _id: { $in: validIds as never[] },
      deletedAt: null
    }).lean<CreatureMongo[]>();

    const formatted = await Promise.all(creatures.map(creature => this.formatCreature(creature)));
    return ordenarPorNombre(formatted);
  }

  async create(data: CreateCreature): Promise<CreatureApi> {
    const created = new CreatureModel({
      name: data.name,
      ruleset: data.ruleset,
      img: data.img ?? undefined,
      description: data.description ?? [],
      creatureTypeId: data.creatureTypeId,
      race: data.race ?? null,
      size: data.size,
      alignment: data.alignment,
      armor_class: data.armor_class ?? undefined,
      HPMax: data.HPMax,
      hit_dice: data.hit_dice ?? undefined,
      speed: data.speed,
      attributes: data.attributes ?? [],
      saving_throws: data.saving_throws ?? [],
      skill_bonuses: data.skill_bonuses ?? [],
      senses: data.senses ?? undefined,
      languages: data.languages ?? { speaks: [], understands: [] },
      language_choices: data.language_choices ?? undefined,
      challenge_rating: data.challenge_rating,
      xp: data.xp,
      prof_bonus: data.prof_bonus,
      damage_vulnerabilities: data.damage_vulnerabilities ?? [],
      damage_immunities: data.damage_immunities ?? [],
      damage_resistances: data.damage_resistances ?? [],
      condition_immunities: data.condition_immunities ?? [],
      special_abilities: data.special_abilities ?? [],
      spellcasting: data.spellcasting ?? null,
      innateSpellcasting: data.innateSpellcasting ?? null,
      actions: data.actions ?? [],
      bonus_actions: data.bonus_actions ?? [],
      reactions: data.reactions ?? [],
      legendary_actions: data.legendary_actions ?? undefined,
      equipment: data.equipment ?? [],
      deletedAt: null
    });

    await created.save();
    return this.formatCreature(created.toObject() as CreatureMongo);
  }

  async update(data: UpdateCreature): Promise<CreatureApi> {
    const { id, ...updateFields } = data;
    const $set: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(updateFields)) {
      if (value !== undefined) {
        $set[key] = value;
      }
    }

    const updated = await CreatureModel.findByIdAndUpdate(
      id,
      { $set },
      { returnDocument: "after" }
    ).lean<CreatureMongo>();

    if (!updated) {
      throw new NotFoundError(`No creature found with id: ${id}`);
    }

    return this.formatCreature(updated);
  }

  async softDelete(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) return;
    await CreatureModel.findByIdAndUpdate(id, { $set: { deletedAt: new Date() } });
  }

  async restore(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) return;
    await CreatureModel.findByIdAndUpdate(id, { $set: { deletedAt: null } });
  }

  async softDeleteByRuleset(ruleset: string, deletedAt: Date): Promise<void> {
    await CreatureModel.updateMany({ ruleset, deletedAt: null }, { $set: { deletedAt } });
  }

  async restoreByRuleset(ruleset: string, deletedAt: Date): Promise<void> {
    await CreatureModel.updateMany({ ruleset, deletedAt }, { $set: { deletedAt: null } });
  }

  private async formatCreature(creature: CreatureMongo): Promise<CreatureApi> {
    const expandedRulesets = await this.systemRepository.getSystemsAndAncestors([creature.ruleset]);
    const rules = await this.systemRepository.getMergedRulesConfig([creature.ruleset]);
    const formula = rules.globalModifierFormula || DEFAULT_ATTRIBUTE_MODIFIER_FORMULA;

    const damageIds = collectDamageIds(creature);
    const spellIds = unique([
      ...collectSpellIds(creature.spellcasting),
      ...collectInnateSpellIds(creature.innateSpellcasting)
    ]);

    const [
      catalogAttributes,
      catalogSkills,
      creatureType,
      damages,
      conditions,
      speaks,
      understands,
      languageChoices,
      spells,
      equipment,
      race
    ] = await Promise.all([
      this.attributeRepository.getBySystems(expandedRulesets),
      this.skillRepository.getBySystems(expandedRulesets),
      creature.creatureTypeId
        ? this.creatureTypeRepository.getById(creature.creatureTypeId)
        : Promise.resolve(null),
      this.damageRepository.getByIds(damageIds),
      this.estadoRepository.obtenerEstadosPorIndices(creature.condition_immunities ?? []),
      this.languageRepository.getLanguagesByIndex(creature.languages?.speaks ?? []),
      this.languageRepository.getLanguagesByIndex(creature.languages?.understands ?? []),
      this.languageRepository.formatLanguageChoices(creature.language_choices, creature.ruleset),
      this.spellRepository.getSpellsByIndexes(spellIds),
      this.equipmentRepository.getCharacterEquipmentsByIds(creature.equipment ?? []),
      this.resolveRace(creature.race)
    ]);

    const damageById = new Map(damages.filter(item => item.id).map(item => [item.id as string, item]));
    const spellById = new Map(spells.filter(item => item.id).map(item => [item.id as string, item]));
    const attributes = buildCreatureAttributes(creature.attributes ?? [], catalogAttributes, formula);
    const skills = buildCreatureSkills({
      catalog: catalogSkills,
      skillBonuses: creature.skill_bonuses
    });

    const hydrate = (features: CreatureFeature[] | undefined) =>
      hydrateFeatures(features ?? [], damageById, attributes, creature.prof_bonus ?? 0);

    return {
      id: creature._id.toString(),
      name: creature.name,
      ruleset: creature.ruleset,
      img: creature.img,
      description: creature.description ?? [],
      creatureType: creatureType ?? undefined,
      race,
      size: creature.size,
      alignment: creature.alignment,
      armor_class: creature.armor_class,
      CA: resolveArmorClass(creature.armor_class, attributes),
      HPMax: creature.HPMax,
      hit_dice: creature.hit_dice,
      speed: creature.speed,
      attributes,
      saving_throws: creature.saving_throws ?? [],
      skills,
      senses: {
        ...(creature.senses ?? {}),
        passive_perception: resolvePassivePerception(skills, attributes, creature.senses?.passive_perception)
      },
      languages: {
        speaks,
        understands,
        notes: creature.languages?.notes
      },
      language_choices: languageChoices,
      challenge_rating: creature.challenge_rating,
      xp: creature.xp,
      prof_bonus: creature.prof_bonus,
      damage_vulnerabilities: orderedDamages(creature.damage_vulnerabilities ?? [], damageById),
      damage_immunities: orderedDamages(creature.damage_immunities ?? [], damageById),
      damage_resistances: orderedDamages(creature.damage_resistances ?? [], damageById),
      condition_immunities: conditions,
      special_abilities: hydrate(creature.special_abilities),
      spellcasting: hydrateSpellcasting(creature.spellcasting, spellById, catalogAttributes),
      innateSpellcasting: hydrateInnateSpellcasting(creature.innateSpellcasting, spellById, catalogAttributes),
      actions: hydrate(creature.actions),
      bonus_actions: hydrate(creature.bonus_actions),
      reactions: hydrate(creature.reactions),
      legendary_actions: creature.legendary_actions
        ? {
          uses: creature.legendary_actions.uses,
          description: creature.legendary_actions.description,
          actions: hydrate(creature.legendary_actions.actions)
        }
        : undefined,
      equipment: equipment ?? [],
      deletedAt: creature.deletedAt ?? null
    };
  }

  private async resolveRace(stored: string | null | undefined): Promise<CreatureApi["race"]> {
    if (stored == null || stored.length === 0 || stored === CREATURE_ANY_RACE) {
      return formatStoredCreatureRace(stored);
    }
    const [ref] = await this.raceRepository.getRaceRefsByIds([stored]);
    return formatStoredCreatureRace(stored, ref);
  }
}

function hydrateFeatures(
  features: CreatureFeature[],
  damageById: Map<string, Damage>,
  attributes: CharacterAttributeApi[],
  profBonus: number
): CreatureFeatureApi[] {
  return features.map(feature => ({
    name: feature.name,
    description: feature.description ?? [],
    usage: feature.usage,
    cost: feature.cost,
    attack: feature.attack
      ? hydrateAttack(feature.attack, damageById, attributes, profBonus)
      : undefined
  }));
}

function hydrateAttack(
  attack: CreatureAttack,
  damageById: Map<string, Damage>,
  attributes: CharacterAttributeApi[],
  profBonus: number
) {
  return {
    kind: attack.kind,
    attributeKey: attack.attributeKey,
    bonus: resolveAttackBonus(attack, attributes, profBonus),
    reach: attack.reach,
    range: attack.range,
    targets: attack.targets,
    equipmentId: attack.equipmentId,
    damage: (attack.damage ?? []).map(roll => ({
      dice: roll.dice,
      bonus: roll.bonus,
      damageType: damageById.get(roll.damageTypeId) ?? null
    }))
  };
}

export function hydrateSpellcasting(
  stored: CreatureSpellcasting | null | undefined,
  spellById: Map<string, SpellApi>,
  catalogAttributes: AttributeApi[] = []
): CreatureSpellcastingApi {
  if (!stored || !Array.isArray(stored.spells)) {
    return { slots: {}, spells: [] };
  }

  const ability = resolveSpellcastingAbility(stored.abilityId, catalogAttributes);

  return {
    ...(stored.casterLevel !== undefined ? { casterLevel: stored.casterLevel } : {}),
    ...(ability ? { ability } : {}),
    ...(stored.spellSaveDc !== undefined ? { spellSaveDc: stored.spellSaveDc } : {}),
    ...(stored.spellAttackBonus !== undefined ? { spellAttackBonus: stored.spellAttackBonus } : {}),
    slots: stored.slots ?? {},
    spells: orderedSpells(stored.spells, spellById)
  };
}

export function hydrateInnateSpellcasting(
  stored: CreatureInnateSpellcasting | null | undefined,
  spellById: Map<string, SpellApi>,
  catalogAttributes: AttributeApi[] = []
): CreatureInnateSpellcastingApi {
  if (!stored || !Array.isArray(stored.spells)) {
    return { spells: [] };
  }

  const ability = resolveSpellcastingAbility(stored.abilityId, catalogAttributes);

  return {
    ...(ability ? { ability } : {}),
    ...(stored.spellSaveDc !== undefined ? { spellSaveDc: stored.spellSaveDc } : {}),
    ...(stored.spellAttackBonus !== undefined ? { spellAttackBonus: stored.spellAttackBonus } : {}),
    spells: stored.spells
      .filter(group => group && group.usage && Array.isArray(group.spells))
      .map(group => ({
        usage: group.usage,
        spells: orderedSpells(group.spells, spellById)
      }))
  };
}

function resolveSpellcastingAbility(
  abilityId: string | undefined,
  catalogAttributes: AttributeApi[]
): AttributeApi | undefined {
  if (!abilityId) return undefined;
  return catalogAttributes.find(attribute => attribute.id === abilityId)
    ?? catalogAttributes.find(attribute => attribute.key === abilityId);
}

function orderedDamages(ids: string[], damageById: Map<string, Damage>): Damage[] {
  return ids.flatMap(id => {
    const damage = damageById.get(id);
    return damage ? [damage] : [];
  });
}

function orderedSpells(ids: string[], spellById: Map<string, SpellApi>): SpellApi[] {
  return ids.flatMap(id => {
    const spell = spellById.get(id);
    return spell ? [spell] : [];
  });
}

function collectDamageIds(creature: CreatureMongo): string[] {
  const fromFeatures = (features: CreatureFeature[] | undefined) =>
    (features ?? []).flatMap(feature => (feature.attack?.damage ?? []).map(roll => roll.damageTypeId));

  return unique([
    ...(creature.damage_vulnerabilities ?? []),
    ...(creature.damage_immunities ?? []),
    ...(creature.damage_resistances ?? []),
    ...fromFeatures(creature.special_abilities),
    ...fromFeatures(creature.actions),
    ...fromFeatures(creature.bonus_actions),
    ...fromFeatures(creature.reactions),
    ...fromFeatures(creature.legendary_actions?.actions)
  ]);
}

function collectSpellIds(spellcasting: CreatureSpellcasting | null | undefined): string[] {
  if (!spellcasting || !Array.isArray(spellcasting.spells)) return [];
  return unique(spellcasting.spells);
}

function collectInnateSpellIds(innate: CreatureInnateSpellcasting | null | undefined): string[] {
  if (!innate || !Array.isArray(innate.spells)) return [];
  return unique(innate.spells.flatMap(group => (Array.isArray(group?.spells) ? group.spells : [])));
}

export function formatStoredCreatureRace(
  stored: string | null | undefined,
  ref?: RaceRef
): CreatureApi["race"] {
  if (stored == null || stored.length === 0) return null;
  if (stored === CREATURE_ANY_RACE) return CREATURE_ANY_RACE;
  return ref ?? null;
}

export function creatureObjectIds(ids: string[]): Types.ObjectId[] {
  return ids
    .filter(id => Types.ObjectId.isValid(id))
    .map(id => new Types.ObjectId(id));
}

function unique(ids: string[]): string[] {
  return [...new Set(ids.filter(id => typeof id === "string" && id.length > 0))];
}
