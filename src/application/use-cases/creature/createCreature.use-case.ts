import CreatureService from "../../../domain/services/creature.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";
import { CreateCreature, CreatureApi } from "../../../domain/types/creature.types";
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

export default class CreateCreatureUseCase {
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

  async execute(data: CreateCreature, userId: string): Promise<CreatureApi> {
    const system = await this.systemService.getById(data.ruleset);
    if (!system) {
      throw new AppError("Sistema asociado no encontrado", 404);
    }
    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para crear criaturas en este sistema", 403);
    }

    await assertCreatureCatalogRefs({
      data,
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

    return this.creatureService.create(data);
  }
}
