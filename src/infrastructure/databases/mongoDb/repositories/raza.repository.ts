import ICompetenciaRepository from '../../../../domain/repositories/ICompetenciaRepository';
import IConjuroRepository from '../../../../domain/repositories/IConjuroRepository';
import IDañoRepository from '../../../../domain/repositories/IDañoRepository';
import IHabilidadRepository from '../../../../domain/repositories/IHabilidadRepository';
import IIdiomaRepository from '../../../../domain/repositories/IIdiomaRepository';
import IRasgoRepository from '../../../../domain/repositories/IRasgoRepository';
import IRazaRepository from '../../../../domain/repositories/IRazaRepository';
import { RazaApi, RazaMongo, SubrazaApi, SubrazaMongo } from '../../../../domain/types';
import { formatearAbilityBonuses } from '../../../../utils/formatters';
const { formatearCompetencias, formatearOptions, formatearConjuros } = require('../../../../utils/formatters-old');
const RazaSchema = require('../schemas/Raza');
const CompetenciaRepository = require('./competencia.repository');
const ConjuroRepository = require('./conjuros.repository');
import DañoRepository from './daño.repository';
const HabilidadRepository = require('./habilidad.repository');
import IdiomaRepository from './idioma.repository';
import RasgoRepository from './rasgo.repository';

export default class RazaRepository extends IRazaRepository {
  idiomaRepository: IIdiomaRepository
  rasgoRepository: IRasgoRepository
  dañoRepository: IDañoRepository/*
  habilidadRepository: IHabilidadRepository
  competenciaRepository: ICompetenciaRepository
  conjuroRepository: IConjuroRepository*/

  constructor() {
    super()
    this.idiomaRepository = new IdiomaRepository()
    this.rasgoRepository = new RasgoRepository()
    this.dañoRepository = new DañoRepository()/*
    this.habilidadRepository = new HabilidadRepository()
    this.competenciaRepository = new CompetenciaRepository()
    this.conjuroRepository = new ConjuroRepository()*/
  }

  async obtenerTodas() {
    const razas = await RazaSchema.find();

    return this.formatearRazas(razas)
  }

  formatearRazas(razas: RazaMongo[]): RazaApi[] {
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

  formatearRaza(raza: RazaMongo): RazaApi {
    return {
      index: raza.index,
      name: raza.name,
      desc: raza.desc,
      img: raza.img,
      speed: raza.speed,
      size: raza.size,
      subraces: this.formatearSubrazas(raza?.subraces ?? []),
      ability_bonuses: formatearAbilityBonuses(raza?.ability_bonuses ?? []),
      languages: this.idiomaRepository.obtenerIdiomasPorIndices(raza?.languages ?? []),/*
      proficiencies: formatearCompetencias(raza?.starting_proficiencies ?? [], this.habilidadRepository, this.competenciaRepository),*/
      traits: this.rasgoRepository.obtenerRasgosPorIndices(raza?.traits ?? []),/*
      options: formatearOptions(raza?.options ?? [], this.idiomaRepository, this.competenciaRepository, this.habilidadRepository, this.conjuroRepository),
      spells: formatearConjuros(raza?.spells ?? [], this.conjuroRepository, this.rasgoRepository),*/
      resistances: this.dañoRepository.obtenerDañosPorIndices(raza?.resistances ?? [])
    };
    
  }

  formatearSubrazas(subrazas: SubrazaMongo[]): SubrazaApi[] {
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

  formatearSubraza(subraza: SubrazaMongo): SubrazaApi {
    return {
      index: subraza.index,
      name: subraza.name,
      img: subraza.img,
      desc: subraza.desc,
      speed: subraza.speed,
      types: subraza?.types,
      ability_bonuses: formatearAbilityBonuses(subraza?.ability_bonuses ?? []),/*
      proficiencies: formatearCompetencias(subraza?.starting_proficiencies ?? [], this.habilidadRepository, this.competenciaRepository),*/
      traits: this.rasgoRepository.obtenerRasgosPorIndices(subraza?.traits ?? []),/*
      options: formatearOptions(subraza?.options ?? [], this.idiomaRepository, this.competenciaRepository, this.habilidadRepository, this.conjuroRepository),
      spells: formatearConjuros(subraza?.spells ?? [], this.conjuroRepository, this.rasgoRepository),*/
      resistances: this.dañoRepository.obtenerDañosPorIndices(subraza?.resistances ?? [])
    }
  }
}
