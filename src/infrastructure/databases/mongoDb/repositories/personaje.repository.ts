import IPersonajeRepository from '../../../../domain/repositories/IPersonajeRepository';
import Personaje from '../schemas/Personaje';
import ClaseRepository from './clase.repository';
import CompetenciaRepository from './competencia.repository';
import HabilidadRepository from './habilidad.repository';
import IdiomaRepository from './idioma.repository';
import RasgoRepository from './rasgo.repository';
import RazaRepository from './raza.repository';
import EquipamientoRepository from './equipamiento.repository';
import DañoRepository from './daño.repository';
import PropiedadArmaRepository from './propiedadesArmas.repository';

const nivel = [300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000, 0]

export default class PersonajeRepository extends IPersonajeRepository {
  razaRepository: RazaRepository
  claseRepository: ClaseRepository
  habilidadRepository: HabilidadRepository
  idiomaRepository: IdiomaRepository
  competenciaRepository: CompetenciaRepository
  rasgoRepository: RasgoRepository
  equipamientoRepository: EquipamientoRepository
  dañoRepository: DañoRepository
  propiedadArmaRepository: PropiedadArmaRepository

  constructor() {
    super()
    this.razaRepository = new RazaRepository()
    this.claseRepository = new ClaseRepository()
    this.habilidadRepository = new HabilidadRepository()
    this.idiomaRepository = new IdiomaRepository()
    this.competenciaRepository = new CompetenciaRepository()
    this.rasgoRepository = new RasgoRepository()
    this.equipamientoRepository = new EquipamientoRepository()
    this.dañoRepository = new DañoRepository()
    this.propiedadArmaRepository = new PropiedadArmaRepository()
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
      skills,
      clase,
      equipment
    } = data

    const raza = await this.razaRepository.getRaza(race)
    const { subraces, ...razaSinSubrazas } = raza
    const subraza = subraces.find((s: any) => s.index === subrace)

    const claseData = await this.claseRepository.getClase(clase)
    const claseDataLevel = claseData?.levels[0]

    const traits = [...raza?.traits ?? [], ...subraza?.traits ?? [], ...claseDataLevel?.traits ?? []]
    let HP = claseData?.hit_die ?? 1

    if (traits.includes('dwarven-toughness')) {
      HP += 1
    }

    HP += Math.floor((abilities.con/2) - 5)

    const dataType = subraza?.types?.find((t: any) => t.name === type)

    const proficiency_weapon = this.competenciaRepository.obtenerCompetenciasPorIndicesSinRep([
      ...raza?.starting_proficiencies?.filter((prof: any) => prof.type === 'arma')?.map((prof: any) => prof.index) ?? [],
      ...subraza?.starting_proficiencies?.filter((prof: any) => prof.type === 'arma')?.map((prof: any) => prof.index) ?? [],
      ...claseData?.starting_proficiencies?.filter((prof: any) => prof.type === 'arma')?.map((prof: any) => prof.index) ?? []
    ])

    const proficiency_armor = this.competenciaRepository.obtenerCompetenciasPorIndicesSinRep([
      ...raza?.starting_proficiencies?.filter((prof: any) => prof.type === 'armadura')?.map((prof: any) => prof.index) ?? [],
      ...subraza?.starting_proficiencies?.filter((prof: any) => prof.type === 'armadura')?.map((prof: any) => prof.index) ?? [],
      ...claseData?.starting_proficiencies?.filter((prof: any) => prof.type === 'armadura')?.map((prof: any) => prof.index) ?? []
    ])

    let CA = 10

    if (traits.includes('barbarian-unarmored-defense')) {
      CA += Math.floor((abilities.con/2) - 5) + Math.floor((abilities.dex/2) - 5)
    }

    const equipmentData = equipment

    claseData?.starting_equipment?.forEach((equip1: any) => {
      const dataEquip = this.equipamientoRepository.obtenerEquipamientoPorIndice(equip1.index)

      if (dataEquip?.content?.length > 0) {
        dataEquip?.content?.forEach((equip2: any) => {
          equipmentData.push({
            index: equip2.item,
            quantity: equip2.quantity * equip1.quantity
          })
        })
      } else {
        equipmentData.push({
          index: equip1.index,
          quantity: equip1.quantity
        })
      }
    })

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
      classes: [{ class: clase, name: claseData.name, level: 1 }],
      race: type ?? subraza?.name ?? raza?.name,
      traits,
      traits_data: {...claseDataLevel?.traits_data, ...subraza?.traits_data},
      prof_bonus: claseDataLevel?.prof_bonus,
      resistances: [...raza?.resistances ?? [], ...subraza?.resistances ?? []],
      speed: subraza?.speed ?? raza?.speed,
      size: subraza?.size ?? raza?.size,
      languages: [...raza?.languages ?? [],...subraza?.languages ?? [],  ...languages ?? []],
      saving_throws: claseData?.saving_throws ?? [],
      skills: [
        ...skills ?? [],
        ...raza?.starting_proficiencies?.filter((prof: any) => prof.type === 'habilidad')?.map((prof: any) => prof.index) ?? [],
        ...subraza?.starting_proficiencies?.filter((prof: any) => prof.type === 'habilidad')?.map((prof: any) => prof.index) ?? []
      ],
      proficiency_weapon: proficiency_weapon.map((prof: any) => prof.index),
      proficiency_armor: proficiency_armor.map((prof: any) => prof.index),
      proficiencies: [
        ...raza?.starting_proficiencies?.filter((prof: any) => prof.type === 'herramienta')?.map((prof: any) => prof.index) ?? [],
        ...subraza?.starting_proficiencies?.filter((prof: any) => prof.type === 'herramienta')?.map((prof: any) => prof.index) ?? [],
        ...data?.proficiencies ?? []
      ],
      spells: [...raza?.spells ?? [], ...subraza?.spells ?? [], ...spells ?? []],
      equipment: equipmentData,
      CA,
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

