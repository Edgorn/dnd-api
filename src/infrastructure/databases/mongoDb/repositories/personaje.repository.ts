import IPersonajeRepository from '../../../../domain/repositories/IPersonajeRepository';
import Personaje from '../schemas/Personaje';
import CompetenciaRepository from './competencia.repository';
import HabilidadRepository from './habilidad.repository';
import IdiomaRepository from './idioma.repository';
import RasgoRepository from './rasgo.repository';
import RazaRepository from './raza.repository';

const nivel = [300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000, 0]

export default class PersonajeRepository extends IPersonajeRepository {
  razaRepository: RazaRepository
  habilidadRepository: HabilidadRepository
  idiomaRepository: IdiomaRepository
  competenciaRepository: CompetenciaRepository
  rasgoRepository: RasgoRepository

  constructor() {
    super()
    this.razaRepository = new RazaRepository()
    this.habilidadRepository = new HabilidadRepository()
    this.idiomaRepository = new IdiomaRepository()
    this.competenciaRepository = new CompetenciaRepository()
    this.rasgoRepository = new RasgoRepository()
  }

  async crear(data: any): Promise<any> {
    const {
      name,
      user,
      background,
      appearance,
      abilities,
      race,
      subrace,
      type,
      campaign,
      languages,
      spells,
      skills
    } = data

    const raza = await this.razaRepository.getRaza(race)
    const { subraces, ...razaSinSubrazas } = raza
    const subraza = subraces.find((s: any) => s.index === subrace)

    //console.log(razaSinSubrazas)
    //console.log(subraza)
    //console.log(data)
    const traits = [...raza?.traits ?? [], ...subraza?.traits ?? []]
    let HP = 1

    if (traits.includes('dwarven-toughness')) {
      HP += 1
    }

    const dataType = subraza?.types?.find((t: any) => t.name === type)

    const personaje = new Personaje({
      name,
      user,
      img: dataType?.img ?? subraza?.img ?? raza?.img,
      background,
      appearance,
      abilities,
      raceId: race,
      subraceId: subrace,
      type,
      campaign,
      classes: [{ class: 'Ninguna', level: 1 }],
      race: type ?? subraza?.name ?? raza?.name,
      traits,
      resistances: [...raza?.resistances ?? [], ...subraza?.resistances ?? []],
      speed: subraza?.speed ?? raza?.speed,
      size: subraza?.size ?? raza?.size,
      languages: [...raza?.languages ?? [],...subraza?.languages ?? [],  ...languages ?? []],
      skills: [
        ...skills ?? [],
        ...raza?.starting_proficiencies?.filter((prof: any) => prof.type === 'habilidad')?.map((prof: any) => prof.index) ?? [],
        ...subraza?.starting_proficiencies?.filter((prof: any) => prof.type === 'habilidad')?.map((prof: any) => prof.index) ?? []
      ],
      proficiency_weapon: [
        ...raza?.starting_proficiencies?.filter((prof: any) => prof.type === 'arma')?.map((prof: any) => prof.index) ?? [],
        ...subraza?.starting_proficiencies?.filter((prof: any) => prof.type === 'arma')?.map((prof: any) => prof.index) ?? []
      ],
      proficiency_armor: [
        ...raza?.starting_proficiencies?.filter((prof: any) => prof.type === 'armadura')?.map((prof: any) => prof.index) ?? [],
        ...subraza?.starting_proficiencies?.filter((prof: any) => prof.type === 'armadura')?.map((prof: any) => prof.index) ?? []
      ],
      proficiencies: [
        ...raza?.starting_proficiencies?.filter((prof: any) => prof.type === 'herramienta')?.map((prof: any) => prof.index) ?? [],
        ...subraza?.starting_proficiencies?.filter((prof: any) => prof.type === 'herramienta')?.map((prof: any) => prof.index) ?? [],
        ...data?.proficiencies ?? []
      ],
      spells: [...raza?.spells ?? [], ...subraza?.spells ?? [], ...spells ?? []],
      CA: 10,
      HPMax: HP,
      HPActual: HP,
      XP: 0
    })

    const resultado = await personaje.save()

    return resultado
  }

  async consultarPersonajes(id: number): Promise<any> {
    const personajes = await Personaje.find({ user: id });

    return this.formatearPersonajes(personajes)
  }

  
  async consultarPersonaje(idUser: string, idCharacter: string): Promise<any> {
    const personaje = await Personaje.findById(idCharacter);

    return this.formatearPersonaje(personaje)
  }

  formatearPersonajes(personajes: any[]): any[] {
    const formateadas = personajes.map(personaje => this.formatearPersonajeBasico(personaje))

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

  formatearPersonajeBasico(personaje: any): any {
    const level = personaje.classes.map((cl: any) => cl.level).reduce((acumulador: number, valorActual: number) => acumulador + valorActual, 0)

    return {
      id: personaje._id.toString(),
      img: personaje.img,
      name: personaje.name,
      race: personaje.race,
      campaign: personaje.campaign,
      classes: personaje.classes,
      CA: personaje.CA,
      HPMax: personaje.HPMax,
      HPActual: personaje.HPActual,
      XP: personaje.XP,
      XPMax: nivel[level]
    }
  }

  formatearPersonaje(personaje: any): any {
    const level = personaje.classes.map((cl: any) => cl.level).reduce((acumulador: number, valorActual: number) => acumulador + valorActual, 0)

    const habilidades = this.habilidadRepository
      .obtenerHabilidades()
      .map(habilidad => {
        return {
          ...habilidad,
          competencia: personaje?.skills?.includes(habilidad?.index) ? 1 : 0
        }
      })
      .sort((a, b) => {
        return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
      })

    const idiomas = this.idiomaRepository
      .obtenerIdiomasPorIndices(personaje?.languages)
      .map(idioma => idioma.name)

    const weapons = this.competenciaRepository
      .obtenerCompetenciasPorIndices(personaje?.proficiency_weapon)
      .map(weapon => weapon.name)
      
    
    const armors = this.competenciaRepository
      .obtenerCompetenciasPorIndices(personaje?.proficiency_armor)
      .map(armor => armor.name)
      
    const proficiencies = this.competenciaRepository
      .obtenerCompetenciasPorIndices(personaje?.proficiencies)
      .map(proficiency => proficiency.name)

    const traits = this.rasgoRepository.obtenerRasgosPorIndices(personaje?.traits)

    return {
      id: personaje._id.toString(),
      img: personaje.img,
      name: personaje.name,
      race: personaje.race,
      classes: personaje.classes,
      level,
      XP: personaje.XP,
      XPMax: nivel[level],
      abilities: personaje?.abilities,
      HPMax: personaje?.HPMax,
      CA: personaje?.CA,
      speed: personaje?.speed,
      skills: habilidades,
      languages: idiomas,
      weapons,
      armors,
      proficiencies,
      traits
    }
  }
}
