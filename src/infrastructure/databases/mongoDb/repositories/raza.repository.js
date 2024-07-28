const IRazaRepository = require('../../../../domain/repositories/IRazaRepository');
const { formatearAbilityBonuses, formatearCompetencias, formatearOptions, formatearConjuros } = require('../../../../utils/formatters');
const RazaSchema = require('../schemas/Raza');
const CompetenciaRepository = require('./competencia.repository');
const ConjuroRepository = require('./conjuros.repository');
const DañoRepository = require('./daño.repository');
const HabilidadRepository = require('./habilidad.repository');
const IdiomaRepository = require('./idioma.repository');
const RasgoRepository = require('./rasgo.repository');

class RazaRepository extends IRazaRepository {

  constructor() {
    super()
    this.idiomaRepository = new IdiomaRepository()
    this.rasgoRepository = new RasgoRepository()
    this.dañoRepository = new DañoRepository()
    this.habilidadRepository = new HabilidadRepository()
    this.competenciaRepository = new CompetenciaRepository()
    this.conjuroRepository = new ConjuroRepository()
  }

  async obtenerTodas() {
    const razas = await RazaSchema.find();

    return this.formatearRazas(razas)
  }

  formatearRazas(razas) {
    const formateadas = razas.map(raza => this.formatearRaza(raza))

    formateadas.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    });

    return formateadas;
  }

  formatearRaza(raza) {
    return {
      index: raza.index,
      name: raza.name,
      desc: raza.desc,
      speed: raza.speed,
      size: raza.size,
      subraces: this.formatearSubrazas(raza?.subraces ?? []),
      ability_bonuses: formatearAbilityBonuses(raza?.ability_bonuses ?? []),
      languages: this.idiomaRepository.obtenerIdiomasPorIndices(raza?.languages ?? []),
      proficiencies: formatearCompetencias(raza?.starting_proficiencies ?? [], this.habilidadRepository, this.competenciaRepository),
      traits: this.rasgoRepository.obtenerRasgosPorIndices(raza?.traits ?? []),
      options: formatearOptions(raza?.options ?? [], this.idiomaRepository, this.competenciaRepository, this.habilidadRepository, this.conjuroRepository),
      spells: formatearConjuros(raza?.spells ?? [], this.conjuroRepository, this.rasgoRepository),
      resistances: this.dañoRepository.obtenerDañosPorIndices(raza?.resistances ?? [])
    };
  }

  formatearSubrazas(subrazas) {
    const formateadas = subrazas.map(raza => this.formatearSubraza(raza))

    formateadas.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    });

    return formateadas;
  }

  formatearSubraza(subraza) {
    return {
      index: subraza.index,
      name: subraza.name,
      desc: subraza.desc,
      speed: subraza.speed,
      types: subraza?.types?.map(type => {
        return {
          name: type.name,
          desc: type.desc
        }
      }),
      ability_bonuses: formatearAbilityBonuses(subraza?.ability_bonuses ?? []),
      proficiencies: formatearCompetencias(subraza?.starting_proficiencies ?? [], this.habilidadRepository, this.competenciaRepository),
      traits: this.rasgoRepository.obtenerRasgosPorIndices(subraza?.traits ?? []),
      options: formatearOptions(subraza?.options ?? [], this.idiomaRepository, this.competenciaRepository, this.habilidadRepository, this.conjuroRepository),
      spells: formatearConjuros(subraza?.spells ?? [], this.conjuroRepository, this.rasgoRepository),
      resistances: this.dañoRepository.obtenerDañosPorIndices(subraza?.resistances ?? [])
    }
  }
}

module.exports = RazaRepository;