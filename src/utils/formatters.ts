import { AbilityBonusesApi, AbilityBonusesMongo } from "../domain/types"

const caracteristicas: {[key: string]: string} = {
  str: 'Fuerza',
  dex: 'Destreza',
  con: 'Constitucion',
  int: 'Inteligencia',
  wis: 'Sabiduria',
  cha: 'Carisma'
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