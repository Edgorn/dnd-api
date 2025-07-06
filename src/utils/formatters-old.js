const caracteristicas = {
  str: 'Fuerza',
  dex: 'Destreza',
  con: 'Constitucion',
  int: 'Inteligencia',
  wis: 'Sabiduria',
  cha: 'Carisma'
}
const formatearCompetencias = (proficiencies, habilidadRepository, competenciaRepository) => {
  const indicesHabilidades = 
    proficiencies
      .filter(proficiency => proficiency.type === 'habilidad')
      .map(proficiency => proficiency.index)

  const habilidades = 
    habilidadRepository
      .obtenerHabilidadesPorIndices(indicesHabilidades)
      .map(habilidad => {
        return {
          index: habilidad?.index,
          name: habilidad?.name,
          type: 'habilidad'
        }
      })

  const indicesCompetencias =
    proficiencies
      .filter(proficiency => proficiency.type !== 'habilidad')
      .map(proficiency => proficiency.index)

  const competencias = competenciaRepository
    .obtenerCompetenciasPorIndices(indicesCompetencias)

  return [
    ...habilidades,
    ...competencias
  ]
}

module.exports = {
  formatearCompetencias
};