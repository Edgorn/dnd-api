import {
  CharacterApi,
  CharacterCombatApi,
  CharacterCombatSpell,
  CharacterSheetApi,
  CharacterSheetSpellGroup
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

export function toSheetCharacter(sheet: CharacterApi): CharacterSheetApi {
  const spellsById: Record<string, SpellRef> = {};
  const collect = (spells: Array<Pick<SpellApi, "id" | "name" | "level" | "school" | "ritual" | "components">> | undefined) => {
    for (const spell of spells ?? []) {
      const ref = toSpellRef(spell);
      if (ref && !spellsById[ref.id]) spellsById[ref.id] = ref;
    }
  };

  const spells: Record<string, CharacterSheetSpellGroup> = {};
  for (const [group, payload] of Object.entries(sheet.spells ?? {})) {
    collect(payload.list);
    collect(payload.extra);
    collect(payload.prepared);
    spells[group] = {
      list: spellIds(payload.list),
      ...(payload.extra?.length ? { extra: spellIds(payload.extra) } : {}),
      ...(payload.prepared ? { prepared: spellIds(payload.prepared) } : {}),
      ...(payload.type ? { type: payload.type } : {}),
      ...(payload.ritualOnlyExtraIds?.length ? { ritualOnlyExtraIds: payload.ritualOnlyExtraIds } : {})
    };
  }

  for (const privilege of sheet.spellPrivileges ?? []) {
    for (const selection of privilege.selections ?? []) {
      collect(selection);
    }
  }

  const { spells: _fullSpells, traits, ...rest } = sheet;
  return {
    ...rest,
    traits: traits.map(toSheetTrait),
    spells,
    spellsById
  };
}
