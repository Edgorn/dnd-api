import IBackgroundRepository from "../../../domain/repositories/IBackgroundRepository";
import ISystemRepository from "../../../domain/repositories/ISystemRepository";
import { NotFoundError, ValidationError } from "../../../domain/errors/AppError";

export async function assertValidBackgroundParent(
  backgroundRepository: IBackgroundRepository,
  systemRepository: ISystemRepository,
  parentId: string,
  childRuleset: string
): Promise<void> {
  const parent = await backgroundRepository.getById(parentId);
  if (!parent || parent.deletedAt) {
    throw new NotFoundError(`No se encontró el trasfondo padre con id: ${parentId}`);
  }

  if (parent.parentId) {
    throw new ValidationError("El trasfondo padre debe ser un trasfondo raíz, no una variante");
  }

  const expanded = await systemRepository.getSystemsAndAncestors([childRuleset]);
  if (!expanded.includes(parent.ruleset)) {
    throw new ValidationError("El sistema de la variante debe ser el del padre o un sistema derivado");
  }
}
