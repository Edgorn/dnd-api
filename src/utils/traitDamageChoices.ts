import { Damage } from "../domain/types";
import { LanguageApi } from "../domain/types/language.types";
import {
  CatalogChoiceEntry,
  PendingCatalogChoice,
  ResolvedCatalogChoice,
  ResolvedDamageChoice,
  TraitApi,
  TraitCatalogChoice,
  TraitCatalogOption,
  TraitChoiceValue,
  TraitChoices,
  TraitDamageChoiceApi,
  TraitLanguagesApi
} from "../domain/types/traits.types";

const INPUT_MAX = 80;

type EnteringTrait = Pick<TraitApi, "id" | "damageChoices">;

export function applyEnteringTraitChoices(input: {
  existing?: TraitChoices | null;
  incoming?: TraitChoices | null;
  enteringTraits: EnteringTrait[];
}): { traitChoices: TraitChoices } | { error: string } {
  const traitChoices = cloneChoices(input.existing);
  const enteringIds = new Set(input.enteringTraits.map(trait => trait.id));

  for (const trait of input.enteringTraits) {
    if (!trait.id || !trait.damageChoices?.length) continue;

    for (const choice of trait.damageChoices) {
      const stored = traitChoices[trait.id]?.[choice.key];
      const sent = readSelection(input.incoming, trait.id, choice.key);
      if ("error" in sent) return sent;

      if (stored) {
        if (sent.ids && !sameIds(stored, sent.ids)) {
          return { error: `La elección ${choice.key} del rasgo ${trait.id} ya está guardada` };
        }
        continue;
      }

      if (!sent.ids) {
        return {
          error: `Debe elegir las opciones de daño (${choice.key}) del rasgo ${trait.id}`
        };
      }

      const invalid = validateSelection(trait.id, choice, sent.ids);
      if (invalid) return { error: invalid };

      if (!traitChoices[trait.id]) traitChoices[trait.id] = {};
      traitChoices[trait.id][choice.key] = [...sent.ids];
    }
  }

  for (const [traitId, choices] of Object.entries(input.incoming ?? {})) {
    const enteringWithTable = enteringIds.has(traitId)
      && input.enteringTraits.some(trait => trait.id === traitId && Boolean(trait.damageChoices?.length));
    if (enteringWithTable) continue;
    if (!choices || typeof choices !== "object") continue;

    for (const [key, ids] of Object.entries(choices)) {
      const stored = traitChoices[traitId]?.[key];
      if (!stored || !Array.isArray(ids)) continue;
      if (!sameChoiceValues(stored, ids)) {
        return { error: `La elección ${key} del rasgo ${traitId} ya está guardada` };
      }
    }
  }

  return { traitChoices };
}

type CatalogTrait = Pick<TraitApi, "id" | "catalogChoices">;

export function listPendingCatalogChoices(input: {
  existing?: TraitChoices | null;
  classLevel: number;
  grantedTraits: CatalogTrait[];
}): PendingCatalogChoice[] {
  const stored = cloneChoices(input.existing);
  const pending: PendingCatalogChoice[] = [];

  for (const trait of input.grantedTraits) {
    if (!trait.id || !trait.catalogChoices?.length) continue;

    for (const choice of trait.catalogChoices) {
      const chosen = stored[trait.id]?.[choice.key] ?? [];
      const required = catalogRequired(choice, input.classLevel);
      const add = required - chosen.length;
      if (add <= 0) continue;

      const chosenNames = new Set(chosen.map(entryName));
      pending.push({
        traitId: trait.id,
        key: choice.key,
        add,
        options: choice.options.filter(option => option.repeatable || !chosenNames.has(option.name)),
        chosen: presentChosen(choice, chosen)
      });
    }
  }

  return pending;
}

