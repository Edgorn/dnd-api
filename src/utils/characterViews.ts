import {
  CharacterApi,
  CharacterCombatApi,
  CharacterCombatSpell,
  CharacterSheetApi,
  CharacterSheetSpellGroup,
  CharacterSpellPrivilegeApi,
  CharacterSpellStateResponse,
  CharacterStatePatch
} from "../domain/types/character.types";
import { TraitApi } from "../domain/types/traits.types";
import { SpellApi, SpellRef } from "../domain/types/spell.types";
import { CreatureApi } from "../domain/types/creature.types";
import { CreatureFormSummary } from "../domain/types/creatureForm.types";

export function isCreatureApi(
  creature: CreatureApi | CreatureFormSummary | undefined
): creature is CreatureApi {
  return Boolean(creature && "CA" in creature && "HPMax" in creature);
}

export function toSpellRef(
  spell: Pick<SpellApi, "id" | "name" | "level" | "school" | "ritual" | "components">
): SpellRef | null {
  if (!spell.id) return null;
  return {
    id: spell.id,
    name: spell.name,
    level: spell.level,
    ...(spell.school ? { school: spell.school } : {}),
    ...(spell.ritual !== undefined ? { ritual: spell.ritual } : {}),
    ...(spell.components ? { components: spell.components } : {})
  };
}

export function toCombatSpell(
  spell: Pick<SpellApi, "id" | "name" | "level">
): CharacterCombatSpell | null {
  if (!spell.id) return null;
  return { id: spell.id, name: spell.name, level: spell.level };
}

export function toSheetTrait(trait: TraitApi): Omit<TraitApi, "incompatible_traits"> {
  const { incompatible_traits: _incompatible, ...rest } = trait;
  return rest;
}

function combatSpellsFromGroup(
  group: CharacterApi["spells"][string] | undefined
): CharacterCombatApi["spells"][string] | undefined {
  if (!group) return undefined;
  const list = group.list.map(toCombatSpell).filter((item): item is CharacterCombatSpell => Boolean(item));
  const extra = group.extra?.map(toCombatSpell).filter((item): item is CharacterCombatSpell => Boolean(item));
  const prepared = group.prepared?.map(toCombatSpell).filter((item): item is CharacterCombatSpell => Boolean(item));
  return {
    list,
    ...(extra?.length ? { extra } : {}),
    ...(prepared ? { prepared } : {})
  };
}

export function toCombatCharacter(sheet: CharacterApi): CharacterCombatApi {
  const spells: CharacterCombatApi["spells"] = {};
  for (const [group, payload] of Object.entries(sheet.spells ?? {})) {
    const projected = combatSpellsFromGroup(payload);
    if (projected) spells[group] = projected;
  }

  return {
    id: sheet.id,
    name: sheet.name,
    race: sheet.race,
    size: sheet.size,
    classes: sheet.classes,
    ...(sheet.background?.alignment ? { alignment: sheet.background.alignment } : {}),
    ac: sheet.ac,
    hpMax: sheet.hpMax,
    hpCurrent: sheet.hpCurrent,
    speed: sheet.speed,
    initiativeBonus: sheet.initiativeBonus,
    attributes: sheet.attributes.map(attribute => ({
      key: attribute.key,
      value: attribute.value,
      ...(attribute.modifier !== undefined ? { modifier: attribute.modifier } : {})
    })),
    savingThrows: sheet.savingThrows,
    skills: sheet.skills.map(skill => ({
      name: skill.name,
      key: skill.key,
      value: skill.value,
      modifier: skill.modifier,
      ...(skill.passive !== undefined ? { passive: skill.passive } : {}),
      ...(skill.disadvantage ? { disadvantage: true } : {})
    })),
    languages: sheet.languages,
    resistances: sheet.resistances,
    conditionalResistances: sheet.conditionalResistances,
    conditionImmunities: sheet.conditionImmunities,
    conditionalConditionImmunities: sheet.conditionalConditionImmunities,
    traits: sheet.traits.map(trait => ({
      ...(trait.id ? { id: trait.id } : {}),
      name: trait.name,
      ...(trait.hidden ? { hidden: true } : {}),
      description: trait.description,
      ...(trait.summary
        ? { summary: Array.isArray(trait.summary) ? trait.summary.join("\n") : trait.summary }
        : {})
    })),
    traitsData: sheet.traitsData,
    ...(sheet.spellcasting ? { spellcasting: sheet.spellcasting } : {}),
    spells,
    activeTraitIds: sheet.activeTraitIds
  };
}

