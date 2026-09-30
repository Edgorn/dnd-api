import SystemService from "../../../domain/services/system.service";
import IAttributeRepository from "../../../domain/repositories/IAttributeRepository";
import ISkillRepository from "../../../domain/repositories/ISkillRepository";
import ILanguageRepository from "../../../domain/repositories/ILanguageRepository";
import IMagicSchoolRepository from "../../../domain/repositories/IMagicSchoolRepository";
import IFeatRepository from "../../../domain/repositories/IFeatRepository";
import IEntityOverrideRepository from "../../../domain/repositories/IEntityOverrideRepository";
import IArmorTypeRepository from "../../../domain/repositories/IArmorTypeRepository";
import ICreatureTypeRepository from "../../../domain/repositories/ICreatureTypeRepository";
import ICreatureRepository from "../../../domain/repositories/ICreatureRepository";
import IConditionRepository from "../../../domain/repositories/IConditionRepository";
import { AppError } from "../../../domain/errors/AppError";
import { parentIdStrings } from "../../../domain/services/systemHierarchy";

export default class CascadeRestoreSystem {
  constructor(
    private readonly systemService: SystemService,
    private readonly attributeRepository: IAttributeRepository,
    private readonly skillRepository: ISkillRepository,
    private readonly languageRepository: ILanguageRepository,
    private readonly magicSchoolRepository?: IMagicSchoolRepository,
    private readonly featRepository?: IFeatRepository,
    private readonly entityOverrideRepository?: IEntityOverrideRepository,
    private readonly armorTypeRepository?: IArmorTypeRepository,
    private readonly creatureTypeRepository?: ICreatureTypeRepository,
    private readonly creatureRepository?: ICreatureRepository,
    private readonly conditionRepository?: IConditionRepository
  ) {}

  async execute(id: string, userId: string): Promise<void> {
    const system = await this.systemService.getByIdWithDeleted(id);
    if (!system) {
      throw new AppError("Sistema no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para restaurar este sistema", 403);
    }

    const deletedAt = system.deletedAt;
    if (!deletedAt) {
      throw new AppError("El sistema no está eliminado", 400);
    }

    await this.assertRestorable(system);
    await this.restoreSystemAndDescendants(id, deletedAt);
  }

  private async assertRestorable(system: { isBase: boolean; parentIds?: Array<{ toString(): string }> }): Promise<void> {
    if (system.isBase) return;

    const parentIds = parentIdStrings(system.parentIds);
    for (const parentId of parentIds) {
      const parent = await this.systemService.getById(parentId);
      if (parent) return;
    }

    throw new AppError("No se puede restaurar un sistema no base sin un padre activo", 400);
  }

  private async restoreSystemAndDescendants(id: string, deletedAt: Date): Promise<void> {
    await this.restoreSystemAndEntities(id, deletedAt);

    const children = await this.systemService.getChildrenDeletedAt(id, deletedAt);
    for (const child of children) {
      await this.restoreSystemAndDescendants(child._id.toString(), deletedAt);
    }
  }

  private async restoreSystemAndEntities(id: string, deletedAt: Date): Promise<void> {
    await this.systemService.restore(id);

    const cascadePromises: Promise<void>[] = [
      this.attributeRepository.restoreByRuleset(id, deletedAt),
      this.skillRepository.restoreByRuleset(id, deletedAt),
      this.languageRepository.restoreByRuleset(id, deletedAt),
    ];

    if (this.magicSchoolRepository) {
      cascadePromises.push(this.magicSchoolRepository.restoreByRuleset(id, deletedAt));
    }

    if (this.featRepository) {
      cascadePromises.push(this.featRepository.restoreByRuleset(id, deletedAt));
    }

    if (this.entityOverrideRepository) {
      cascadePromises.push(this.entityOverrideRepository.restoreByRuleset(id, deletedAt));
    }

    if (this.armorTypeRepository) {
      cascadePromises.push(this.armorTypeRepository.restoreByRuleset(id, deletedAt));
    }

    if (this.creatureTypeRepository) {
      cascadePromises.push(this.creatureTypeRepository.restoreByRuleset(id, deletedAt));
    }

    if (this.creatureRepository) {
      cascadePromises.push(this.creatureRepository.restoreByRuleset(id, deletedAt));
    }

    if (this.conditionRepository) {
      cascadePromises.push(this.conditionRepository.restoreByRuleset(id, deletedAt));
    }

    await Promise.all(cascadePromises);
  }
}
