import { LanguageApi, LanguageGrantApi } from "../domain/types/language.types";
import { isMongoObjectId } from "./mongoObjectId";

export function collectCatalogLanguageIds(...lists: (string[] | undefined)[]): string[] {
  const ids = new Set<string>();
  for (const list of lists) {
    for (const value of list ?? []) {
      if (isMongoObjectId(value)) ids.add(value);
    }
  }
  return [...ids];
}

export function languageApiById(languages: LanguageApi[]): Map<string, LanguageApi> {
  return new Map(languages.map(language => [language.id, language]));
}

export function hydrateLanguageGrants(
  raw: string[],
  catalogById: Map<string, LanguageApi>
): LanguageGrantApi[] {
  const result: LanguageGrantApi[] = [];
  for (const value of raw) {
    if (!value) continue;
    if (isMongoObjectId(value)) {
      const language = catalogById.get(value);
      if (language) result.push(language);
      continue;
    }
    result.push({ name: value });
  }
  return result;
}

export function catalogLanguagesById(grants: LanguageGrantApi[]): Map<string, LanguageApi> {
  const map = new Map<string, LanguageApi>();
  for (const grant of grants) {
    if ("id" in grant) map.set(grant.id, grant);
  }
  return map;
}
