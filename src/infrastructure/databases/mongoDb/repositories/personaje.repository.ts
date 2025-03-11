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
import ITransfondoRepository from '../../../../domain/repositories/ITransfondoRepository';
import TransfondoRepository from './transfondo.repository';
import { escribirCompetencias, escribirConjuros, escribirEquipo, escribirOrganizaciones, escribirRasgos, escribirTransfondo } from '../../../../utils/escribirPdf';
import axios from 'axios';
import IUsuarioRepository from '../../../../domain/repositories/IUsuarioRepository';
import UsuarioRepository from './usuario.repository';
import IConjuroRepository from '../../../../domain/repositories/IConjuroRepository';
import ConjuroRepository from './conjuros.repository';
import { formatearOptions } from '../../../../utils/formatters';
import IInvocacionRepository from '../../../../domain/repositories/IInvocacionRepository';
import InvocacionRepository from './invocacion.repository';
import { PersonajeBasico } from '../../../../domain/types/personajes';
import DisciplinaRepository from './disciplina.repository';
import IDisciplinaRepository from '../../../../domain/repositories/IDisciplinaRepository';

const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

const nivel = [300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000, 0]

const caracteristicas: any = {
  str: 'Fuerza',
  dex: 'Destreza',
  con: 'Constitucion',
  int: 'Inteligencia',
  wis: 'Sabiduria',
  cha: 'Carisma'
}

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
  transfondoRepository: ITransfondoRepository
  usuarioRepository: IUsuarioRepository
  conjuroRepository: IConjuroRepository
  invocacionRepository: IInvocacionRepository
  disciplinaRespository: IDisciplinaRepository

  constructor() {
    super()
    this.razaRepository = new RazaRepository()
    this.claseRepository = new ClaseRepository()
    this.habilidadRepository = new HabilidadRepository()
    this.idiomaRepository = new IdiomaRepository()
    this.competenciaRepository = new CompetenciaRepository()
    this.conjuroRepository = new ConjuroRepository()
    this.rasgoRepository = new RasgoRepository(this.conjuroRepository)
    this.equipamientoRepository = new EquipamientoRepository()
    this.dañoRepository = new DañoRepository()
    this.propiedadArmaRepository = new PropiedadArmaRepository()
    this.transfondoRepository = new TransfondoRepository()
    this.usuarioRepository = new UsuarioRepository()
    this.invocacionRepository = new InvocacionRepository()
    this.disciplinaRespository = new DisciplinaRepository(this.conjuroRepository)
  }

  async consultarPersonajes(id: number): Promise<PersonajeBasico[]> {
    const personajes = await Personaje.find({ user: id });

    return this.formatearPersonajes(personajes)
  }

  formatearPersonajes(personajes: any[]): PersonajeBasico[] {
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

  formatearPersonajeBasico(personaje: any): PersonajeBasico {
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
      XPMax: nivel[level-1]
    }
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
      double_skills,
      clase,
      subclase,
      equipment
    } = data

    const raza = await this.razaRepository.getRaza(race)
    const { subraces, ...razaSinSubrazas } = raza
    const subraza = subraces.find((s: any) => s.index === subrace)

    const claseData = await this.claseRepository.getClase(clase)
    const claseDataLevel = claseData?.levels[0]
    const subclaseData = subclase  ? claseDataLevel?.subclasses[subclase] : null

    const dataBackground = { ...background }

    const transfondos = await this.transfondoRepository.obtenerTodos()
    const transfondo = transfondos.find(tra => tra.index === background.index)
    
    dataBackground.name = transfondo?.name ?? ''

    const traits = [
       ...raza?.traits ?? [], 
       ...subraza?.traits ?? [], 
       ...claseDataLevel?.traits ?? [],
       ...subclaseData?.traits ?? [],
       ...transfondo.traits?.map((tr: any) => tr.index) ?? []
      ]
    let HP = claseData?.hit_die ?? 1

    if (traits.includes('dwarven-toughness')) {
      HP += 1
    }

    HP += Math.floor((abilities.con/2) - 5)

    const dataType = subraza?.types?.find((t: any) => t.name === type)

    const proficiency_weapon = this.competenciaRepository.obtenerCompetenciasPorIndicesSinRep([
      ...raza?.starting_proficiencies?.filter((prof: any) => prof.type === 'arma')?.map((prof: any) => prof.index) ?? [],
      ...subraza?.starting_proficiencies?.filter((prof: any) => prof.type === 'arma')?.map((prof: any) => prof.index) ?? [],
      ...claseData?.starting_proficiencies?.filter((prof: any) => prof.type === 'arma')?.map((prof: any) => prof.index) ?? [],
      ...subclaseData?.proficiencies?.filter((prof: any) => prof.type === 'arma')?.map((prof: any) => prof.index) ?? []
    ])

    const proficiency_armor = this.competenciaRepository.obtenerCompetenciasPorIndicesSinRep([
      ...raza?.starting_proficiencies?.filter((prof: any) => prof.type === 'armadura')?.map((prof: any) => prof.index) ?? [],
      ...subraza?.starting_proficiencies?.filter((prof: any) => prof.type === 'armadura')?.map((prof: any) => prof.index) ?? [],
      ...claseData?.starting_proficiencies?.filter((prof: any) => prof.type === 'armadura')?.map((prof: any) => prof.index) ?? [],
      ...subclaseData?.proficiencies?.filter((prof: any) => prof.type === 'armadura')?.map((prof: any) => prof.index) ?? []
    ])

    let CA = 10

    if (traits.includes('barbarian-unarmored-defense')) {
      CA += Math.floor((abilities.con/2) - 5) + Math.floor((abilities.dex/2) - 5)
    } else if (traits.includes('monk-unarmored-defense')) {
      CA += Math.floor((abilities.wis/2) - 5) + Math.floor((abilities.dex/2) - 5)
    }

    const equipmentData: any[] = []
    const equipmentList = [...equipment, ...claseData?.starting_equipment ?? []]

    equipmentList?.forEach((equip1: any) => {
      const dataEquip = this.equipamientoRepository.obtenerEquipamientoPorIndice(equip1.index)

      if (dataEquip?.content?.length > 0) {
        dataEquip?.content?.forEach((equip2: any) => {
          const idx = equipmentData.findIndex((eq: any) => eq.index === equip2.index)
          if (idx === -1) {
            equipmentData.push({
              index: equip2.item,
              quantity: equip2.quantity * equip1.quantity
            })
          } else {
            equipmentData[idx].quantity += equip2.quantity * equip1.quantity
          }
        })
      } else {
        const idx = equipmentData.findIndex((eq: any) => eq.index === equip1.index)
        if (idx === -1) {
          equipmentData.push({
            index: equip1.index,
            quantity: equip1.quantity
          })
        } else {
          equipmentData[idx].quantity += equip1.quantity
        }
      }
    })

    let money = 0

    if (transfondo?.money?.unit === 'po') {
      money += transfondo?.money?.quantity * 100
    }

    const spellsClase = claseDataLevel?.spellcasting?.all_spells
      ? this.conjuroRepository.obtenerConjurosPorNivelClase(claseDataLevel?.spellcasting?.all_spells, clase).map(conjuro => conjuro.index)
      : []
 
    if (spellsClase?.length > 0) {
      spells[clase].push(...spellsClase)
    }

    if (subraza?.spells) {
      spells.race.push(...subraza?.spells)
    }

    if (subclaseData?.spells?.length > 0) {
      if (!spells[clase + '_' + subclase]) {
        spells[clase + '_' + subclase] = []
      }

      spells[clase + '_' + subclase].push(...subclaseData?.spells ?? [])
    }

    const personaje = new Personaje({
      name,
      user,
      img: dataType?.img ?? subraza?.img ?? raza?.img,
      background: dataBackground,
      appearance,
      abilities,
      raceId: race,
      subraceId: subrace,
      type,
      campaign,
      classes: [{ class: clase, name: claseData.name, level: 1 }],
      subclasses: subclase ? [subclase] : [],
      race: type ?? subraza?.name ?? raza?.name,
      traits,
      traits_data: {...claseDataLevel?.traits_data, ...subraza?.traits_data},
      prof_bonus: claseDataLevel?.prof_bonus,
      resistances: [...raza?.resistances ?? [], ...subraza?.resistances ?? []],
      speed: subraza?.speed ?? raza?.speed,
      plusSpeed: 0,
      size: subraza?.size ?? raza?.size,
      languages: [...raza?.languages ?? [],...subraza?.languages ?? [],  ...languages ?? []],
      saving_throws: claseData?.saving_throws ?? [],
      skills: [
        ...skills ?? [],
        ...raza?.starting_proficiencies?.filter((prof: any) => prof.type === 'habilidad')?.map((prof: any) => prof.index) ?? [],
        ...subraza?.starting_proficiencies?.filter((prof: any) => prof.type === 'habilidad')?.map((prof: any) => prof.index) ?? [],
        ...transfondo?.proficiencies?.filter((prof: any) => prof.type === 'habilidad')?.map((prof: any) => prof.index) ?? []
      ],
      double_skills,
      proficiency_weapon: proficiency_weapon.map((prof: any) => prof.index),
      proficiency_armor: proficiency_armor.map((prof: any) => prof.index),
      proficiencies: [
        ...raza?.starting_proficiencies?.filter((prof: any) => prof.type === 'herramienta')?.map((prof: any) => prof.index) ?? [],
        ...subraza?.starting_proficiencies?.filter((prof: any) => prof.type === 'herramienta')?.map((prof: any) => prof.index) ?? [],
        ...data?.proficiencies ?? []
      ],
      spells,
      equipment: equipmentData,
      money,
      CA,
      HPMax: HP,
      HPActual: HP,
      XP: 0
    })

    const resultado = await personaje.save()

    return this.formatearPersonajeBasico(resultado)
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

    return {
      basic: this.formatearPersonajeBasico(resultado)
    }
  }

  async subirNivelDatos(data: any): Promise<any> {
    const { id, clase } = data

    const personaje = await Personaje.findById(id);
    const level = personaje?.classes?.find(clas => clas.class === clase)?.level ?? 0

    const claseData = await this.claseRepository.getClase(clase)

    const dataLevel = claseData.levels.find((l:any)=> l.level === level+1)
    const dataLevelOld = claseData.levels.find((l:any)=> l.level === level)

    const subclasesData = await this.claseRepository.formatearSubclasesType(dataLevel.subclasses_options, dataLevel.subclasses)
    
    const traits: any[] = []
    
    if (dataLevel?.traits_data) {
      Object.keys(dataLevel?.traits_data).forEach(t => {
        const data = dataLevel.traits_data[t]
        const dataOld = dataLevelOld?.traits_data ? dataLevelOld?.traits_data[t] : null
  
        if (this.valoresNumericosDistintos(data, dataOld)) {
          const trait = this.rasgoRepository.obtenerRasgoPorIndice(t)
        
          let desc: string = trait?.desc ?? ''
    
          Object.keys(data).forEach(d => {
            desc = desc.replaceAll(d, data[d])
          })
  
          traits.push({ ...trait, desc })
        }
      })
    }
    
    traits.push(
      ...this.rasgoRepository
        .obtenerRasgosPorIndices(
          dataLevel.traits?.filter((t: any) => !traits.map(trait => trait.index).includes(t))
        )
    )

    let traits_options = null

    if (dataLevel?.traits_options) {
      traits_options = dataLevel?.traits_options

      if (traits_options) {
        traits_options.options = this.rasgoRepository.obtenerRasgosPorIndices(dataLevel?.traits_options?.options ?? [])
      }
    }

    const spells = dataLevel?.spellcasting?.all_spells
      ? this.conjuroRepository.obtenerConjurosPorNivelClase(dataLevel?.spellcasting?.all_spells, clase)
      : []

    let disciplines_new_number = 0
    let disciplines_new = null

    let disciplines_change_number = 0
    let disciplines_change = null

    if (dataLevel?.subclasses) {
      personaje?.subclasses?.forEach(s => {
        if (dataLevel?.subclasses[s]?.traits_data) {
          Object.keys(dataLevel?.subclasses[s]?.traits_data).forEach(t => {
            const data = dataLevel?.subclasses[s]?.traits_data[t]
            const dataOld = dataLevelOld?.traits_data ? dataLevelOld?.traits_data[t] : null
      
            if (this.valoresNumericosDistintos(data, dataOld)) {
              const trait = this.rasgoRepository.obtenerRasgoPorIndice(t)
            
              let desc: string = trait?.desc ?? ''
        
              Object.keys(data).forEach(d => {
                desc = desc.replaceAll(d, data[d])
              })
      
              traits.push({ ...trait, desc })
            }
          })
        }

        if (dataLevel?.subclasses[s]?.traits) {
          traits.push(
            ...this.rasgoRepository
              .obtenerRasgosPorIndices(
                dataLevel?.subclasses[s]?.traits?.filter((t: any) => !traits.map(trait => trait.index).includes(t))
              )
          )
        }
  
        if (dataLevel?.subclasses[s]?.traits_options) {
          traits_options = dataLevel?.subclasses[s]?.traits_options
     
          if (traits_options) {
            traits_options.options = this.rasgoRepository.obtenerRasgosPorIndices(dataLevel?.subclasses[s]?.traits_options?.options ?? [])
          }
        }

        if (dataLevel?.subclasses[s]?.spells) {
          this.conjuroRepository.init()
          spells.push(...this.conjuroRepository.obtenerConjurosPorIndices(dataLevel?.subclasses[s]?.spells) ?? [])
        }

        if (dataLevel?.subclasses[s]?.disciplines_new) {
          disciplines_new_number = dataLevel?.subclasses[s]?.disciplines_new
        }

        if (dataLevel?.subclasses[s]?.disciplines_change) {
          disciplines_change_number = dataLevel?.subclasses[s]?.disciplines_change
        }
      })
    }

    if (disciplines_new_number || disciplines_change_number) {
      await this.disciplinaRespository.init()
      const dataDis = await this.disciplinaRespository.obtenerTodos() 

      if (disciplines_new_number) {
        disciplines_new = {
          choose: disciplines_new_number,
          options: dataDis
        } 
      }
      
      if (disciplines_change_number) {
        disciplines_change = {
          choose: disciplines_change_number,
          options: dataDis
        } 
      }
    }

    let invocations = null
    let invocations_change = null

    if (dataLevel.invocations || dataLevel.invocations_change) {
      await this.invocacionRepository.inicializar()
      const dataInv = await this.invocacionRepository.obtenerTodos() 

      if (dataLevel.invocations) {
        invocations = {
          choose: dataLevel.invocations,
          options: dataInv
        } 
      }

      if (dataLevel.invocations_change) {
        invocations_change = {
          choose: dataLevel.invocations_change,
          options: dataInv
        } 
      } 
    } 
 
    return {
      hit_die: claseData?.hit_die,
      prof_bonus: dataLevel.prof_bonus === dataLevelOld?.prof_bonus ? null : dataLevel.prof_bonus,
      traits,
      traits_options,
      ability_score: dataLevel?.ability_score,
      spellcasting_options: formatearOptions(dataLevel?.spellcasting?.options ?? [], this.idiomaRepository, this.competenciaRepository, this.habilidadRepository, this.conjuroRepository),
      spellcasting_changes: formatearOptions(dataLevel?.spellcasting?.change ?? [], this.idiomaRepository, this.competenciaRepository, this.habilidadRepository, this.conjuroRepository),
      invocations,
      invocations_change,
      disciplines_new,
      disciplines_change,
      subclasesData,
      spells
    }
  }

  valoresNumericosDistintos(obj1: any, obj2: any): boolean {
    for (const key in obj1) {
      if (!obj2) {
        return true
      } else if (obj1[key] !== obj2[key]) {
        return true;
      }
    }
    return false;
  }

  async subirNivel(data: any): Promise<any> {
    const id = data.id

    const { hit, clase, abilities, subclases, trait, spells, invocations, disciplines } = data.data

    const personaje = await Personaje.findById(id);
    const level = personaje?.classes?.find(clas => clas.class === clase)?.level ?? 0

    const claseData = await this.claseRepository.getClase(clase)
    const dataLevel = claseData.levels.find((l:any)=> l.level === level+1)
    
    let dataTraitsSubclases = {}
    let actualDisciplines = disciplines ?? []

    const listSubclases = [ ...personaje?.subclasses ?? [], ...subclases ?? []]
    
    if (dataLevel?.subclasses) {
      listSubclases?.forEach((subclase: any) => {
        if (dataLevel?.subclasses && dataLevel?.subclasses[subclase]?.traits_data) {
          dataTraitsSubclases = {
            ...dataTraitsSubclases,
            ...dataLevel?.subclasses[subclase]?.traits_data
          }
        }
  
        if (dataLevel?.subclasses[subclase]?.disciplines) {
          actualDisciplines.push(...dataLevel?.subclasses[subclase]?.disciplines ?? [])
        }
      })
    }
    
    const traitsData = { ...personaje?.traits_data, ...dataLevel?.traits_data, ...dataTraitsSubclases }

    if (dataLevel?.traits?.includes('primal-champion')) {
      abilities.str += 4
      abilities.con += 4
    }

    const traitsSubclase = dataLevel?.subclasses
      ? [...subclases ?? [], ...personaje?.subclasses ?? []].map((subclase: any) => {
          return dataLevel?.subclasses[subclase]?.traits
        }).flat().filter(item => item !== undefined)
      : []

    if (trait) {
      traitsSubclase.push(trait)
    }

    const traits = [...personaje?.traits ?? [], ...dataLevel?.traits ?? [], ...traitsSubclase ?? []]

    let armadura = false
    let CA = 10
    let shield = 0

    this.equipamientoRepository
      .obtenerEquipamientosPorIndices(
        personaje?.equipment
          .filter(eq => eq.equipped)
          .map(eq => eq.index) ?? []
      )
      .forEach(armor => {
        if (armor.armor.category === 'Escudo') {
          shield += armor?.armor?.class?.base ?? 0
        } else {
          CA = armor?.armor?.class?.base ?? 10

          if (armor?.armor?.class?.dex_bonus) {
            CA += Math.floor((personaje?.abilities.dex/2) - 5)
          }

          armadura = true
        }
      })

    let plusSpeed = 0

    if (!armadura) {
      if (traits.includes('barbarian-unarmored-defense')) {
        CA += Math.floor((personaje?.abilities.con/2) - 5) + Math.floor((personaje?.abilities.dex/2) - 5)
      } else if (traits.includes('monk-unarmored-defense')) {
        CA += Math.floor((abilities.wis/2) - 5) + Math.floor((abilities.dex/2) - 5)
      }

      if (traits.includes('fast-movement')) {
        plusSpeed += 10
      }
      
      if (traits.includes('unarmored-movement')) {
        plusSpeed += traitsData['unarmored-movement'].FEET ?? 0
      }
    }

    const spellsData = { ...personaje?.spells }

    if (spells.length > 0) {
      spellsData[clase] = spells
    }

    if (dataLevel?.spellcasting?.all_spells) {
      const spellsAux = dataLevel?.spellcasting?.all_spells
        ? this.conjuroRepository.obtenerConjurosPorNivelClase(dataLevel?.spellcasting?.all_spells, clase)?.map((spell => spell.index))
        : []

      spellsData[clase].push(...spellsAux ?? [])
    }
 
    personaje?.subclasses?.forEach((subclase => {
      if (dataLevel?.subclasses && dataLevel?.subclasses[subclase]) {
        const nameSpells = clase + '_' + subclase
        dataLevel?.subclasses[subclase]?.spells?.forEach((spell: string) => {
          if (!spellsData[nameSpells]) {
            spellsData[nameSpells] = []
          }
          spellsData[nameSpells].push(spell)
        })
      }
    }))

    let HP = hit + Math.floor((personaje?.abilities?.con/2) - 5)

    if (traits.includes('dwarven-toughness')) {
      HP += 1
    }

    const resultado = await Personaje.findByIdAndUpdate(
      id,
      {
        $set: {
          XP: 0,
          traits_data: traitsData,
          prof_bonus: dataLevel?.prof_bonus ?? personaje?.prof_bonus,
          traits: [...personaje?.traits ?? [], ...dataLevel?.traits ?? [], ...traitsSubclase ?? []],
          invocations,
          disciplines: actualDisciplines,
          spells: spellsData,
          plusSpeed,
          abilities,
          CA: CA + shield,
          subclasses: [...personaje?.subclasses ?? [], ...subclases ?? []]
        },
        $inc: { 
          'classes.$[elem].level': 1,
          HPMax: HP,
          HPActual: HP
        }
      },
      {
        arrayFilters: [{ 'elem.class': clase }],
        new: true 
      }
    );
     
/*  if (!resultado) {
      console.log('No se encontró el personaje o no se realizó la actualización.');
    } else {
      console.log('Actualización exitosa:', resultado);
    }*/
    
    return {
      basic: this.formatearPersonajeBasico(resultado)
    }
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

  async equiparArmadura(data: any): Promise<any> {
    
    const { id, equip, nuevoEstado } = data
    const personaje = await Personaje.findById(id);

    const equipment = personaje?.equipment ?? []

    const idx = equipment.findIndex(eq => eq.index === equip)
    
    let armadura = false
    let CA = 10
    let shield = 0

    if (idx > -1) {
      if (equip === 'shield') {
        equipment.forEach(item => {
          if (item.index === "shield") {
            item.equipped = false;
          }
        });
      } else {
        equipment.forEach(item => {
          if (item.index !== "shield") {
            item.equipped = false;
          }
        });
      }

      equipment[idx].equipped = nuevoEstado

      this.equipamientoRepository
        .obtenerEquipamientosPorIndices(
          equipment
            .filter(eq => eq.equipped)
            .map(eq => eq.index)
        )
        .forEach(armor => {
          if (armor.armor.category === 'Escudo') {
            shield += armor?.armor?.class?.base ?? 0
          } else {
            CA = armor?.armor?.class?.base ?? 10

            if (armor?.armor?.class?.dex_bonus) {
              CA += Math.floor((personaje?.abilities.dex/2) - 5)
            }

            armadura = true
          }
        })
    }

    let plusSpeed = 0

    if (!armadura) {
      if (!armadura && personaje?.traits.includes('barbarian-unarmored-defense')) {
        CA += Math.floor((personaje?.abilities.con/2) - 5) + Math.floor((personaje?.abilities.dex/2) - 5)
      } else if (personaje?.traits.includes('monk-unarmored-defense')) {
        CA += Math.floor((personaje?.abilities.wis/2) - 5) + Math.floor((personaje?.abilities.dex/2) - 5)
      }

      if (personaje?.traits.includes('fast-movement')) {
        plusSpeed += 10
      }

      if (personaje?.traits.includes('unarmored-movement')) {
        plusSpeed += personaje?.traits_data['unarmored-movement'].FEET ?? 0
      }
    }

    const resultado = await Personaje.findByIdAndUpdate(
      id,
      {
        $set: {
          equipment,
          CA: CA + shield,
          plusSpeed
        }
      },
      { new: true }
    );

    return {
      basic: this.formatearPersonajeBasico(resultado)
    }
  }

  async updateMoney(id: string, money: number): Promise<boolean> {
    const personaje = await Personaje.findById(id);

    if (personaje) {
      await Personaje.findByIdAndUpdate(
        id,
        {
          $set: {
            money
          }
        },
        { new: true }
      );
      return true
    } else {
      return false
    }
  }
    
  async formatearPersonaje(personaje: any): Promise<any> {
    const level = personaje.classes.map((cl: any) => cl.level).reduce((acumulador: number, valorActual: number) => acumulador + valorActual, 0)
  
    const traits = this.rasgoRepository.obtenerRasgosPorIndices(personaje?.traits)

    console.log('Fin obtenerRasgosPorIndices')

    console.log(traits)

    const traitsData = traits?.map(trait => {
      console.log(trait)
      const data = personaje?.traits_data ? personaje?.traits_data[trait.index] : null

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

    console.log('Fin traitsData')
   
    const skills:string[] = personaje?.skills

    const idiomas = this.idiomaRepository
      .obtenerIdiomasPorIndices(personaje?.languages)
      .map(idioma => idioma.name)

    const proficienciesId = personaje?.proficiencies ?? []
    const weaponsId = personaje?.proficiency_weapon ?? []
    const armorId = personaje?.proficiency_armor ?? []
    let speed = personaje?.speed
      
      traits.forEach(trait => {
        if (trait?.skills) {
          skills.push(...trait?.skills)
        }
  
        if (trait?.proficiencies) {
          proficienciesId.push(...trait?.proficiencies)
        }
  
        if (trait?.proficiencies_weapon) {
          weaponsId.push(...trait?.proficiencies_weapon)
        }
  
        if (trait?.proficiencies_armor) {
          armorId.push(...trait?.proficiencies_armor)
        }
  
        if (trait?.speed) {
          speed = trait?.speed
        }
      })
  
      const habilidades = this.habilidadRepository
        .obtenerHabilidades()
        .map(habilidad => {
          return {
            ...habilidad,
            competencia: personaje?.double_skills?.includes(habilidad?.index)
              ? 2
              : skills?.includes(habilidad?.index) ? 1 : 0
          }
        })
        .sort((a, b) => {
          return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
        })
  
      const proficiencies = this.competenciaRepository
        .obtenerCompetenciasPorIndices(proficienciesId.filter((valor: any, indice: any, self: any) => self.indexOf(valor) === indice))
        .map(proficiency => proficiency.name) 
  
      
      const indexSetWeapons = new Set(weaponsId);
  
      const weapons = this.competenciaRepository
        .obtenerCompetenciasPorIndices(weaponsId.filter((valor: any, indice: any, self: any) => self.indexOf(valor) === indice))
        .filter(item => 
          !item.desc.some(descItem => indexSetWeapons.has(descItem))
        )
        .map(weapon => weapon.name)
  
      const armors = this.competenciaRepository
        .obtenerCompetenciasPorIndices(armorId.filter((valor: any, indice: any, self: any) => self.indexOf(valor) === indice))
        .map(armor => armor.name)
  
      const equipo = this.equipamientoRepository.obtenerEquipamientosPorIndices(personaje.equipment.map((eq: any) => eq.index))
  
      personaje.equipment.forEach((equip: any) => {
        const idx = equipo.findIndex(eq => eq.index === equip.index)
        equipo[idx].quantity = equip.quantity
        equipo[idx].equipped = equip.equipped
  
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
  
      const clases = await Promise.all(
        personaje.classes.map(async (clase: any) => {
          const claseData = await this.claseRepository.getClase(clase.class)
    
          return {
            class: clase.class,
            level: clase.level,
            name: clase.name,
            hit_die: claseData?.hit_die
          }
        })
      )
  
      const spells = { ...personaje.spells }
  
      await Promise.all(
        Object.keys(spells).map(async groupSpells => {
          const dataSpells = [...spells[groupSpells]]
          let type = ''
          const list = dataSpells.map((spell: string) => {
            const spellArray = spell.split('_')
            type = spellArray[1]
  
            return spellArray[0]
          })
  
          const dataList = this.conjuroRepository.obtenerConjurosPorIndices(list)
  
          spells[groupSpells] = {
            list: [],
            type: caracteristicas[type] ?? ''
          }
  
          dataList
            .sort((a: any, b: any) => {
              return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
            })
            .forEach(spell => {
              spells[groupSpells].list.push(spell)
            })
  
          const claseData = await this.claseRepository.getClase(groupSpells)
  
          if (claseData) {
            spells[groupSpells].spellcasting = claseData.spellcasting
  
            const level = personaje.classes.find((clas: any) => clas.class === groupSpells).level
  
            if (level) {
              spells[groupSpells].slots = claseData?.levels?.find((l: any) => l.level === level)?.spellcasting?.spell_slots
              spells[groupSpells].level = claseData?.levels?.find((l: any) => l.level === level)?.spellcasting?.spell_level
              
              spells[groupSpells].slots_level_1 = claseData?.levels?.find((l: any) => l.level === level)?.spellcasting?.spell_slots_level_1
              spells[groupSpells].slots_level_2 = claseData?.levels?.find((l: any) => l.level === level)?.spellcasting?.spell_slots_level_2
              spells[groupSpells].slots_level_3 = claseData?.levels?.find((l: any) => l.level === level)?.spellcasting?.spell_slots_level_3
              spells[groupSpells].slots_level_4 = claseData?.levels?.find((l: any) => l.level === level)?.spellcasting?.spell_slots_level_4
              spells[groupSpells].slots_level_5 = claseData?.levels?.find((l: any) => l.level === level)?.spellcasting?.spell_slots_level_5
              spells[groupSpells].slots_level_6 = claseData?.levels?.find((l: any) => l.level === level)?.spellcasting?.spell_slots_level_6
              spells[groupSpells].slots_level_7 = claseData?.levels?.find((l: any) => l.level === level)?.spellcasting?.spell_slots_level_7
              spells[groupSpells].slots_level_8 = claseData?.levels?.find((l: any) => l.level === level)?.spellcasting?.spell_slots_level_8
              spells[groupSpells].slots_level_9 = claseData?.levels?.find((l: any) => l.level === level)?.spellcasting?.spell_slots_level_9
            }
          }
  
          return null
        })
      )
  
      await this.invocacionRepository.inicializar()
      await this.disciplinaRespository.init()
  
      const invocationsData = await this.invocacionRepository.obtenerInvocacionesPorIndices(personaje?.invocations ?? [])
      const disciplinesData = await this.disciplinaRespository.obtenerDisciplinasPorIndices(personaje?.disciplines ?? [])
   
      return {
        id: personaje._id.toString(),
        img: personaje.img,
        name: personaje.name,
        race: personaje.race,
        classes: clases,
        subclasses: personaje.subclasses,
        appearance: personaje?.appearance,
        background: personaje?.background,
        level,
        XP: personaje.XP,
        XPMax: nivel[level-1],
        abilities: personaje?.abilities,
        HPMax: personaje?.HPMax,
        CA: personaje?.CA,
        speed: speed + personaje?.plusSpeed,
        skills: habilidades,
        languages: idiomas,
        weapons,
        armors,
        proficiencies,
        traits: traitsData,
        invocations: invocationsData,
        disciplines: disciplinesData,
        prof_bonus: personaje.prof_bonus,
        saving_throws: personaje.saving_throws,
        equipment: equipo,
        money: personaje?.money ?? 0,
        spells
      }
  }

  async crearPdf(idUser: number, idCharacter: string): Promise<any> {
    const personaje = await Personaje.findById(idCharacter);

    const personajeData = await this.formatearPersonaje(personaje)

    return this.generarPdf(personajeData, idUser)
  }

  sumaDaño(character: any, equip: any) {
    let suma = 0

    if (equip.weapon.properties.find((prop: any) => prop.index === 'finesse')) {
      const max = Math.max(character?.abilities?.str, character?.abilities?.dex)

      suma += Math.floor((max/2) - 5)
    } else if (equip.weapon.range === 'Distancia') {
      suma += Math.floor((character?.abilities?.dex/2) - 5)
    } else {
      suma += Math.floor((character?.abilities?.str/2) - 5)
    }

    return suma
  } 

  sumaGolpe(character: any, equip: any) {
    let suma = 0
    
    suma += this.sumaDaño(character, equip)

    if (character?.weapons?.some((arma: any) => arma.includes(equip?.weapon?.category?.toLowerCase()))) {
      suma += character?.prof_bonus ?? 0
    }

    return suma
  }

  async generarPdf(personaje: any, idUser: number): Promise<any> {
    //const pdfPath = path.join(__dirname, '../../../../utils/hoja-nueva.pdf');
    const pdfPath = path.join(process.cwd(), 'src/utils/hoja-nueva.pdf');
    const existingPdfBytes = fs.readFileSync(pdfPath);

    const datos: any = {
      acrobatics: ["acroPROF", "Acrobatics"],
      athletics: ["athPROF", "Athletics"],
      arcana: ["arcanaPROF", "Arcana"],
      deception: ["decepPROF", "Deception"],
      history: ["histPROF", "History"],
      performance: ["perfPROF", "Performance"],
      intimidation: ["intimPROF", "Intimidation"],
      investigation: ["investPROF", "Investigation"],
      "sleight-of-hand": ["sohPROF", "SleightofHand"],
      medicine: ["medPROF", "Medicine"],
      nature: ["naturePROF", "Nature"],
      perception: ["perPROF", "Perception"],
      insight: ["insightPROF", "Insight"],
      persuasion: ["persPROF", "Persuasion"],
      religion: ["religPROF", "Religion"],
      stealth: ["stealthPROF", "Stealth"],
      survival: ["survPROF", "Survival"],
      "animal-handling": ["anhanPROF", "AnHan"]
    }

    // Cargar el documento PDF
    const originalPdf = await PDFDocument.load(existingPdfBytes);

    try {
      // Obtener el formulario del PDF
      const form = originalPdf.getForm();
      /*
      const fields = form.getFields();
      fields.forEach((field: any) => {
        const fieldName = field.getName(); // Nombre del campo
        const fieldType = field.constructor.name; // Tipo del campo
        //if (fieldName.includes('Dice')) {
          console.log(`Nombre: ${fieldName}, Tipo: ${fieldType}`);
        //}
      });*/
      //console.log('_________________');

      const usuario = await this.usuarioRepository.nombreUsuario(idUser)

      const background = personaje?.background?.name + ( personaje?.background?.type ? ' (' + personaje?.background?.type + ')' : '')
 
      form.getTextField('CharacterName').setText(personaje?.name);
      form.getTextField('ClassLevel').setText(personaje?.classes?.map((cl: any) => cl?.name + ' ' + cl?.level)?.join(', '));
      form.getDropdown('Background').addOptions([background]);
      form.getDropdown('Background').select(background);
      form.getTextField('PlayerName').setText(usuario);
      form.getDropdown('Race').addOptions([personaje?.race]);
      form.getDropdown('Race').select(personaje?.race);
      form.getDropdown('Alignment').addOptions(['']);
      form.getDropdown('Alignment').select('');
      form.getTextField('ExperiencePoints').setText(personaje?.XP + '/' + personaje?.XPMax);

      form.getTextField('CharacterName 2').setText(personaje?.name);
      form.getTextField('Age').setText(personaje?.appearance?.age + ' años');
      form.getTextField('Eyes').setText(personaje?.appearance?.eyes);
      form.getTextField('Height').setText(personaje?.appearance?.height + ' cm');
      form.getTextField('Skin').setText(personaje?.appearance?.skin);
      form.getTextField('Weight').setText(personaje?.appearance?.weight + ' kg');
      form.getTextField('Hair').setText(personaje?.appearance?.hair);

      const abilities = ['str', 'dex', 'con', 'int', 'wis', 'cha']
      
      const bonus: {[key: string]: number} = {
        str: Math.floor((personaje?.abilities?.str/2) - 5),
        dex: Math.floor((personaje?.abilities?.dex/2) - 5),
        con: Math.floor((personaje?.abilities?.con/2) - 5),
        int: Math.floor((personaje?.abilities?.int/2) - 5),
        wis: Math.floor((personaje?.abilities?.wis/2) - 5),
        cha: Math.floor((personaje?.abilities?.cha/2) - 5)
      }

      abilities.forEach(ability => {
        form.getTextField(ability.toUpperCase() + 'score').setText(personaje?.abilities[ability] + '');
        form.getTextField(ability.toUpperCase() +'bonus').setText(this.formatNumber(bonus[ability]) + '');

        if (personaje?.saving_throws?.includes(ability)) {
          form.getCheckBox(ability.toUpperCase() + 'savePROF').check()
          form.getTextField(ability.toUpperCase() + 'save').setText(this.formatNumber(bonus[ability] + personaje?.prof_bonus) + '');
        } else {
          form.getTextField(ability.toUpperCase() + 'save').setText(this.formatNumber(bonus[ability]) + '');
        }
      })

      personaje?.skills?.forEach((skill: any) => {
        if (skill?.competencia) {
          form.getCheckBox(datos[skill?.index][0]).check()
          form.getTextField(datos[skill?.index][1]).setText(this.formatNumber(bonus[skill.ability_score] + (personaje?.prof_bonus * skill?.competencia)) + '');
        } else {
          form.getTextField(datos[skill?.index][1]).setText(this.formatNumber(bonus[skill.ability_score]) + '');
        }
      })
 
      if(personaje?.equipment?.find((equi: any) => equi.name === 'Escudo' && equi.equipped)) {
        form.getCheckBox('shieldyes').check();
      }

      const monkTrait = personaje?.traits?.find((trait: any) => trait.index==='martial-arts')
      let golpeCuerpo = 0

      if (monkTrait) {
        const dado = parseInt(monkTrait?.desc?.split('1d')[1][0])
        const max = Math.max(personaje?.abilities?.str, personaje?.abilities?.dex)
        const daño = Math.floor((max/2) - 5)

        form.getTextField('Attack1').setText('Cuerpo a cuerpo');
        form.getTextField('AtkBonus1').setText('+' + ((personaje?.prof_bonus ?? 0) + daño));
        form.getTextField('Damage1').setText('1d' + dado + ' +' + daño);
        golpeCuerpo = 1
      }

      personaje?.equipment
        ?.filter((equi: any) => equi?.category === 'Arma')
        ?.forEach((equi: any, index: number) => {
          if (index+golpeCuerpo < 3) {
            form.getTextField('Attack' + (index+golpeCuerpo+1)).setText(equi.name);
            form.getTextField('AtkBonus' + (index+golpeCuerpo+1)).setText('+' + this.sumaGolpe(personaje, equi));
            form.getTextField('Damage' + (index+golpeCuerpo+1)).setText(equi?.weapon?.damage?.dice + ' +' + this.sumaDaño(personaje, equi) + ' ' + equi?.weapon?.damage?.name);
          }
        })

      form.getTextField('Copper').setText(Math.floor(personaje?.money % 10) + '');
      form.getTextField('Silver').setText(Math.floor((personaje?.money / 10)) % 10 + '');
      form.getTextField('Electrum').setText('0');
      form.getTextField('Gold').setText(Math.floor(personaje?.money / 100) + '');
      form.getTextField('Platinum').setText('0');
      
      form.getTextField('HPMax').setText(personaje?.HPMax + '');
      form.getTextField('ProfBonus').setText('+' + personaje?.prof_bonus);
      form.getTextField('AC').setText(personaje?.CA + '');
      form.getTextField('Init').setText(this.formatNumber(bonus.dex) + '');
      form.getTextField('Speed').setText(personaje?.speed + '');

      form.getTextField('HitDiceTotal').setText(personaje.classes?.map((clase: any) => clase.level + 'd' + clase.hit_die)?.join(' / ') + '');
      //form.getTextField('Text1').setText(personaje.classes?.map((clase: any) => 'd' + clase.hit_die)?.join(' / ') + '');

      if (personaje?.skills?.find((skill: any) => skill?.index === 'perception' && skill?.competencia)) {
        form.getTextField('PWP').setText(10 + bonus.dex + personaje?.prof_bonus + '');
      } else {
        form.getTextField('PWP').setText(10 + bonus.dex + '');
      }

      escribirRasgos({
        traits: personaje?.traits,
        invocations: personaje?.invocations,
        pdfDoc: originalPdf
      })

      escribirCompetencias({
        pdfDoc: originalPdf,
        languages: personaje?.languages, 
        weapons: personaje?.weapons, 
        armors: personaje?.armors, 
        proficiencies: personaje?.proficiencies
      })

      escribirTransfondo({
        pdfDoc: originalPdf,
        background: personaje?.background
      })

      escribirEquipo({
        pdfDoc: originalPdf,
        equipment: personaje?.equipment,
        personaje,
        form
      })

      escribirOrganizaciones({
        pdfDoc: originalPdf,
        personaje,
        form
      })

      escribirConjuros({
        form: form,
        personaje
      })

      // Descargar la imagen usando axios
      const imageResponse = await axios.get(personaje?.img, { responseType: 'arraybuffer' });
      const imageBytes = imageResponse.data; // Obtener los bytes de la imagen

      // Insertar la imagen (soporta PNG y JPG)
      const image = await originalPdf.embedJpg(imageBytes);

      // Obtener la posición y tamaño del botón
      const page = originalPdf.getPage(1); // Página donde está el botón

      page.drawImage(image, {
        x: 39,
        y: 490,
        width: 155,
        height: 155,
      });
      
      // También puedes desactivar la edición si quieres bloquear el PDF después de llenarlo
      form.flatten();
 
    } catch (e) {
      console.log(e)
    }

    // Crear un nuevo documento
    const nuevoPdf = await PDFDocument.create();

    // Copiar las primeras 3 páginas
    const [pag1, pag2, pag3] = await nuevoPdf.copyPages(originalPdf, [0, 1, 2]);

    nuevoPdf.addPage(pag1);
    nuevoPdf.addPage(pag2);
    nuevoPdf.addPage(pag3);

    const pdfBytes = await nuevoPdf.save();
  
    return pdfBytes
  }

  formatNumber(num: any) {
    return (num >= 0 ? "+" : "") + num.toString();
  }
}
