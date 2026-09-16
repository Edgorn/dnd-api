import CharacterClassService from "../../../domain/services/characterClass.service";
import SystemService from "../../../domain/services/system.service";
import { AppError } from "../../../domain/errors/AppError";

export async function assertClassBelongsToSubclassRuleset(
  characterClassService: CharacterClassService,
  systemService: SystemService,
  classId: string,
  ruleset: string
): Promise<void> {
  const characterClass = await characterClassService.getById(classId);
  if (!characterClass || characterClass.deletedAt) {
    throw new AppError("Clase asociada no encontrada", 404);
  }

  const tree = await systemService.getSystemsAndAncestors([ruleset]);
  if (!tree.includes(characterClass.ruleset)) {
    throw new AppError("La clase no pertenece al árbol de sistemas de esta subclase", 400);
  }
}