export function applyCatalogTraitChoices(input: {
  existing?: TraitChoices | null;
  incoming?: TraitChoices | null;
  classLevel: number;
  grantedTraits: CatalogTrait[];
  allowedLanguageIds?: ReadonlySet<string>;
}): { traitChoices: TraitChoices } | { error: string } {
  const traitChoices = cloneChoices(input.existing);
  const allowedLanguageIds = input.allowedLanguageIds ?? new Set<string>();

  for (const trait of input.grantedTraits) {
    if (!trait.id || !trait.catalogChoices?.length) continue;

    for (const choice of trait.catalogChoices) {
      const stored = traitChoices[trait.id]?.[choice.key] ?? [];
      const required = catalogRequired(choice, input.classLevel);
      const sent = readCatalogSelection(input.incoming, trait.id, choice.key);
      if ("error" in sent) return sent;

      if (stored.length >= required) {
        if (sent.entries && !sameSequence(stored, sent.entries)) {
          return { error: `La elección ${choice.key} del rasgo ${trait.id} ya está guardada` };
        }
        continue;
      }

      if (!sent.entries) {
        return {
          error: `Debe elegir las opciones de catálogo (${choice.key}) del rasgo ${trait.id}`
        };
      }

      const invalid = validateCatalogGrowth(
        trait.id,
        choice,
        stored,
        required,
        sent.entries,
        allowedLanguageIds
      );
      if (invalid) return { error: invalid };

      if (!traitChoices[trait.id]) traitChoices[trait.id] = {};
      traitChoices[trait.id][choice.key] = sent.entries.map(persistEntry);
    }
  }

  return { traitChoices };
}

export function resolveCharacterTraitChoices(
  traits: TraitApi[],
  traitChoices?: TraitChoices | null
): { traits: TraitApi[]; grantedResistances: Damage[] } {
  const stored = cloneChoices(traitChoices);
  const byId = new Map(traits.map(trait => [trait.id, trait]));
  const ownRows = new Map<string, ResolvedDamageChoice[]>();

  for (const trait of traits) {
    if (!trait.damageChoices?.length) continue;
    const rows: ResolvedDamageChoice[] = [];
    for (const choice of trait.damageChoices) {
      const selected = stringNames(stored[trait.id]?.[choice.key]);
      if (!selected.length) continue;
      rows.push(...resolveRows(choice, selected));
    }
    if (rows.length) ownRows.set(trait.id, rows);
  }

  const grantedResistances: Damage[] = [];
  const grantedIds = new Set<string>();

  const nextTraits = traits.map(trait => {
    let rows = ownRows.get(trait.id) ?? [];
    const ref = trait.damageChoiceRef;
    if (ref) {
      const source = byId.get(ref.traitId);
      const sourceChoice = source?.damageChoices?.find(choice => choice.key === ref.choiceKey);
      const selected = stringNames(
        stored[ref.traitId]?.[ref.choiceKey]
        ?? (source ? stored[source.id]?.[ref.choiceKey] : undefined)
      );
      const refRows = sourceChoice && selected.length
        ? resolveRows(sourceChoice, selected)
        : [];
      if (refRows.length) {
        rows = refRows;
        if (ref.grantsResistance) {
          for (const row of refRows) {
            const damageId = row.damage.id;
            if (!damageId || grantedIds.has(damageId)) continue;
            grantedIds.add(damageId);
            grantedResistances.push(row.damage);
          }
        }
      }
    }

    if (rows.length) {
      return {
        ...trait,
        description: replaceDamageChoiceTokens(trait.description ?? [], rows),
        summary: replaceDamageChoiceTokens(trait.summary ?? [], rows),
        damageChoice: rows
      };
    }

    const items = resolveCatalogSheetItems(trait, stored);
    if (!items.length) return trait;
    const labels = items.map(item => item.label);

    return {
      ...trait,
      description: replaceNameToken(trait.description ?? [], labels),
      summary: replaceNameToken(trait.summary ?? [], labels),
      catalogChoice: items.map(item => ({ label: item.label }))
    };
  });

  return { traits: nextTraits, grantedResistances };
}

