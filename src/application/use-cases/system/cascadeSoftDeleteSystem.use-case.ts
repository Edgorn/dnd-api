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
import { System } from "../../../domain/types/system.types";
import { parentIdStrings } from "../../../domain/services/systemHierarchy";

export default class CascadeSoftDeleteSystem {
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
    const system = await this.systemService.getById(id);
    if (!system) {
      throw new AppError("Sistema no encontrado", 404);
    }

    if (system.publisher !== userId) {
      throw new AppError("No tienes permisos para borrar este sistema", 403);
    }

    const toDelete = await this.collectOrphanedSubtree(system);
    const foreign = toDelete.filter((candidate) => candidate.publisher !== userId);
    if (foreign.length > 0) {
      const names = foreign.map((candidate) => candidate.name).join(", ");
      throw new AppError(
        `No se puede borrar: la cascada incluye sistemas de otros usuarios (${names})`,
        409
      );
    }

    const deletedAt = new Date();
    for (const candidate of toDelete) {
      await this.softDeleteSystemAndEntities(candidate._id.toString(), deletedAt);
    }
  }

  private async collectOrphanedSubtree(root: System): Promise<System[]> {
    const byId = new Map<string, System>([[root._id.toString(), root]]);
    let grown = true;

    while (grown) {
      grown = false;
      for (const id of [...byId.keys()]) {
        const children = await this.systemService.getChildren(id);
        for (const child of children) {
          const childId = child._id.toString();
          if (byId.has(childId)) continue;

          const livingParentIds: string[] = [];
          for (const parentId of parentIdStrings(child.parentIds)) {
            const parent = await this.systemService.getById(parentId);
            if (parent) livingParentIds.push(parentId);
          }

          if (livingParentIds.length > 0 && livingParentIds.every((parentId) => byId.has(parentId))) {
            byId.set(childId, child);
            grown = true;
          }
        }
      }
    }

    return [...byId.values()];
  }

  private async softDeleteSystemAndEntities(id: string, deletedAt: Date): Promise<void> {
    await this.systemService.softDelete(id, deletedAt);

    const cascadePromises: Promise<void>[] = [
      this.attributeRepository.softDeleteByRuleset(id, deletedAt),
      this.skillRepository.softDeleteByRuleset(id, deletedAt),
      this.languageRepository.softDeleteByRuleset(id, deletedAt),
    ];

    if (this.magicSchoolRepository) {
      cascadePromises.push(this.magicSchoolRepository.softDeleteByRuleset(id, deletedAt));
    }

    if (this.featRepository) {
      cascadePromises.push(this.featRepository.softDeleteByRuleset(id, deletedAt));
    }

    if (this.entityOverrideRepository) {
      cascadePromises.push(this.entityOverrideRepository.softDeleteByRuleset(id, deletedAt));
    }

    if (this.armorTypeRepository) {
      cascadePromises.push(this.armorTypeRepository.softDeleteByRuleset(id, deletedAt));
    }

    if (this.creatureTypeRepository) {
      cascadePromises.push(this.creatureTypeRepository.softDeleteByRuleset(id, deletedAt));
    }

    if (this.creatureRepository) {
      cascadePromises.push(this.creatureRepository.softDeleteByRuleset(id, deletedAt));
    }

    if (this.conditionRepository) {
      cascadePromises.push(this.conditionRepository.softDeleteByRuleset(id, deletedAt));
    }

    await Promise.all(cascadePromises);
  }
}