  async cambiarXp(data: any): Promise<any> {
    const { id, XP } = data
    
    const resultado = await Personaje.findByIdAndUpdate(
      id,
      {
        $set: {
          XP
        }
      },
      { new: true }
    );

    return resultado
  }

  async subirNivelDatos(data: any): Promise<any> {
    const { id, clase } = data

    const personaje = await Personaje.findById(id);
    const level = personaje?.classes?.find(clas => clas.class === clase)?.level ?? 0

    const claseData = await this.claseRepository.getClase(clase)
    const dataLevel = claseData.levels.find((l:any)=> l.level === level+1)
    
    const traits: any[] = []
    
    Object.keys(dataLevel.traits_data).forEach(t => {
      const trait = this.rasgoRepository.obtenerRasgoPorIndice(t)
      
      const data = dataLevel.traits_data[t]

      let desc: string = trait?.desc ?? ''

      Object.keys(data).forEach(d => {
        desc = desc.replaceAll(d, data[d])
      })

      traits.push({ ...trait, desc })
    })

    return {
      hit_die: claseData?.hit_die,
      prof_bonus: dataLevel.prof_bonus,
      traits
    }
  }

  async subirNivel(data: any): Promise<any> {
    const id = data.id

    const { hit, clase } = data.data

    const personaje = await Personaje.findById(id);

    //const claseData = await this.claseRepository.getClase(clase)

    //console.log('Clase a actualizar:', clase);
    //console.log('Personaje antes de la actualización:', personaje);


    const resultado = await Personaje.findByIdAndUpdate(
      id,
      {
        $set: {
          XP: 0
        },
        $inc: { 
          'classes.$[elem].level': 1,
          HPMax: hit,
          HPActual: hit
        }
      },
      {
        arrayFilters: [{ 'elem.class': clase }],
        new: true 
      }
    );

    if (!resultado) {
      console.log('No se encontró el personaje o no se realizó la actualización.');
    } else {
      console.log('Actualización exitosa:', resultado);
    }

    
    //console.log(personaje?.classes)

    return null
  }

  async añadirEquipamiento(data: any) {
    const { id, equip, cantidad } = data
    const personaje = await Personaje.findById(id);

    const equipment = personaje?.equipment ?? []

    const idx = equipment.findIndex(eq => eq.index === equip)

    if (idx > -1) {
      equipment[idx].quantity += cantidad 
    } else {
      equipment.push({ index: equip, quantity: cantidad })
    }

    const resultado = await Personaje.findByIdAndUpdate(
      id,
      {
        $set: {
          equipment
        }
      },
      { new: true }
    );

    return resultado
  }

  async eliminarEquipamiento(data: any) {
    const { id, equip, cantidad } = data
    const personaje = await Personaje.findById(id);

    const equipment = personaje?.equipment ?? []

    const idx = equipment.findIndex(eq => eq.index === equip)

    if (idx > -1) {
      if (equipment[idx].quantity === cantidad) {
        equipment.splice(idx, 1)
      } else {
        equipment[idx].quantity -= cantidad 
      }
    }

    const resultado = await Personaje.findByIdAndUpdate(
      id,
      {
        $set: {
          equipment
        }
      },
      { new: true }
    );

    return resultado
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
      classes: personaje.classes.map((clas: any) => { return { name: clas.name, level: clas.level }}),
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

    const traitsData = traits?.map(trait => {
      const data = personaje?.traits_data[trait.index]
      if (data) {

        let desc: string = trait?.desc ?? ''

        Object.keys(data).forEach(d => {
          desc = desc.replaceAll(d, data[d])
        })

        return {
          ...trait,
          desc
        }
        
      } else {
        return trait
      }
    })

    const equipo = this.equipamientoRepository.obtenerEquipamientosPorIndices(personaje.equipment.map((eq: any) => eq.index))

    personaje.equipment.forEach((equip: any) => {
      const idx = equipo.findIndex(eq => eq.index === equip.index)
      equipo[idx].quantity = equip.quantity

      if (equipo[idx]?.category === 'Arma') {
        const daño = this.dañoRepository.obtenerDañoPorIndice(equipo[idx]?.weapon?.damage?.type ?? '')

        if (equipo[idx].weapon.damage) {
          equipo[idx].weapon.damage.name = daño?.name ?? ''
        
          if (equipo[idx].weapon.two_handed_damage) {
            const daño_two = this.dañoRepository.obtenerDañoPorIndice(equipo[idx]?.weapon?.two_handed_damage?.type)
            equipo[idx].weapon.two_handed_damage.name = daño_two?.name ?? ''
          }
        }
        
        equipo[idx].weapon.properties = this.propiedadArmaRepository.obtenerPropiedadesPorIndices(equipo[idx]?.weapon?.properties)

        equipo[idx].weapon.properties.sort((a: any, b: any) => {
          return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
        })
      }
    })

    equipo.sort((a: any, b: any) => {
      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
    })

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
      traits: traitsData,
      prof_bonus: personaje.prof_bonus,
      saving_throws: personaje.saving_throws,
      equipment: equipo
    }
  }
}
