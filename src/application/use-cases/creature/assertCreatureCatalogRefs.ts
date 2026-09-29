import AttributeService from "../../../domain/services/attribute.service";
import CreatureTypeService from "../../../domain/services/creatureType.service";
import DamageService from "../../../domain/services/damage.service";
import EquipmentService from "../../../domain/services/equipment.service";
import LanguageService from "../../../domain/services/language.service";
import RaceService from "../../../domain/services/race.service";
import SkillService from "../../../domain/services/skill.service";
import SpellService from "../../../domain/services/spell.service";
import SystemService from "../../../domain/services/system.service";
import IEstadoRepository from "../../../domain/repositories/IEstadoRepository";
import { AppError } from "../../../domain/errors/AppError";
import { CREATURE_ANY_RACE, CreateCreature, CreatureFeature, CreatureInnateSpellcasting, CreatureSpellcasting } from "../../../domain/types/creature.types";

export async function assertCreatureCatalogRefs(input: {
  data: CreateCreature;
  creatureTypeService: CreatureTypeService;
  raceService: RaceService;
  attributeService: AttributeService;
  skillService: SkillService;
  spellService: SpellService;
  damageService: DamageService;
  languageService: LanguageService;
  equipmentService: EquipmentService;
  systemService: SystemService;
  estadoRepository: IEstadoRepository;
}): Promise<void> {
  const allowedRulesets = await input.systemService.getSystemsAndAncestors([input.data.ruleset]);

  const creatureType = await input.creatureTypeService.getById(input.data.creatureTypeId);
  if (!creatureType || creatureType.deletedAt) {
    throw new AppError("Tipo de criatura no encontrado", 404);
  }
  if (!allowedRulesets.includes(creatureType.ruleset)) {
    throw new AppError("El tipo de criatura no pertenece a este sistema ni a sus ancestros", 400);
  }

  const raceId = input.data.race;
  if (raceId && raceId !== CREATURE_ANY_RACE) {
    const race = await input.raceService.obtenerPorId(raceId);
    if (!race) {
      throw new AppError("Raza no encontrada", 404);
    }
    if (!allowedRulesets.includes(race.ruleset)) {
      throw new AppError("La raza no pertenece a este sistema ni a sus ancestros", 400);
    }
  }

  const catalogAttributes = await input.attributeService.getBySystems(allowedRulesets);
  const attributeKeys = new Set(catalogAttributes.map(attribute => attribute.key));
  for (const attribute of input.data.attributes ?? []) {
    if (!attributeKeys.has(attribute.key)) {
      throw new AppError("El atributo no pertenece a este sistema ni a sus ancestros", 400);
    }
  }

  const abilityIds = unique([
    input.data.spellcasting?.abilityId ?? "",
    input.data.innateSpellcasting?.abilityId ?? ""
  ]);
  for (const abilityId of abilityIds) {
    if (!catalogAttributes.some(attribute => attribute.id === abilityId)) {
      throw new AppError("La aptitud mágica no pertenece a este sistema ni a sus ancestros", 400);
    }
  }

  for (const skillId of unique((input.data.skill_bonuses ?? []).map(bonus => bonus.skillId))) {
    const skill = await input.skillService.getById(skillId);
    if (!skill || skill.deletedAt) {
      throw new AppError("Habilidad no encontrada", 404);
    }
    if (!allowedRulesets.includes(skill.ruleset)) {
      throw new AppError("La habilidad no pertenece a este sistema ni a sus ancestros", 400);
    }
  }

  for (const spellId of collectSpellIds(input.data.spellcasting, input.data.innateSpellcasting)) {
    const spell = await input.spellService.getById(spellId);
    if (!spell || spell.deletedAt) {
      throw new AppError("Conjuro no encontrado", 404);
    }
    if (spell.ruleset && !allowedRulesets.includes(spell.ruleset)) {
      throw new AppError("El conjuro no pertenece a este sistema ni a sus ancestros", 400);
    }
  }

  for (const damageId of collectDamageIds(input.data)) {
    const damage = await input.damageService.getById(damageId);
    if (!damage || damage.deletedAt) {
      throw new AppError("Tipo de daño no encontrado", 404);
    }
    if (!allowedRulesets.includes(damage.ruleset)) {
      throw new AppError("El tipo de daño no pertenece a este sistema ni a sus ancestros", 400);
    }
  }

  const conditionIds = unique(input.data.condition_immunities ?? []);
  if (conditionIds.length) {
    const conditions = await input.estadoRepository.obtenerEstadosPorIndices(conditionIds);
    const found = new Set(conditions.map(condition => condition.index));
    if (conditionIds.some(id => !found.has(id))) {
      throw new AppError("Estado no encontrado", 404);
    }
  }

  const languageIds = unique([
    ...(input.data.languages?.speaks ?? []),
    ...(input.data.languages?.understands ?? []),
    ...(Array.isArray(input.data.language_choices?.options) ? input.data.language_choices.options : [])
  ]);
  for (const languageId of languageIds) {
    const language = await input.languageService.getById(languageId);
    if (!language || language.deletedAt) {
      throw new AppError("Idioma no encontrado", 404);
    }
    if (!allowedRulesets.includes(language.ruleset)) {
      throw new AppError("El idioma no pertenece a este sistema ni a sus ancestros", 400);
    }
  }

  for (const item of input.data.equipment ?? []) {
    const equipmentId = item.equipmentId || item.id;
    if (!equipmentId) continue;
    const equipment = await input.equipmentService.getById(equipmentId);
    if (!equipment || equipment.deletedAt) {
      throw new AppError("Equipo no encontrado", 404);
    }
    if (!allowedRulesets.includes(equipment.ruleset)) {
      throw new AppError("El equipo no pertenece a este sistema ni a sus ancestros", 400);
    }
  }
}

function collectSpellIds(
  spellcasting: CreatureSpellcasting | null | undefined,
  innate: CreatureInnateSpellcasting | null | undefined
): string[] {
  return unique([
    ...(spellcasting?.spells ?? []),
    ...(innate?.spells ?? []).flatMap(group => group.spells ?? [])
  ]);
}

function collectDamageIds(data: CreateCreature): string[] {
  const fromFeatures = (features: CreatureFeature[] | undefined) =>
    (features ?? []).flatMap(feature => (feature.attack?.damage ?? []).map(roll => roll.damageTypeId));

  return unique([
    ...(data.damage_vulnerabilities ?? []),
    ...(data.damage_immunities ?? []),
    ...(data.damage_resistances ?? []),
    ...fromFeatures(data.special_abilities),
    ...fromFeatures(data.actions),
    ...fromFeatures(data.bonus_actions),
    ...fromFeatures(data.reactions),
    ...fromFeatures(data.legendary_actions?.actions)
  ]);
}

function unique(ids: string[]): string[] {
  return [...new Set(ids.filter(id => typeof id === "string" && id.length > 0))];
}
