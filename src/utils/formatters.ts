import { AbilityBonusesApi, AbilityBonusesMongo, ChoiceApi, ChoiceMongo, OptionSelectApi } from "../domain/types"

const caracteristicas: {[key: string]: string} = {
  str: 'Fuerza',
  dex: 'Destreza',
  con: 'Constitucion ',
  int: 'Inteligencia',
  wis: 'Sabiduria',
  cha: 'Carisma'
}

export const mapStringArrayToLabelValue = (arr?: string[]): OptionSelectApi[] => {
  return arr?.map(opt => ({ label: opt, value: opt })) ?? [];
}

export const ordenarPorNombre = <T extends { name: string }>(items: T[]): T[] => {
  return [...items].sort((a, b) => 
    a?.name?.localeCompare(b?.name, 'es', { sensitivity: 'base' })
  );
}

export const formatearAbilityBonusChoices = (ability_bonus_choices: ChoiceMongo): ChoiceApi<AbilityBonusesApi> | undefined => {
  if (!ability_bonus_choices) return undefined;

  if (Array.isArray(ability_bonus_choices.options)) {
    const options = ability_bonus_choices.options.map(option => {
      return {
        index: option,
        name: caracteristicas[option] ?? option,
        bonus: 1
      }
    })
    
    return {
      ...ability_bonus_choices,
      options
    };
  }

  return undefined
}

export const formatearAbilityBonuses = (ability_bonuses: AbilityBonusesMongo[]): AbilityBonusesApi[] => {
  const abilityBonuses = ability_bonuses?.map(ability => {
    return {
      index: ability?.index,
      name: caracteristicas[ability?.index] ?? ability.index,
      bonus: ability?.bonus
    }
  })

  return abilityBonuses
}

export const formatearSalvacion = (ability_bonuses: string[]) => {
  const abilityBonuses = ability_bonuses?.map(ability => {
    return {
      index: ability,
      name: caracteristicas[ability] ?? ability
    }
  })

  return abilityBonuses
}

export function expandArray<T>(arr: T[], n: number): T[] {
  return Array.from({ length: n }, (_, i) => arr[i % arr.length]);
}

export const deepMerge = (obj1: any, obj2: any) => {
  const output = { ...obj1 };
  
  for (const key in obj2) {
    if (obj2[key] instanceof Object && key in obj1) {
      output[key] = deepMerge(obj1[key], obj2[key]);
    } else {
      output[key] = obj2[key];
    }
  }
  return output;
};