import { Speed } from "../domain/types";
import { MovementMode, TraitSpeed } from "../domain/types/traits.types";
import { ArmorRulesTrait, ArmorSuppressionContext, isTraitSuppressedByArmor } from "./armorRules";

const MOVEMENT_MODES: MovementMode[] = ["walk", "fly", "climb", "swim", "burrow"];

export function normalizeTraitSpeed(speed: number | TraitSpeed | undefined | null): TraitSpeed | undefined {
  if (speed === undefined || speed === null) return undefined;
  if (typeof speed === "number") {
    return { set: { walk: speed } };
  }
  return speed;
}

function normalizeBaseSpeed(base: number | Speed | undefined | null): Speed {
  if (typeof base === "number") {
    return { walk: base };
  }

  const extra: Omit<Speed, "walk"> = {};
  if (base) {
    for (const mode of MOVEMENT_MODES) {
      if (mode === "walk") continue;
      const value = base[mode];
      if (typeof value === "number") extra[mode] = value;
    }
  }

  return {
    walk: typeof base?.walk === "number" ? base.walk : 30,
    ...extra
  };
}

function shouldApply(speed: TraitSpeed): boolean {
  return speed.condition === undefined || speed.condition === "always";
}

export function applyTraitSpeed(
  base: number | Speed | undefined | null,
  traits: Array<{ speed?: number | TraitSpeed } & Pick<ArmorRulesTrait, "suppressedByArmorTypeIds">>,
  equippedArmor: ArmorSuppressionContext = { typeIds: [] }
): Speed {
  const result = normalizeBaseSpeed(base);
  const effects = traits
    .filter(trait => !isTraitSuppressedByArmor({ id: "", ...trait }, equippedArmor))
    .map(trait => normalizeTraitSpeed(trait.speed))
    .filter((speed): speed is TraitSpeed => Boolean(speed))
    .filter(shouldApply);

  for (const effect of effects) {
    if (!effect.set) continue;
    for (const mode of MOVEMENT_MODES) {
      const value = effect.set[mode];
      if (typeof value !== "number") continue;
      const current = result[mode];
      result[mode] = current === undefined ? value : Math.max(current, value);
    }
  }

  for (const effect of effects) {
    if (!effect.add) continue;
    for (const mode of MOVEMENT_MODES) {
      const value = effect.add[mode];
      if (typeof value !== "number") continue;
      result[mode] = (result[mode] ?? 0) + value;
    }
  }

  const walk = result.walk;
  for (const effect of effects) {
    for (const mode of effect.equalToWalk ?? []) {
      result[mode] = Math.max(result[mode] ?? 0, walk);
    }
  }

  return result;
}
