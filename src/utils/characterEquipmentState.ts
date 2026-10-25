import { CharacterApi, CharacterEquipmentStateResponse } from "../domain/types/character.types";
import { CharacterAttributeApi } from "../domain/types/attribute.types";
import { CharacterEquipmentApi } from "../domain/types/equipment.types";
import { TraitApi } from "../domain/types/traits.types";
import { Damage, Speed } from "../domain/types";
import {
  applyArmorStrengthSpeedPenalty,
  collectEquippedArmorSuppression,
  collectStealthDisadvantageSkillKeys,
  findBodyArmor,
  isWearingArmorWithoutProficiency
} from "./armorRules";
import { applyTraitSpeed } from "./applyTraitSpeed";
import { applyActiveTraitOverlays, ActiveTraitOverlayRules } from "./applyActiveTraitOverlays";
import { normalizeActiveTraitIds } from "./traitResources";

export type CharacterEquipmentStateDelta = Omit<CharacterEquipmentStateResponse, "basic">;

export function collectBaseResistancesAndImmunities(
  traits: TraitApi[],
  grantedResistances: Damage[] = []
): {
  resistances: Damage[];
  conditionImmunities: CharacterApi["conditionImmunities"];
} {
  const resistances: Damage[] = [];
  const conditionImmunities: CharacterApi["conditionImmunities"] = [];

  for (const trait of traits) {
    if (trait.resistances) {
      resistances.push(...trait.resistances);
    }
    if (trait.condition_inmunities?.length) {
      conditionImmunities.push({
        name: trait.name,
        conditions: trait.condition_inmunities ?? []
      });
    }
  }

  for (const damage of grantedResistances) {
    if (damage.id && resistances.some(item => item.id === damage.id)) continue;
    resistances.push(damage);
  }

  return { resistances, conditionImmunities };
}

export function toCharacterEquipmentStateDelta(input: {
  equipment: CharacterEquipmentApi[];
  traits: TraitApi[];
  attributes: CharacterAttributeApi[];
  baseSpeed: Speed | number | undefined | null;
  ac: number;
  grantedResistances?: Damage[];
  activeTraitIds?: string[] | null;
  overlayRules: ActiveTraitOverlayRules;
}): CharacterEquipmentStateDelta {
  const equippedArmor = collectEquippedArmorSuppression(input.equipment);
  const speedWithTraits = applyTraitSpeed(input.baseSpeed, input.traits, equippedArmor);
  const bodyArmor = findBodyArmor(input.equipment);
  const speed = applyArmorStrengthSpeedPenalty(
    speedWithTraits,
    bodyArmor,
    input.attributes,
    input.traits
  );
  const base = collectBaseResistancesAndImmunities(input.traits, input.grantedResistances);
  const activeTraitIds = normalizeActiveTraitIds(input.activeTraitIds);
  const overlaid = applyActiveTraitOverlays(
    {
      traits: input.traits,
      equipment: input.equipment,
      attributes: input.attributes,
      resistances: base.resistances,
      conditionImmunities: base.conditionImmunities,
      activeTraitIds
    } as CharacterApi,
    input.overlayRules
  );

  return {
    equipment: overlaid.equipment ?? input.equipment,
    ac: input.ac,
    speed,
    wearingArmorWithoutProficiency: isWearingArmorWithoutProficiency(input.equipment),
    disadvantageSkillKeys: collectStealthDisadvantageSkillKeys(input.equipment),
    resistances: overlaid.resistances ?? [],
    conditionImmunities: overlaid.conditionImmunities ?? []
  };
}