export function hydrateCatalogChoiceLanguages(
  traits: TraitApi[],
  traitChoices: TraitChoices | null | undefined,
  languagesById: ReadonlyMap<string, LanguageApi>
): TraitApi[] {
  const stored = cloneChoices(traitChoices);

  return traits.map(trait => {
    if (!trait.catalogChoices?.some(choice => choice.language)) return trait;

    const items = resolveCatalogSheetItems(trait, stored);
    if (!items.length) return trait;

    const catalogChoice: ResolvedCatalogChoice[] = items.map(item => {
      if (item.languageId === undefined) return { label: item.label };
      const language = item.languageId ? languagesById.get(item.languageId) ?? null : null;
      return { label: item.label, language };
    });

    return { ...trait, catalogChoice };
  });
}

export function catalogSpeakIds(
  traits: CatalogTrait[],
  stored?: TraitChoices | null
): string[] {
  const choices = cloneChoices(stored);
  const ids: string[] = [];
  const seen = new Set<string>();

  for (const trait of traits) {
    if (!trait.id || !trait.catalogChoices?.length) continue;

    for (const choice of trait.catalogChoices) {
      if (!choice.language) continue;
      for (const value of choices[trait.id]?.[choice.key] ?? []) {
        const languageId = toEntry(value).languageId;
        if (!languageId || seen.has(languageId)) continue;
        seen.add(languageId);
        ids.push(languageId);
      }
    }
  }

  return ids;
}

export function mergeTraitLanguageIds(
  character: { speaks?: string[]; understands?: string[] },
  traits: Array<{ languages?: Pick<TraitLanguagesApi, "speaks" | "understands"> }>,
  extraSpeakIds: string[] = []
): { speaks: string[]; understands: string[] } {
  const speaks = [...(character.speaks ?? [])];
  const understands = [...(character.understands ?? [])];
  const speakIds = new Set(speaks);
  const understandIds = new Set(understands);

  for (const languageId of extraSpeakIds) {
    if (!languageId || speakIds.has(languageId)) continue;
    speakIds.add(languageId);
    speaks.push(languageId);
  }

  for (const trait of traits) {
    for (const language of trait.languages?.speaks ?? []) {
      if (!language.id || speakIds.has(language.id)) continue;
      speakIds.add(language.id);
      speaks.push(language.id);
    }
    for (const language of trait.languages?.understands ?? []) {
      if (!language.id || understandIds.has(language.id)) continue;
      understandIds.add(language.id);
      understands.push(language.id);
    }
  }

  return { speaks, understands };
}

function cloneChoices(existing?: TraitChoices | null): TraitChoices {
  const traitChoices: TraitChoices = {};
  if (!existing || typeof existing !== "object") return traitChoices;

  for (const [traitId, choices] of Object.entries(existing)) {
    if (!choices || typeof choices !== "object") continue;
    const next: Record<string, TraitChoiceValue[]> = {};
    for (const [key, ids] of Object.entries(choices)) {
      if (!Array.isArray(ids)) continue;
      const clean = ids.flatMap(item => {
        const value = cloneChoiceValue(item);
        return value ? [value] : [];
      });
      if (clean.length) next[key] = clean;
    }
    if (Object.keys(next).length) traitChoices[traitId] = next;
  }

  return traitChoices;
}

function cloneChoiceValue(value: unknown): TraitChoiceValue | null {
  if (typeof value === "string") return value.length > 0 ? value : null;
  const entry = readEntry(value);
  if (!entry) return null;
  return persistEntry(entry);
}

function readEntry(value: unknown): CatalogChoiceEntry | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const row = value as Record<string, unknown>;
  if (typeof row.name !== "string" || row.name.length === 0) return null;

  const entry: CatalogChoiceEntry = { name: row.name };
  if (row.inputs !== undefined) {
    if (!Array.isArray(row.inputs) || row.inputs.some(item => typeof item !== "string")) return null;
    entry.inputs = [...row.inputs];
  }
  if ("languageId" in row) {
    if (row.languageId === null) entry.languageId = null;
    else if (typeof row.languageId === "string" && row.languageId.length > 0) entry.languageId = row.languageId;
    else return null;
  }
  return entry;
}

