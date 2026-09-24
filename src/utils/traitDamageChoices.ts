import { Damage } from "../domain/types";
import {
  PendingCatalogChoice,
  ResolvedDamageChoice,
  TraitApi,
  TraitCatalogChoice,
  TraitChoices,
  TraitDamageChoiceApi,
  TraitLanguagesApi
} from "../domain/types/traits.types";

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
      if (!sameIds(stored, ids.filter((id): id is string => typeof id === "string"))) {
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

      const chosenNames = new Set(chosen);
      pending.push({
        traitId: trait.id,
        key: choice.key,
        add,
        options: choice.options.filter(option => !chosenNames.has(option.name)),
        chosen: [...chosen]
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
}): { traitChoices: TraitChoices } | { error: string } {
  const traitChoices = cloneChoices(input.existing);

  for (const trait of input.grantedTraits) {
    if (!trait.id || !trait.catalogChoices?.length) continue;

    for (const choice of trait.catalogChoices) {
      const stored = traitChoices[trait.id]?.[choice.key] ?? [];
      const required = catalogRequired(choice, input.classLevel);
      const sent = readSelection(input.incoming, trait.id, choice.key);
      if ("error" in sent) return sent;

      if (stored.length >= required) {
        if (sent.ids && !sameSequence(stored, sent.ids)) {
          return { error: `La elección ${choice.key} del rasgo ${trait.id} ya está guardada` };
        }
        continue;
      }

      if (!sent.ids) {
        return {
          error: `Debe elegir las opciones de catálogo (${choice.key}) del rasgo ${trait.id}`
        };
      }

      const invalid = validateCatalogGrowth(trait.id, choice, stored, required, sent.ids);
      if (invalid) return { error: invalid };

      if (!traitChoices[trait.id]) traitChoices[trait.id] = {};
      traitChoices[trait.id][choice.key] = [...sent.ids];
    }
  }

  return { traitChoices };
}

export function resolveCharacterTraitChoices(
  traits: TraitApi[],
  traitChoices?: TraitChoices | null
): { traits: TraitApi[]; grantedResistances: Damage[] } {
  const stored = traitChoices ?? {};
  const byId = new Map(traits.map(trait => [trait.id, trait]));
  const ownRows = new Map<string, ResolvedDamageChoice[]>();

  for (const trait of traits) {
    if (!trait.damageChoices?.length) continue;
    const rows: ResolvedDamageChoice[] = [];
    for (const choice of trait.damageChoices) {
      const selected = stored[trait.id]?.[choice.key];
      if (!selected?.length) continue;
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
      const selected = stored[ref.traitId]?.[ref.choiceKey]
        ?? (source ? stored[source.id]?.[ref.choiceKey] : undefined);
      const refRows = sourceChoice && selected?.length
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

    const catalogNames = resolveCatalogNames(trait, stored);
    if (!catalogNames.length) return trait;

    return {
      ...trait,
      description: replaceNameToken(trait.description ?? [], catalogNames),
      summary: replaceNameToken(trait.summary ?? [], catalogNames),
      catalogChoice: catalogNames
    };
  });

  return { traits: nextTraits, grantedResistances };
}

export function mergeTraitLanguageIds(
  character: { speaks?: string[]; understands?: string[] },
  traits: Array<{ languages?: Pick<TraitLanguagesApi, "speaks" | "understands"> }>
): { speaks: string[]; understands: string[] } {
  const speaks = [...(character.speaks ?? [])];
  const understands = [...(character.understands ?? [])];
  const speakIds = new Set(speaks);
  const understandIds = new Set(understands);

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
    const next: Record<string, string[]> = {};
    for (const [key, ids] of Object.entries(choices)) {
      if (!Array.isArray(ids)) continue;
      const clean = ids.filter((id): id is string => typeof id === "string");
      if (clean.length) next[key] = [...clean];
    }
    traitChoices[traitId] = next;
  }

  return traitChoices;
}

function readSelection(
  incoming: TraitChoices | null | undefined,
  traitId: string,
  key: string
): { ids?: string[] } | { error: string } {
  const choices = incoming?.[traitId];
  if (!choices || !(key in choices)) return {};

  const sent = choices[key];
  if (!Array.isArray(sent) || sent.some(id => typeof id !== "string" || !id)) {
    return { error: `La elección ${key} del rasgo ${traitId} no es válida` };
  }

  return { ids: sent };
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
  stored: string[],
  required: number,
  sent: string[]
): string | null {
  const add = required - stored.length;
  if (sent.length !== required || !sameSequence(stored, sent.slice(0, stored.length))) {
    return `La elección ${choice.key} del rasgo ${traitId} debe conservar las opciones ya elegidas y añadir ${add}`;
  }

  const added = sent.slice(stored.length);
  if (new Set(sent).size !== sent.length) {
    return `La elección ${choice.key} del rasgo ${traitId} contiene opciones repetidas`;
  }

  const allowed = new Set(choice.options.map(option => option.name));
  for (const name of added) {
    if (!allowed.has(name)) {
      return `La opción ${name} no pertenece a la elección ${choice.key} del rasgo ${traitId}`;
    }
  }

  return null;
}

function sameSequence(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((item, index) => item === right[index]);
}

function resolveCatalogNames(trait: TraitApi, stored: TraitChoices): string[] {
  if (!trait.catalogChoices?.length) return [];
  const names: string[] = [];

  for (const choice of trait.catalogChoices) {
    const selected = stored[trait.id]?.[choice.key];
    if (!selected?.length) continue;
    const allowed = new Set(choice.options.map(option => option.name));
    for (const name of selected) {
      if (allowed.has(name)) names.push(name);
    }
  }

  return names;
}

function replaceNameToken(texts: string[], names: string[]): string[] {
  const name = names.join(", ");
  return texts.map(text => text.replaceAll("{name}", name));
}

function sameIds(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  const sortedLeft = [...left].sort();
  const sortedRight = [...right].sort();
  return sortedLeft.every((id, index) => id === sortedRight[index]);
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
