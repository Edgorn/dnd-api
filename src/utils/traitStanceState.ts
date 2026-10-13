import { CharacterTraitResource, CharacterRestType } from "../domain/types/personajes.types";
import { SpellPrivilegeRecharge, TraitAction } from "../domain/types/traits.types";
import { resolveActionUses } from "./traitProgression";

export interface TraitStanceState {
  traitResources: CharacterTraitResource[];
  activeTraitIds: string[];
}

export type TraitStanceResult =
  | ({ ok: true } & TraitStanceState)
  | { ok: false; message: string };

export interface UseTraitActionInput {
  ownsTrait: boolean;
  trait?: {
    id: string;
    action?: TraitAction;
    suppressedByArmorTypeIds?: string[];
  };
  requestedTraitId?: string;
  classLevel?: number;
  spent: number;
  traitResources: CharacterTraitResource[];
  activeTraitIds: string[];
  armorSuppressed: boolean;
}

export interface DeactivateTraitInput {
  traitId: string;
  aliases?: string[];
  traitResources: CharacterTraitResource[];
  activeTraitIds: string[];
}

export interface CharacterRestInput {
  restType: CharacterRestType;
  traits: Array<{ id: string; action?: { recharge?: SpellPrivilegeRecharge | null } }>;
  traitResources: CharacterTraitResource[];
}

export function spentForTrait(resources: CharacterTraitResource[], ids: string[]): number {
  const keys = ids.filter(Boolean);
  for (const id of keys) {
    const found = resources.find(item => item.traitId === id);
    if (found) return found.spent;
  }
  return 0;
}

export function upsertTraitSpent(
  resources: CharacterTraitResource[],
  traitId: string,
  spent: number,
  aliases: string[] = []
): CharacterTraitResource[] {
  const drop = new Set([traitId, ...aliases].filter(Boolean));
  const next = resources.filter(item => !drop.has(item.traitId));
  if (spent <= 0) return next;
  next.push({ traitId, spent });
  return next;
}

export function rechargeMatchesRest(
  recharge: SpellPrivilegeRecharge | null | undefined,
  restType: CharacterRestType
): boolean {
  if (!recharge) return false;
  if (recharge === "shortOrLongRest") return true;
  if (restType === "shortRest") return recharge === "shortRest";
  return recharge === "longRest";
}

export function applyUseTraitAction(input: UseTraitActionInput): TraitStanceResult {
  if (!input.trait) {
    return { ok: false, message: "Rasgo no encontrado" };
  }
  if (!input.ownsTrait) {
    return { ok: false, message: "El personaje no posee este rasgo" };
  }
  if (!input.trait.action) {
    return { ok: false, message: "El rasgo no tiene una acción usable" };
  }
  if (input.armorSuppressed) {
    return { ok: false, message: "Este rasgo está suprimido por la armadura equipada" };
  }

  const traitId = input.trait.id;
  const aliases = [input.requestedTraitId, traitId].filter((id): id is string => Boolean(id));
  const kind = input.trait.action.kind ?? "instant";
  if (kind === "stance" && input.activeTraitIds.some(id => aliases.includes(id))) {
    return { ok: false, message: "Este rasgo ya está activo" };
  }

  const uses = resolveActionUses(input.trait.action, input.classLevel);
  if (uses !== "unlimited") {
    if (uses === undefined) {
      return { ok: false, message: "El rasgo no tiene usos" };
    }
    if (input.spent >= uses) {
      return { ok: false, message: "No quedan usos de este rasgo" };
    }
  }

  const nextSpent = uses === "unlimited" ? input.spent : input.spent + 1;
  const traitResources = upsertTraitSpent(input.traitResources, traitId, nextSpent, aliases);
  const activeTraitIds =
    kind === "stance"
      ? [...input.activeTraitIds.filter(id => !aliases.includes(id)), traitId]
      : input.activeTraitIds;

  return { ok: true, traitResources, activeTraitIds };
}

export function applyDeactivateTrait(input: DeactivateTraitInput): TraitStanceResult {
  const aliases = [input.traitId, ...(input.aliases ?? [])].filter(Boolean);
  if (!input.activeTraitIds.some(id => aliases.includes(id))) {
    return { ok: false, message: "Este rasgo no está activo" };
  }

  return {
    ok: true,
    traitResources: input.traitResources,
    activeTraitIds: input.activeTraitIds.filter(id => !aliases.includes(id))
  };
}

export function applyCharacterRest(input: CharacterRestInput): TraitStanceState {
  const rechargeById = new Map(
    input.traits.map(trait => [trait.id, trait.action?.recharge])
  );

  const traitResources = input.traitResources
    .map(item => {
      if (rechargeMatchesRest(rechargeById.get(item.traitId), input.restType)) {
        return { ...item, spent: 0 };
      }
      return item;
    })
    .filter(item => item.spent > 0);

  return {
    traitResources,
    activeTraitIds: []
  };
}