function persistEntry(entry: CatalogChoiceEntry): TraitChoiceValue {
  const inputs = entry.inputs?.length ? [...entry.inputs] : undefined;
  const hasLanguage = entry.languageId !== undefined;
  if (!inputs && !hasLanguage) return entry.name;

  const stored: CatalogChoiceEntry = { name: entry.name };
  if (inputs) stored.inputs = inputs;
  if (hasLanguage) stored.languageId = entry.languageId ?? null;
  return stored;
}

function toEntry(value: TraitChoiceValue): CatalogChoiceEntry {
  if (typeof value === "string") return { name: value };
  return {
    name: value.name,
    ...(value.inputs?.length ? { inputs: [...value.inputs] } : {}),
    ...(value.languageId !== undefined ? { languageId: value.languageId } : {})
  };
}

function entryName(value: TraitChoiceValue): string {
  return typeof value === "string" ? value : value.name;
}

function readSelection(
  incoming: TraitChoices | null | undefined,
  traitId: string,
  key: string
): { ids?: string[] } | { error: string } {
  const choices = incoming?.[traitId];
  if (!choices || !(key in choices)) return {};

  const sent = choices[key];
  if (!Array.isArray(sent)) {
    return { error: `La elección ${key} del rasgo ${traitId} no es válida` };
  }

  const ids = sent.filter((id): id is string => typeof id === "string" && id.length > 0);
  if (ids.length !== sent.length) {
    return { error: `La elección ${key} del rasgo ${traitId} no es válida` };
  }

  return { ids };
}

function readCatalogSelection(
  incoming: TraitChoices | null | undefined,
  traitId: string,
  key: string
): { entries?: CatalogChoiceEntry[] } | { error: string } {
  const choices = incoming?.[traitId];
  if (!choices || !(key in choices)) return {};

  const sent = choices[key];
  if (!Array.isArray(sent)) {
    return { error: `La elección ${key} del rasgo ${traitId} no es válida` };
  }

  const entries: CatalogChoiceEntry[] = [];
  for (const item of sent) {
    if (typeof item === "string") {
      if (!item) return { error: `La elección ${key} del rasgo ${traitId} no es válida` };
      entries.push({ name: item });
      continue;
    }

    const parsed = readEntry(item);
    if (!parsed) return { error: `La elección ${key} del rasgo ${traitId} no es válida` };

    if (parsed.inputs) {
      const texts: string[] = [];
      for (const text of parsed.inputs) {
        const trimmed = text.trim();
        if (trimmed.length < 1 || trimmed.length > INPUT_MAX) {
          return {
            error: `Cada texto de la elección ${key} del rasgo ${traitId} debe tener entre 1 y 80 caracteres`
          };
        }
        texts.push(trimmed);
      }
      parsed.inputs = texts;
    }

    entries.push(parsed);
  }

  return { entries };
}

function validateSelection(
  traitId: string,
  choice: { key: string; choose: number; options: { name: string }[] },
  sent: string[]
): string | null {
  if (sent.length !== choice.choose) {
    return `La elección ${choice.key} del rasgo ${traitId} debe incluir ${choice.choose} opciones`;
  }

  if (new Set(sent).size !== sent.length) {
    return `La elección ${choice.key} del rasgo ${traitId} contiene opciones repetidas`;
  }

  const allowed = new Set(choice.options.map(option => option.name));
  for (const name of sent) {
    if (!allowed.has(name)) {
      return `La fila ${name} no pertenece a la elección ${choice.key} del rasgo ${traitId}`;
    }
  }

  return null;
}

function catalogRequired(choice: TraitCatalogChoice, classLevel: number): number {
  return choice.grants.reduce(
    (sum, grant) => (grant.atLevel <= classLevel ? sum + grant.choose : sum),
    0
  );
}

