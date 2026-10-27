import { NotFoundError, ValidationError } from "../domain/errors/AppError";
import ICreatureRepository from "../domain/repositories/ICreatureRepository";
import { CompanionKind, DEFAULT_COMPANION_KIND } from "../domain/types/character.types";

export async function assertCompanionCreature(
  creatureRepository: Pick<ICreatureRepository, "getById">,
  allowedRulesets: string[],
  input: { kind?: CompanionKind; creatureId?: string }
): Promise<{ hpMax?: number }> {
  const kind = input.kind ?? DEFAULT_COMPANION_KIND;
  const needsCreature = kind === "mount" || kind === "animal";

  if (needsCreature && !input.creatureId) {
    throw new ValidationError("Las monturas y animales requieren una criatura del catálogo");
  }

  if (!input.creatureId) return {};

  const creature = await creatureRepository.getById(input.creatureId);
  if (!creature || creature.deletedAt) {
    throw new NotFoundError("Criatura no encontrada");
  }
  if (!allowedRulesets.includes(creature.ruleset)) {
    throw new ValidationError("La criatura no pertenece a este sistema ni a sus ancestros");
  }
  if (kind === "mount" && !creature.canBeMount) {
    throw new ValidationError("Esta criatura no puede usarse como montura");
  }

  return { hpMax: creature.HPMax };
}
