import CreatureService from "../../../domain/services/creature.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";
import { CREATURE_ANY_RACE, CreatureApi, UpdateCreature } from "../../../domain/types/creature.types";
import { assertCreatureCatalogRefs } from "./assertCreatureCatalogRefs";
import AttributeService from "../../../domain/services/attribute.service";
import CreatureTypeService from "../../../domain/services/creatureType.service";
import DamageService from "../../../domain/services/damage.service";
import EquipmentService from "../../../domain/services/equipment.service";
import LanguageService from "../../../domain/services/language.service";
import RaceService from "../../../domain/services/race.service";
import SkillService from "../../../domain/services/skill.service";
import SpellService from "../../../domain/services/spell.service";
import IEstadoRepository from "../../../domain/repositories/IEstadoRepository";

export default class UpdateCreatureUseCase {
  constructor(
    private readonly creatureService: CreatureService,
    private readonly systemService: SystemService,
    private readonly creatureTypeService: CreatureTypeService,
    private readonly raceService: RaceService,
    private readonly attributeService: AttributeService,
    private readonly skillService: SkillService,
    private readonly spellService: SpellService,
    private readonly damageService: DamageService,
    private readonly languageService: LanguageService,
    private readonly equipmentService: EquipmentService,
    private readonly estadoRepository: IEstadoRepository
  ) {}

  async execute(data: UpdateCreature, userId: string): Promise<CreatureApi> {
    const existing = await this.creatureService.getById(data.id);
    if (!existing) {
      throw new AppError("Criatura no encontrada", 404);
    }

    await this.assertPublisher(existing.ruleset, userId, "No tienes permisos para editar esta criatura");

    const ruleset = data.ruleset ?? existing.ruleset;
    if (data.ruleset && data.ruleset !== existing.ruleset) {
      await this.assertPublisher(data.ruleset, userId, "No tienes permisos para mover esta criatura a ese sistema");
    }

    if (this.touchesCatalog(data)) {
      await assertCreatureCatalogRefs({
        data: {
          name: existing.name,
          ruleset,
          creatureTypeId: data.creatureTypeId ?? existing.creatureType?.id ?? "",
          race: data.race !== undefined ? data.race : storedRaceId(existing.race),
          size: existing.size,
          alignment: existing.alignment,
          HPMax: existing.HPMax,
          speed: data.speed ?? existing.speed,
          challenge_rating: existing.challenge_rating,
          xp: existing.xp,
          prof_bonus: existing.prof_bonus,
          attributes: data.attributes,
          skill_bonuses: data.skill_bonuses,
          spellcasting: data.spellcasting,
          innateSpellcasting: data.innateSpellcasting,
          damage_vulnerabilities: data.damage_vulnerabilities,
          damage_immunities: data.damage_immunities,
          damage_resistances: data.damage_resistances,
          condition_immunities: data.condition_immunities,
          languages: data.languages,
          language_choices: data.language_choices,
          equipment: data.equipment,
          special_abilities: data.special_abilities,
          actions: data.actions,
          bonus_actions: data.bonus_actions,
          reactions: data.reactions,
          legendary_actions: data.legendary_actions
        },
        creatureTypeService: this.creatureTypeService,
        raceService: this.raceService,
        attributeService: this.attributeService,
        skillService: this.skillService,
        spellService: this.spellService,
        damageService: this.damageService,
        languageService: this.languageService,
        equipmentService: this.equipmentService,
        systemService: this.systemService,
        estadoRepository: this.estadoRepository
      });
    }

    return this.creatureService.update(data);
  }

  private touchesCatalog(data: UpdateCreature): boolean {
    return data.ruleset !== undefined
      || data.creatureTypeId !== undefined
      || data.race !== undefined
      || data.attributes !== undefined
      || data.skill_bonuses !== undefined
      || data.spellcasting !== undefined
      || data.innateSpellcasting !== undefined
      || data.damage_vulnerabilities !== undefined
      || data.damage_immunities !== undefined
      || data.damage_resistances !== undefined
      || data.condition_immunities !== undefined
      || data.languages !== undefined
      || data.language_choices !== undefined
      || data.equipment !== undefined
      || data.special_abilities !== undefined
      || data.actions !== undefined
      || data.bonus_actions !== undefined
      || data.reactions !== undefined
      || data.legendary_actions !== undefined;
  }

  private async assertPublisher(ruleset: string, userId: string, forbiddenMessage: string): Promise<void> {
    const system = await this.systemService.getById(ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }
    if (system.publisher !== userId) {
      throw new AppError(forbiddenMessage, 403);
    }
  }
}

function storedRaceId(race: CreatureApi["race"] | undefined): string | null {
  if (race == null) return null;
  if (race === CREATURE_ANY_RACE) return CREATURE_ANY_RACE;
  return race.id;
}