function validateCatalogGrowth(
  traitId: string,
  choice: TraitCatalogChoice,
  stored: TraitChoiceValue[],
  required: number,
  sent: CatalogChoiceEntry[],
  allowedLanguageIds: ReadonlySet<string>
): string | null {
  const add = required - stored.length;
  if (sent.length !== required || !sameSequence(stored, sent.slice(0, stored.length))) {
    return `La elección ${choice.key} del rasgo ${traitId} debe conservar las opciones ya elegidas y añadir ${add}`;
  }

  const repeated = repeatedOption(choice, sent);
  if (repeated) {
    return `La opción ${repeated} está repetida en la elección ${choice.key} del rasgo ${traitId}`;
  }

  const repeatedText = repeatedInput(sent);
  if (repeatedText) {
    return `El texto ${repeatedText} está repetido en la elección ${choice.key} del rasgo ${traitId}`;
  }

  const byName = new Map(choice.options.map(option => [option.name, option]));
  for (const entry of sent.slice(stored.length)) {
    const option = byName.get(entry.name);
    if (!option) {
      return `La opción ${entry.name} no pertenece a la elección ${choice.key} del rasgo ${traitId}`;
    }

    const textError = validateInputs(traitId, choice.key, option, entry);
    if (textError) return textError;

    const languageError = validateLanguage(traitId, choice, entry, allowedLanguageIds);
    if (languageError) return languageError;
  }

  return null;
}

function validateInputs(
  traitId: string,
  key: string,
  option: TraitCatalogOption,
  entry: CatalogChoiceEntry
): string | null {
  const expected = option.inputs ?? 0;
  const actual = entry.inputs?.length ?? 0;
  if (expected === actual) return null;
  if (expected === 0) {
    return `La opción ${option.name} de la elección ${key} del rasgo ${traitId} no admite textos`;
  }
  return `La opción ${option.name} de la elección ${key} del rasgo ${traitId} exige ${expected} textos`;
}

function validateLanguage(
  traitId: string,
  choice: TraitCatalogChoice,
  entry: CatalogChoiceEntry,
  allowedLanguageIds: ReadonlySet<string>
): string | null {
  if (!choice.language) {
    if (entry.languageId !== undefined) {
      return `La elección ${choice.key} del rasgo ${traitId} no admite idioma`;
    }
    return null;
  }

  if (entry.languageId === undefined || (choice.language === "required" && entry.languageId === null)) {
    return `La elección ${choice.key} del rasgo ${traitId} exige un idioma`;
  }

  if (entry.languageId && !allowedLanguageIds.has(entry.languageId)) {
    return `El idioma ${entry.languageId} no está entre los idiomas del personaje`;
  }

  return null;
}

function repeatedOption(choice: TraitCatalogChoice, entries: CatalogChoiceEntry[]): string | null {
  const options = new Map(choice.options.map(option => [option.name, option]));
  const counts = new Map<string, number>();

  for (const entry of entries) {
    const option = options.get(entry.name);
    if (!option || option.repeatable) continue;
    const count = (counts.get(entry.name) ?? 0) + 1;
    if (count > 1) return entry.name;
    counts.set(entry.name, count);
  }

  return null;
}

function repeatedInput(entries: CatalogChoiceEntry[]): string | null {
  const seen = new Map<string, string>();
  for (const entry of entries) {
    const local = new Set<string>();
    for (const text of entry.inputs ?? []) {
      const folded = foldName(text);
      if (local.has(folded) || seen.has(folded)) return text;
      local.add(folded);
      seen.set(folded, text);
    }
  }
  return null;
}

function presentChosen(choice: TraitCatalogChoice, stored: TraitChoiceValue[]): TraitChoiceValue[] {
  const complex = Boolean(choice.language) || choice.options.some(option => typeof option.inputs === "number");
  if (!complex) return stored.map(entryName);

  return stored.map(value => {
    const entry = toEntry(value);
    const object: CatalogChoiceEntry = { name: entry.name };
    if (entry.inputs?.length) object.inputs = [...entry.inputs];
    if (choice.language) object.languageId = entry.languageId ?? null;
    return object;
  });
}

function sameSequence(left: TraitChoiceValue[], right: CatalogChoiceEntry[]): boolean {
  return left.length === right.length && left.every((item, index) => sameEntry(item, right[index]));
}

