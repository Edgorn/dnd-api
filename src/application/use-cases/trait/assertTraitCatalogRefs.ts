import LanguageService from "../../../domain/services/language.service";
import DamageService from "../../../domain/services/damage.service";
import CreatureTypeService from "../../../domain/services/creatureType.service";
import SystemService from "../../../domain/services/system.service";
import TraitService from "../../../domain/services/trait.service";
import { AppError } from "../../../domain/errors/AppError";
import {
  TraitCatalogChoice,
  TraitDamageChoice,
  TraitDamageChoiceRef,
  TraitLanguages
} from "../../../domain/types/traits.types";

export async function assertTraitCatalogRefs(input: {
  ruleset: string;
  languages?: TraitLanguages | null;
  resistances?: string[] | null;
  damageChoices?: TraitDamageChoice[] | null;
  catalogChoices?: TraitCatalogChoice[] | null;
  damageChoiceRef?: TraitDamageChoiceRef | null;
  languageService: LanguageService;
  damageService: DamageService;
  creatureTypeService: CreatureTypeService;
  systemService: SystemService;
  traitService: TraitService;
}): Promise<{
  languages?: TraitLanguages | null;
  damageChoiceRef?: TraitDamageChoiceRef | null;
}> {
  const languageIds = uniqueIds([
    ...(input.languages?.speaks ?? []),
    ...(input.languages?.understands ?? [])
  ]);
  const damageIds = uniqueIds([
    ...(input.resistances ?? []),
    ...(input.damageChoices ?? []).flatMap(choice => choice.options.map(option => option.damageTypeId))
  ]);
  const creatureTypeIds = uniqueIds(
    (input.catalogChoices ?? []).flatMap(choice => [
      ...(choice.options ?? []).flatMap(option => option.creatureTypeId ? [option.creatureTypeId] : []),
      ...(choice.creatureTypeRaces ?? []).map(item => item.creatureTypeId)
    ])
  );
  const publicLanguageIds = new Map<string, string>();

  if (languageIds.length || damageIds.length || creatureTypeIds.length) {
    const allowedRulesets = await input.systemService.getSystemsAndAncestors([input.ruleset]);

    for (const languageId of languageIds) {
      const language = await input.languageService.getById(languageId);
      if (!language || language.deletedAt) {
        throw new AppError("Idioma no encontrado", 404);
      }
      if (!allowedRulesets.includes(language.ruleset)) {
        throw new AppError("El idioma no pertenece a este sistema ni a sus ancestros", 400);
      }
      publicLanguageIds.set(languageId, language.id);
    }

    for (const damageId of damageIds) {
      const damage = await input.damageService.getById(damageId);
      if (!damage || damage.deletedAt) {
        throw new AppError("Tipo de daño no encontrado", 404);
      }
      if (!allowedRulesets.includes(damage.ruleset)) {
        throw new AppError("El tipo de daño no pertenece a este sistema ni a sus ancestros", 400);
      }
    }

    for (const creatureTypeId of creatureTypeIds) {
      const creatureType = await input.creatureTypeService.getById(creatureTypeId);
      if (!creatureType || creatureType.deletedAt) {
        throw new AppError("Tipo de criatura no encontrado", 404);
      }
      if (!allowedRulesets.includes(creatureType.ruleset)) {
        throw new AppError("El tipo de criatura no pertenece a este sistema ni a sus ancestros", 400);
      }
    }
  }

  const languages = input.languages
    ? {
      speaks: publicIds(input.languages.speaks ?? [], publicLanguageIds),
      understands: publicIds(input.languages.understands ?? [], publicLanguageIds)
    }
    : input.languages;

  if (!input.damageChoiceRef) {
    return { languages, damageChoiceRef: input.damageChoiceRef };
  }

  const matches = await input.traitService.getTraitsByIndexes([input.damageChoiceRef.traitId]);
  if (!matches.length) {
    throw new AppError("Rasgo referenciado no encontrado", 404);
  }

  const referenced = matches.find(trait =>
    trait.damageChoices?.some(choice => choice.key === input.damageChoiceRef?.choiceKey)
  );
  if (!referenced) {
    throw new AppError("La elección de daño no existe en el rasgo referenciado", 400);
  }

  return {
    languages,
    damageChoiceRef: {
      ...input.damageChoiceRef,
      traitId: referenced.id
    }
  };
}

function uniqueIds(ids: string[]): string[] {
  return [...new Set(ids.filter(id => typeof id === "string" && id.length > 0))];
}

function publicIds(ids: string[], publicLanguageIds: Map<string, string>): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of ids) {
    const publicId = publicLanguageIds.get(id) ?? id;
    if (seen.has(publicId)) continue;
    seen.add(publicId);
    result.push(publicId);
  }
  return result;
}