function spellIds(spells: Array<{ id?: string }> | undefined): string[] {
  return (spells ?? []).map(spell => spell.id).filter((id): id is string => Boolean(id));
}

export function toSheetSpellState(
  spells: CharacterApi["spells"],
  spellPrivileges?: CharacterSpellPrivilegeApi[]
): Pick<CharacterSpellStateResponse, "spells" | "spellsById"> {
  const spellsById: Record<string, SpellRef> = {};
  const collect = (items: Array<Pick<SpellApi, "id" | "name" | "level" | "school" | "ritual" | "components">> | undefined) => {
    for (const spell of items ?? []) {
      const ref = toSpellRef(spell);
      if (ref && !spellsById[ref.id]) spellsById[ref.id] = ref;
    }
  };

  const sheetSpells: Record<string, CharacterSheetSpellGroup> = {};
  for (const [group, payload] of Object.entries(spells ?? {})) {
    collect(payload.list);
    collect(payload.extra);
    collect(payload.prepared);
    sheetSpells[group] = {
      list: spellIds(payload.list),
      ...(payload.extra?.length ? { extra: spellIds(payload.extra) } : {}),
      ...(payload.prepared ? { prepared: spellIds(payload.prepared) } : {}),
      ...(payload.type ? { type: payload.type } : {}),
      ...(payload.ritualOnlyExtraIds?.length ? { ritualOnlyExtraIds: payload.ritualOnlyExtraIds } : {})
    };
  }

  for (const privilege of spellPrivileges ?? []) {
    for (const selection of privilege.selections ?? []) {
      collect(selection);
    }
  }

  return { spells: sheetSpells, spellsById };
}

export function toSheetCharacter(sheet: CharacterApi): CharacterSheetApi {
  const { spells, spellsById } = toSheetSpellState(sheet.spells, sheet.spellPrivileges);
  const { spells: _fullSpells, traits, ...rest } = sheet;
  return {
    ...rest,
    traits: traits.map(toSheetTrait),
    spells,
    spellsById
  };
}

export type CharacterStatePatchKey = Exclude<keyof CharacterStatePatch, "basic" | "disadvantageSkillKeys">;

export const CHARACTER_FORM_OVERLAY_PATCH_KEYS: CharacterStatePatchKey[] = [
  "activeFormId",
  "ac",
  "hpMax",
  "hpCurrent",
  "attributes",
  "speed",
  "size",
  "initiativeBonus",
  "resistances",
  "conditionImmunities"
];

export function toCharacterStatePatch(
  sheet: CharacterApi,
  keys: readonly CharacterStatePatchKey[]
): CharacterStatePatch {
  const wanted = new Set(keys);
  const patch: CharacterStatePatch = {};
  if (wanted.has("hpCurrent")) patch.hpCurrent = sheet.hpCurrent;
  if (wanted.has("hpMax")) patch.hpMax = sheet.hpMax;
  if (wanted.has("hitDice")) patch.hitDice = sheet.hitDice;
  if (wanted.has("spellSlots")) patch.spellSlots = sheet.spellSlots;
  if (wanted.has("traitResources")) patch.traitResources = sheet.traitResources;
  if (wanted.has("activeTraitIds")) patch.activeTraitIds = sheet.activeTraitIds;
  if (wanted.has("ac")) patch.ac = sheet.ac;
  if (wanted.has("speed")) patch.speed = sheet.speed;
  if (wanted.has("size")) patch.size = sheet.size;
  if (wanted.has("attributes")) patch.attributes = sheet.attributes;
  if (wanted.has("initiativeBonus")) patch.initiativeBonus = sheet.initiativeBonus;
  if (wanted.has("resistances")) patch.resistances = sheet.resistances;
  if (wanted.has("conditionImmunities")) patch.conditionImmunities = sheet.conditionImmunities;
  if (wanted.has("activeConditions")) patch.activeConditions = sheet.activeConditions;
  if (wanted.has("traits")) patch.traits = sheet.traits.map(toSheetTrait);
  if (wanted.has("equipment")) patch.equipment = sheet.equipment;
  if (wanted.has("wearingArmorWithoutProficiency")) {
    patch.wearingArmorWithoutProficiency = sheet.wearingArmorWithoutProficiency;
  }
  if (wanted.has("forms")) patch.forms = sheet.forms;
  if (wanted.has("activeFormId")) patch.activeFormId = sheet.activeFormId ?? null;
  return patch;
}