function sameEntry(left: TraitChoiceValue, right: CatalogChoiceEntry): boolean {
  const stored = toEntry(left);
  if (stored.name !== right.name) return false;
  const storedInputs = stored.inputs ?? [];
  const sentInputs = right.inputs ?? [];
  if (storedInputs.length !== sentInputs.length) return false;
  if (storedInputs.some((text, index) => text !== sentInputs[index])) return false;
  return stored.languageId === right.languageId;
}

function sameChoiceValues(stored: TraitChoiceValue[], sent: unknown[]): boolean {
  if (stored.length !== sent.length) return false;
  const storedAllStrings = stored.every(item => typeof item === "string");
  if (storedAllStrings && sent.some(item => typeof item !== "string")) return false;

  const parsed: TraitChoiceValue[] = [];
  for (const item of sent) {
    const value = cloneChoiceValue(item);
    if (!value) return false;
    parsed.push(value);
  }

  const left = stored.map(canonical).sort();
  const right = parsed.map(canonical).sort();
  return left.every((item, index) => item === right[index]);
}

function canonical(value: TraitChoiceValue): string {
  const entry = toEntry(value);
  return JSON.stringify({
    name: entry.name,
    inputs: entry.inputs ?? [],
    languageId: entry.languageId === undefined ? null : entry.languageId,
    hasLanguage: entry.languageId !== undefined
  });
}

function resolveCatalogSheetItems(
  trait: TraitApi,
  stored: TraitChoices
): { label: string; languageId?: string | null }[] {
  if (!trait.catalogChoices?.length) return [];
  const items: { label: string; languageId?: string | null }[] = [];

  for (const choice of trait.catalogChoices) {
    const selected = stored[trait.id]?.[choice.key];
    if (!selected?.length) continue;
    const byName = new Map(choice.options.map(option => [option.name, option]));

    for (const value of selected) {
      const entry = toEntry(value);
      const option = byName.get(entry.name);
      if (!option) continue;
      const item: { label: string; languageId?: string | null } = {
        label: optionLabel(option, entry.inputs)
      };
      if (choice.language) item.languageId = entry.languageId ?? null;
      items.push(item);
    }
  }

  return items;
}

function optionLabel(option: TraitCatalogOption, inputs?: string[]): string {
  if (!option.label || !inputs?.length) return option.name;
  return inputs.reduce(
    (text, value, index) => text.replaceAll(`{${index}}`, value),
    option.label
  );
}

function replaceNameToken(texts: string[], names: string[]): string[] {
  const name = names.join(", ");
  return texts.map(text => text.replaceAll("{name}", name));
}

function sameIds(left: TraitChoiceValue[], right: string[]): boolean {
  const leftNames = stringNames(left);
  if (leftNames.length !== left.length || leftNames.length !== right.length) return false;
  const sortedLeft = [...leftNames].sort();
  const sortedRight = [...right].sort();
  return sortedLeft.every((id, index) => id === sortedRight[index]);
}

function stringNames(values: TraitChoiceValue[] | undefined): string[] {
  return (values ?? []).filter((item): item is string => typeof item === "string" && item.length > 0);
}

function resolveRows(choice: TraitDamageChoiceApi, selectedNames: string[]): ResolvedDamageChoice[] {
  const byName = new Map(choice.options.map(option => [option.name, option]));
  const rows: ResolvedDamageChoice[] = [];

  for (const name of selectedNames) {
    const option = byName.get(name);
    if (!option?.damage) continue;
    rows.push({
      name: option.name,
      damage: option.damage
    });
  }

  return rows;
}

function replaceDamageChoiceTokens(texts: string[], rows: ResolvedDamageChoice[]): string[] {
  const name = rows.map(row => row.name).join(", ");
  const damage = rows.map(row => row.damage.name).join(", ");
  return texts.map(text => text.replaceAll("{name}", name).replaceAll("{damage}", damage));
}

function foldName(name: string): string {
  return name.trim().toLocaleLowerCase("es");
}
