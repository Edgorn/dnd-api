import IPersonajeRepository from '../../../../domain/repositories/IPersonajeRepository';
import Personaje from '../schemas/Personaje';
import RazaRepository from './raza.repository';

const nivel = [300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000, 0]

export default class PersonajeRepository extends IPersonajeRepository {
  razaRepository: RazaRepository

  constructor() {
    super()
    this.razaRepository = new RazaRepository()
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

  formatearPersonajes(personajes: any[]): any[] {
    const formateadas = personajes.map(personaje => this.formatearPersonaje(personaje))

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

  formatearPersonaje(personaje: any): any {
    const level = personaje.classes.map((cl: any) => cl.level).reduce((acumulador: number, valorActual: number) => acumulador + valorActual, 0)

    return {
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
}
