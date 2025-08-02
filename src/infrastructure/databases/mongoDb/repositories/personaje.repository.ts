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
import { escribirCompetencias, escribirConjuros, escribirEquipo, escribirOrganizaciones, escribirRasgos, escribirTransfondo } from '../../../../utils/escribirPdf';
import axios from 'axios';
import IUsuarioRepository from '../../../../domain/repositories/IUsuarioRepository';
import UsuarioRepository from './usuario.repository';
import IConjuroRepository from '../../../../domain/repositories/IConjuroRepository';
import ConjuroRepository from './conjuros.repository';
import { formatearOptions } from '../../../../utils/formatters';
import IInvocacionRepository from '../../../../domain/repositories/IInvocacionRepository';
import InvocacionRepository from './invocacion.repository';
import { PersonajeBasico, PersonajeMongo, TypeCrearPersonaje, TypeSubirNivel } from '../../../../domain/types/personajes';
import DisciplinaRepository from './disciplina.repository';
import IDisciplinaRepository from '../../../../domain/repositories/IDisciplinaRepository';
import IMetamagiaRepository from '../../../../domain/repositories/IMetamagiaRepository';
import MetamagiaRepository from './metamagia.repository';
import Campaña from '../schemas/Campaña';
import { DañoApi } from '../../../../domain/types';
import IDoteRepository from '../../../../domain/repositories/IDoteRepository';
import DoteRepository from './dote.repository';
import ICampañaRepository from '../../../../domain/repositories/ICampañaRepository';
import CampañaRepository from './campaña.repository';
import { ClaseLevelUp, SubclasesOptionsApi } from '../../../../domain/types/clases';

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

const nameTraits: any = {
  "totemic-spirit-bear": "Furia"
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
  usuarioRepository: IUsuarioRepository
  conjuroRepository: IConjuroRepository
  invocacionRepository: IInvocacionRepository
  disciplinaRespository: IDisciplinaRepository
  metamagiaRepository: IMetamagiaRepository
  doteRepository: IDoteRepository

  constructor() {
    super()
    this.razaRepository = new RazaRepository()
    this.claseRepository = new ClaseRepository()
    this.habilidadRepository = new HabilidadRepository()
    this.idiomaRepository = new IdiomaRepository()
    this.competenciaRepository = new CompetenciaRepository()
    this.conjuroRepository = new ConjuroRepository()
    this.equipamientoRepository = new EquipamientoRepository()
    this.dañoRepository = new DañoRepository()
    this.rasgoRepository = new RasgoRepository(/*this.conjuroRepository,*/ this.dañoRepository)
    this.propiedadArmaRepository = new PropiedadArmaRepository()
    this.usuarioRepository = new UsuarioRepository()
    this.invocacionRepository = new InvocacionRepository()
    this.disciplinaRespository = new DisciplinaRepository(this.conjuroRepository)
    this.metamagiaRepository = new MetamagiaRepository()
    this.doteRepository = new DoteRepository()
  }

  async crear(data: TypeCrearPersonaje) {
    const {
      name,
      user,
      background,
      img,
      speed,
      size,
      appearance,
      abilities,
      race,
      raceId,
      subraceId,
      type,
      campaign,
      languages,
      spells,
      skills,
      double_skills,
      claseId,
      clase,
      saving_throws,
      proficiencies,
      subclase,
      equipment,
      traits,
      traits_data,
      money,
      dotes,
      hit_die,
      prof_bonus
    } = data

    const dataBackground = { 
      ...background,
      history: background?.history?.split(/\r?\n/) ?? []
    }

    let HP = hit_die ?? 1

    if (traits.includes('dwarven-toughness') || traits.includes('draconid-resistance')) {
      HP += 1
    }

    HP += Math.floor((abilities.con/2) - 5)

/*
    let CA = 10

    if (traits.includes('barbarian-unarmored-defense')) {
      CA += Math.floor((abilities.con/2) - 5) + Math.floor((abilities.dex/2) - 5)
    } else if (traits.includes('monk-unarmored-defense')) {
      CA += Math.floor((abilities.wis/2) - 5) + Math.floor((abilities.dex/2) - 5)
    } else if (traits.includes('draconid-resistance')) {
      CA += 3 + Math.floor((abilities.dex/2) - 5)
    }*/

    const equipmentData: any[] = []
    const equipmentList = [...equipment, /*...claseData?.starting_equipment ?? []*/]

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

    const moneyAux: any = {
      pc: 0,
      pp: 0,
      pe: 0,
      po: 0,
      ppt: 0
    }

    if (moneyAux[money?.unit] !== undefined) {
      moneyAux[money.unit] = money?.quantity ?? 0
    }
/*
    const spellsClaseAux = claseDataLevel?.spellcasting?.all_spells
      ? await this.conjuroRepository.obtenerConjurosPorNivelClase(claseDataLevel?.spellcasting?.all_spells, clase)
      : []

    const spellsClase = spellsClaseAux.map(conjuro => conjuro.index)
 
    if (spellsClase?.length > 0) {
      spells[clase].push(...spellsClase)
    }

    if (subclaseData?.spells?.length > 0) {
      if (!spells[clase + '_' + subclase]) {
        spells[clase + '_' + subclase] = []
      }

      spells[clase + '_' + subclase].push(...subclaseData?.spells ?? [])
    }
*/ 
    const personaje = new Personaje({
      name,
      user,
      img,
      background: dataBackground,
      appearance,
      abilities,
      raceId: raceId,
      subraceId: subraceId,
      type,
      campaign,
      classes: [{ class: claseId, name: clase ?? "Ninguna", level: 1, hit_die }],
      subclasses: subclase ? [subclase] : [],
      race: race,
      traits,
      traits_data: { ...traits_data/*, ...claseDataLevel?.traits_data*/},
      prof_bonus: prof_bonus ?? 0,
      speed,
      plusSpeed: 0,
      size,
      languages: [...languages ?? []],
      saving_throws: saving_throws ?? [],
      skills: [...skills ?? []],
      double_skills,
      proficiencies,
      spells,
      equipment: equipmentData,
      dotes,
      money: moneyAux,
      HPMax: HP,
      HPActual: HP,
      XP: 0 
    })     

    const resultado = await personaje.save()

    if (resultado) {
      return await this.formatearPersonajeBasico(resultado)
    } else {
      return null
    }
  }

  async consultarPersonajesUser(id: string): Promise<PersonajeBasico[]> {
    const personajes = await Personaje.find({ user: id });

    return this.formatearPersonajes(personajes)
  }

  async consultarPersonajes(indexList: string[]): Promise<PersonajeBasico[]> {
    const personajes = await Promise.all(indexList.map(index => {
      return this.consultarPersonajeBasico(index)
    }))

    const personajesAux = personajes.filter(personaje => personaje !== null)

    personajesAux.sort((a, b) => {
      if (a.name < b.name) {
        return -1;
      }
      if (a.name > b.name) {
        return 1;
      }
      return 0;
    });

    return personajesAux
  }

  async consultarPersonajeBasico(id: string): Promise<PersonajeBasico | null> {
    const personaje = await Personaje.findById(id);

    if (personaje) {
      return await this.formatearPersonajeBasico(personaje)
    } else {
      return null
    }
  }

  async formatearPersonajes(personajes: PersonajeMongo[]): Promise<PersonajeBasico[]> {
    const formateadas = await Promise.all(personajes.map(personaje => this.formatearPersonajeBasico(personaje)))
    const formateadasAux = formateadas.filter(personaje => personaje !== null)

    formateadasAux
      .sort((a, b) => {
        if (a.name < b.name) {
          return -1;
        }
        if (a.name > b.name) {
          return 1;
        }
        return 0;
      });

    return formateadasAux;
  }

  async formatearPersonajeBasico(personaje: PersonajeMongo): Promise<PersonajeBasico | null> {
    if (personaje) {
      const level = personaje?.classes?.map((cl: any) => cl.level).reduce((acumulador: number, valorActual: number) => acumulador + valorActual, 0) ?? 0

      const user = await this.usuarioRepository.nombreUsuario(personaje?.user ?? null)
      const { CA } = await this.calcularCA(personaje)
      const campaña = await Campaña.findById(personaje?.campaign)
  
      return {
        id: personaje?._id?.toString() ?? '',
        img: personaje.img,
        name: personaje.name,
        user,
        race: personaje.race,
        campaign: campaña?.name ?? '',
        classes: personaje?.classes?.map((clas: any) => { return { name: clas.name, level: clas.level }}) ?? [],
        CA,//personaje.CA,
        HPMax: personaje.HPMax,
        HPActual: personaje.HPActual,
        XP: personaje.XP,
        XPMax: nivel[level-1]
      }
    } else {
      return null
    }
  }

  async calcularCA(personaje: PersonajeMongo) {
    let armadura = false
    let armaduraPesada = false
    let CA = 10
    let shield = 0

    let plusSpeed = 0

    const equipment = await this.equipamientoRepository.obtenerEquipamientosPorIndices(personaje.equipment.filter(eq => eq.equipped).map(eq => eq.index))

    equipment.forEach(equip => {
      const armor = { ...equip, ...personaje.equipment.find(eq => eq.equipped && eq.index===equip.index) }
      if (armor?.armor?.category === 'Escudo') {
        shield += armor?.armor?.class?.base ?? 0
        
        if (armor.isMagic) {
          shield += 1
        }
      } else {
        CA = armor?.armor?.class?.base ?? 10

        if (armor.isMagic) {
          CA += 1
        }

        if (armor?.armor?.class?.dex_bonus) {
          CA += Math.max(Math.min(Math.floor((personaje?.abilities.dex/2) - 5), armor?.armor?.class?.max_bonus ?? 99), 0)
        }

        armadura = true

        if (armor.armor?.category === "Pesada") {
          armaduraPesada = true
        }
      }

      
    })

    if (!armadura) {
      if (personaje.traits.includes('barbarian-unarmored-defense')) {
        CA += Math.floor((personaje?.abilities.con/2) - 5) + Math.floor((personaje?.abilities.dex/2) - 5)
      } else if (personaje.traits.includes('monk-unarmored-defense')) {
        CA += Math.floor((personaje.abilities.wis/2) - 5) + Math.floor((personaje.abilities.dex/2) - 5)
      } else if (personaje.traits.includes('draconid-resistance')) {
        CA += 3 + Math.floor((personaje.abilities.dex/2) - 5)
      }
    }

    if (!armaduraPesada) {

      if (personaje.traits.includes('fast-movement')) {
        plusSpeed += 10
      }
      
      /*if (traits.includes('unarmored-movement')) {
        plusSpeed += traitsData['unarmored-movement'].FEET ?? 0
      }*/
    }


    return {
      CA: CA + shield,
      plusSpeed
    }
  }

  calcularAbilites(personaje: PersonajeMongo) {
    const { abilities } = personaje

    if (personaje?.traits?.includes('primal-champion')) {
      abilities.str += 4
      abilities.con += 4
    }

    return abilities
  }
  
  async consultarPersonaje(idUser: string, idCharacter: string): Promise<any> {
    const personaje = await Personaje.findById(idCharacter);

    if (personaje?.user === idUser) {
      return this.formatearPersonaje(personaje)
    } else if (personaje?.campaign) {
      const campaña = await Campaña.findById(personaje?.campaign)

      if (campaña?.master === idUser) {
        return this.formatearPersonaje(personaje)
      } else {
        throw new Error('No tienes permiso para consultar este personaje');
      }
    } else {
      throw new Error('No tienes permiso para consultar este personaje');
    }
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

    if (resultado) {
      const personaje = await this.formatearPersonajeBasico(resultado)
  
      return {
        basic: personaje
      }
    } else {
      return null
    }
  }

  async subirNivelDatos(data: any): Promise<ClaseLevelUp> {
    const { id, clase } = data

    const personaje = await Personaje.findById(id);
    const level = personaje?.classes?.find(clas => clas.class === clase)?.level ?? 0

    const dataLevel = await this.claseRepository.dataLevelUp(clase, level+1, personaje?.subclasses ?? [])
/*
    const claseData = await this.claseRepository.getClase(clase)

    const dataLevel:any[] = []//claseData.levels.find((l:any)=> l.level === level+1)
    const dataLevelOld:any[] = []//claseData.levels.find((l:any)=> l.level === level)

    //const subclasesData = await this.claseRepository.formatearSubclasesType(dataLevel.subclasses_options, dataLevel.subclasses)
    
    const traits: any[] = []

    //await this.rasgoRepository.init()
    /* 
    if (dataLevel?.traits_data) {
      Object.keys(dataLevel?.traits_data).forEach(async t => {
        const data = dataLevel.traits_data[t]
        const dataOld = dataLevelOld?.traits_data ? dataLevelOld?.traits_data[t] : null
  
        if (this.valoresNumericosDistintos(data, dataOld)) {
          const trait = await this.rasgoRepository.obtenerRasgoPorIndice(t)
        
          let desc: string = trait?.desc ?? ''
    
          Object.keys(data).forEach(d => {
            desc = desc.replaceAll(d, data[d])
          })
  
          traits.push({ ...trait, desc })
        }
      })
    }

    const rasgos = await this.rasgoRepository
        .obtenerRasgosPorIndices(
          dataLevel.traits?.filter((t: any) => !traits.map(trait => trait.index).includes(t))
        )
    
    traits.push(rasgos)
*/
    //let traits_options = null
/*
    if (dataLevel?.traits_options) {
      traits_options = dataLevel?.traits_options

      if (traits_options) {
        traits_options.options = this.rasgoRepository.obtenerRasgosPorIndices(dataLevel?.traits_options?.options ?? [])
      }
    }

    const spells = dataLevel?.spellcasting?.all_spells
      ? await this.conjuroRepository.obtenerConjurosPorNivelClase(dataLevel?.spellcasting?.all_spells, clase)
      : []
*/
    /*let disciplines_new_number = 0
    let disciplines_new = null

    let disciplines_change_number = 0
    let disciplines_change = null
/*
    if (dataLevel?.subclasses) {
      personaje?.subclasses?.forEach(async s => {
        if (dataLevel?.subclasses[s]?.traits_data) {
          Object.keys(dataLevel?.subclasses[s]?.traits_data).forEach(async t => {
            const data = dataLevel?.subclasses[s]?.traits_data[t]
            const dataOld = dataLevelOld?.traits_data ? dataLevelOld?.traits_data[t] : null
      
            if (this.valoresNumericosDistintos(data, dataOld)) {
              const trait = await this.rasgoRepository.obtenerRasgoPorIndice(t)
            
              let desc: string = trait?.desc ?? ''
        
              Object.keys(data).forEach(d => {
                desc = desc.replaceAll(d, data[d])
              })
      
              traits.push({ ...trait, desc })
            }
          })
        }

        if (dataLevel?.subclasses[s]?.traits) {
          const rasgo = await this.rasgoRepository
              .obtenerRasgosPorIndices(
                dataLevel?.subclasses[s]?.traits?.filter((t: any) => !traits.map(trait => trait.index).includes(t))
              )
          traits.push(...rasgo)
        }
  
        if (dataLevel?.subclasses[s]?.traits_options) {
          traits_options = dataLevel?.subclasses[s]?.traits_options
     
          if (traits_options) {
            traits_options.options = this.rasgoRepository.obtenerRasgosPorIndices(dataLevel?.subclasses[s]?.traits_options?.options ?? [])
          }
        }

        if (dataLevel?.subclasses[s]?.spells) {
          const conjuros = await this.conjuroRepository.obtenerConjurosPorIndices(dataLevel?.subclasses[s]?.spells) ?? []
          spells.push(...conjuros ?? [])
        }

        if (dataLevel?.subclasses[s]?.disciplines_new) {
          disciplines_new_number = dataLevel?.subclasses[s]?.disciplines_new
        }

        if (dataLevel?.subclasses[s]?.disciplines_change) {
          disciplines_change_number = dataLevel?.subclasses[s]?.disciplines_change
        }
      })
    }
*//*
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
/*
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
*/
    //let metamagic = null
/*
    if (dataLevel.metamagic_new) {
      await this.metamagiaRepository.init()

      metamagic = {
          choose: dataLevel.metamagic_new,
          options: this.metamagiaRepository.obtenerTodos()
        } 
    }
*/
 
    return {
      hit_die: dataLevel?.hit_die ?? 0,
      prof_bonus: dataLevel?.prof_bonus ?? 0,
      traits: dataLevel?.traits ?? [],
      traits_data: dataLevel?.traits_data ?? {},
      traits_options: dataLevel?.traits_options ?? undefined,
      subclasesData: dataLevel?.subclasesData ?? null,
      ability_score: dataLevel?.ability_score ?? false,
      
      
      /*
      traits_options,
      //spellcasting_options: formatearOptions(dataLevel?.spellcasting?.options ?? [], this.idiomaRepository, this.competenciaRepository, this.habilidadRepository, this.conjuroRepository),
      //spellcasting_changes: formatearOptions(dataLevel?.spellcasting?.change ?? [], this.idiomaRepository, this.competenciaRepository, this.habilidadRepository, this.conjuroRepository),
      invocations,
      invocations_change,
      disciplines_new,
      disciplines_change,
      metamagic,
      //subclasesData,
      //spells
    */}
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

  async subirNivel(data: TypeSubirNivel): Promise<{ basic: PersonajeBasico | null } | null> {
    const id = data.id

    const { hit, clase, traits, traits_data, prof_bonus, subclase, abilities, /*, spells, invocations, disciplines, metamagic*/ } = data.data

    const personaje = await Personaje.findById(id);
    //const level = personaje?.classes?.find(clas => clas.class === clase)?.level ?? 0

    //const claseData = await this.claseRepository.getClase(clase)
    //const dataLevel = claseData.levels.find((l:any)=> l.level === level+1)
    
    //let dataTraitsSubclases = {}
    //let actualDisciplines = disciplines ?? []

    //const listSubclases = [ ...personaje?.subclasses ?? [], ...subclases ?? []]
    
    /*if (dataLevel?.subclasses) {
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
    }*/
    
    //let traitsData = { ...personaje?.traits_data, traits_data /*...dataLevel?.traits_data, ...dataTraitsSubclases*/ }
/*
    traits_data?.forEach((traitData: any) => {
      traitsData = { ...traitsData, ...traitData }
    })*/
/*
    if (dataLevel?.traits?.includes('primal-champion')) {
      abilities.str += 4
      abilities.con += 4
    }
*//*
    const traitsSubclase = dataLevel?.subclasses
      ? [...subclases ?? [], ...personaje?.subclasses ?? []].map((subclase: any) => {
          return dataLevel?.subclasses[subclase]?.traits
        }).flat().filter(item => item !== undefined)
      : []

    if (trait) {
      traitsSubclase.push(trait)
    }
*/

    //let plusSpeed = 0
/*
    if (!armadura) {
      if (traits.includes('barbarian-unarmored-defense')) {
        CA += Math.floor((personaje?.abilities.con/2) - 5) + Math.floor((personaje?.abilities.dex/2) - 5)
      } else if (traits.includes('monk-unarmored-defense')) {
        CA += Math.floor((abilities.wis/2) - 5) + Math.floor((abilities.dex/2) - 5)
      } else if (traits.includes('draconid-resistance')) {
        CA += 3 + Math.floor((abilities.dex/2) - 5)
      }

      if (traits.includes('fast-movement')) {
        plusSpeed += 10
      }
      
      if (traits.includes('unarmored-movement')) {
        plusSpeed += traitsData['unarmored-movement'].FEET ?? 0
      }
    }
*/
    //const spellsData = { ...personaje?.spells }
/*
    if (spells.length > 0) {
      spellsData[clase] = spells
    }
/*
    if (dataLevel?.spellcasting?.all_spells) {
      const spellsAux = dataLevel?.spellcasting?.all_spells
        ? await this.conjuroRepository.obtenerConjurosPorNivelClase(dataLevel?.spellcasting?.all_spells, clase)
        : []

      spellsData[clase].push(...spellsAux?.map(spell => spell.index) ?? [])
    }
 *//*
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
*/
    let HP = hit + Math.floor(((personaje?.abilities?.con ?? 10)/2) - 5)

    if (traits.includes('dwarven-toughness')) {
      HP += 1
    }

    if (clase === 'sorcerer' && traits.includes('draconid-resistance')) {
      HP += 1
    }
    
    const traitsSinRepetidos = [...new Set([...personaje?.traits ?? [], ...traits ?? []])];

    const subclaseArray = subclase ? [subclase] : []

    const resultado = await Personaje.findByIdAndUpdate(
      id,
      {
        $set: {
          XP: 0,
          prof_bonus: Math.max(prof_bonus ?? 0, personaje?.prof_bonus ?? 0),
          traits: traitsSinRepetidos,
          traits_data: { ...personaje?.traits_data, ...traits_data },
          subclasses: [...personaje?.subclasses ?? [], ...subclaseArray ?? []],
          abilities,
          //invocations,
          //disciplines: actualDisciplines,
          //metamagic: [...personaje?.metamagic ?? [], ...metamagic ?? []],
          //spells: spellsData,
          //plusSpeed,
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

    if (resultado) {
      const personajeFormateado = await this.formatearPersonajeBasico(resultado)
      
      return {
        basic: personajeFormateado
      }
    } else {
      return null
    }
  }

  async añadirEquipamiento(data: any) {
    const { id, equip, cantidad, isMagic } = data
    const personaje = await Personaje.findById(id);

    const equipment = personaje?.equipment ?? []

    const idx = equipment.findIndex(eq => eq.index === equip && eq.isMagic === isMagic)

    if (idx > -1) {
      equipment[idx].quantity += cantidad 
    } else {
      equipment.push({ index: equip, quantity: cantidad, isMagic, equipped: false })
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
    const { id, equip, cantidad, isMagic } = data
    const personaje = await Personaje.findById(id);

    const equipment = personaje?.equipment ?? []

    const idx = equipment.findIndex(eq => eq.index === equip /*&& eq.isMagic === isMagic*/)

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
    const { id, equip, nuevoEstado, isMagic } = data
    const personaje = await Personaje.findById(id);

    const equipment = personaje?.equipment ?? []

    const idx = equipment.findIndex(eq => eq.index === equip && eq.isMagic === isMagic)

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
    }

    let plusSpeed = 0
/*
    if (!armadura) {
      if (personaje?.traits.includes('barbarian-unarmored-defense')) {
        CA += Math.floor((personaje?.abilities.con/2) - 5) + Math.floor((personaje?.abilities.dex/2) - 5)
      } else if (personaje?.traits.includes('monk-unarmored-defense')) {
        CA += Math.floor((personaje?.abilities.wis/2) - 5) + Math.floor((personaje?.abilities.dex/2) - 5)
      } else if (personaje?.traits.includes('draconid-resistance')) {
        CA += 3 + Math.floor((personaje?.abilities.dex/2) - 5)
      }

      if (personaje?.traits.includes('fast-movement')) {
        plusSpeed += 10
      }*/
/*
      if (personaje?.traits.includes('unarmored-movement')) {
        plusSpeed += personaje?.traits_data['unarmored-movement'].FEET ?? 0
      }*/
    //}

    const resultado = await Personaje.findByIdAndUpdate(
      id,
      {
        $set: {
          equipment,
          plusSpeed
        }
      },
      { new: true }
    );

    if (resultado) {
      const personajeFormateado = await this.formatearPersonajeBasico(resultado)
      
      return {
        basic: personajeFormateado
      }
    } else {
      return null
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

    const traits = await this.rasgoRepository.obtenerRasgosPorIndices(personaje?.traits, personaje?.traits_data)
    const skills = personaje?.skills ?? []
    
    const idiomasId = personaje?.languages ?? []
    const proficiencies = await this.competenciaRepository.obtenerCompetenciasPorIndices(personaje?.proficiencies ?? [])

    const resistances:DañoApi[] = []

    const conditional_resistances:{ name: string, resistances: DañoApi[] }[] = []
    const condition_inmunities:any[] = []
    
    let speed = personaje?.speed
      
    traits.forEach(trait => {
      if (trait?.skills) {
        skills.push(...trait?.skills)
      }

      if (trait.resistances) {
        resistances.push(...trait.resistances)
      }

      if (trait.condition_inmunities.length > 0) {
        condition_inmunities.push({
          name: trait.name,
          estados: trait?.condition_inmunities ?? []
        })
      }

      if (trait.conditional_resistances.length > 0) {
        const idx = conditional_resistances.findIndex(name => name.name === (nameTraits[trait.index] ?? trait.name))
        if (idx > -1) {
          conditional_resistances[idx].resistances = trait?.conditional_resistances ?? []
        } else {
          conditional_resistances.push({
            name: nameTraits[trait.name] ?? trait.name,
            resistances: trait?.conditional_resistances ?? []
          })
        }
      }

      /*if (trait?.proficiencies) {
        proficienciesId.push(...trait?.proficiencies)
      }*/

      if (trait?.proficiencies_weapon) {
        proficiencies.push(...trait?.proficiencies_weapon)
      }
/*
      if (trait?.languages) {
        idiomasId.push(...trait?.languages ?? [])
      }
*/
      if (trait?.proficiencies_armor) {
        proficiencies.push(...trait?.proficiencies_armor)
      }

      if (trait?.speed) {
        speed = trait?.speed
      }
    })

    const indices = new Set(proficiencies.map(item => item.index));

    // Paso 2: filtrar los que tengan en `desc` un index presente en la lista
    /**const filteredProficiencies = proficiencies.filter(item =>
      !item?.desc.some(d => indices.has(d))
    );*/

    const idiomas = await this.idiomaRepository.obtenerIdiomasPorIndices(idiomasId)
    const habilidades = await this.habilidadRepository.obtenerHabilidadesPersonaje(skills)

    const equipo = this.equipamientoRepository.obtenerEquipamientosPorIndices(personaje.equipment.map((eq: any) => eq.index))
    const equipoPersonaje:any[] = []

    personaje.equipment.forEach(async (equip: any) => {
      const idx = equipo.findIndex(eq => eq.index === equip.index)
      equipo[idx].quantity = equip.quantity
      equipo[idx].equipped = equip.equipped

      if (equipo[idx]?.category === 'Arma') {
        const daño = await this.dañoRepository.obtenerDañoPorIndice(equipo[idx]?.weapon?.damage?.type ?? '')

        if (equipo[idx].weapon) {
          if (equipo[idx]?.weapon?.damage) {
            equipo[idx].weapon.damage.name = daño?.name ?? ''
          
            if (equipo[idx].weapon.two_handed_damage) {
              const daño_two = await this.dañoRepository.obtenerDañoPorIndice(equipo[idx]?.weapon?.two_handed_damage?.type)
              equipo[idx].weapon.two_handed_damage.name = daño_two?.name ?? ''
            }
          }
          
          equipo[idx].weapon.properties = this.propiedadArmaRepository.obtenerPropiedadesPorIndices(equipo[idx]?.weapon?.properties)

          equipo[idx].weapon.properties.sort((a: any, b: any) => {
            return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
          })
        }
      }

      equipoPersonaje.push({ ...equipo[idx], isMagic: equip.isMagic })
    })

    equipoPersonaje.sort((a: any, b: any) => {
      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
    })

    const clases = personaje.classes.map((clase: any) => {
      return {
        class: clase.class,
        level: clase.level,
        name: clase.name,
        hit_die: clase.hit_die
      }
    })

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

        const dataList = await this.conjuroRepository.obtenerConjurosPorIndices(list)

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
   
        //const claseData = await this.claseRepository.getClase(groupSpells)
/*
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
        }*/

        return null
      })
    )

    //await this.invocacionRepository.inicializar()
    //await this.disciplinaRespository.init()
    //await this.metamagiaRepository.init()

    const invocationsData = await this.invocacionRepository.obtenerInvocacionesPorIndices(personaje?.invocations ?? [])
    const disciplinesData = await this.disciplinaRespository.obtenerDisciplinasPorIndices(personaje?.disciplines ?? [])
    const metamagicData = await this.metamagiaRepository.obtenerMetamagiasPorIndices(personaje?.metamagic ?? [])
    const campaign = await Campaña.findById(personaje?.campaign)
    const dotes = await this.doteRepository.obtenerDotesPorIndices(personaje?.dotes ?? [])
    const abilities = this.calcularAbilites(personaje)
    const { CA, plusSpeed } = await this.calcularCA(personaje)
    
    let cargaMaxima = abilities.str*15

    if (traits?.map(trait => trait.index === "semblance-beast-bear")) {
      cargaMaxima *= 2
    }
     
    return {
      id: personaje._id.toString(),
      img: personaje.img,
      name: personaje.name,
      race: personaje.race,
      classes: clases,
      subclasses: personaje.subclasses,
      campaign: personaje?.campaign ? { index: personaje?.campaign, name: campaign?.name } : null,
      appearance: personaje?.appearance,
      background: personaje?.background,
      level,
      XP: personaje.XP,
      XPMax: nivel[level-1],
      abilities,
      HPMax: personaje?.HPMax,
      CA,
      speed: speed + plusSpeed,
      skills: habilidades,
      languages: idiomas,
      proficiencies,
      traits,
      traits_data: personaje.traits_data,
      resistances,  
      conditional_resistances,
      condition_inmunities,
      invocations: invocationsData,
      disciplines: disciplinesData,
      metamagic: metamagicData,
      prof_bonus: personaje.prof_bonus,
      saving_throws: personaje.saving_throws,
      equipment: equipoPersonaje,
      dotes,
      money: personaje?.money ?? 0,
      spells,
      cargaMaxima
    }
  }

  async crearPdf(idUser: string, idCharacter: string): Promise<any> {
    const personaje = await Personaje.findById(idCharacter);

    const personajeData = await this.formatearPersonaje(personaje)

    return this.generarPdf(personajeData, idUser)
  }

  sumaDaño(character: any, equip: any) {
    let suma = equip?.isMagic ? 1 : 0

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

    if (character?.weapons?.some((arma: any) => equip?.weapon?.competency?.includes(arma?.index))) {
      suma += character?.prof_bonus ?? 0
    }

    return suma
  }

  async entrarPersonajeCampaña(idUser: string, idCharacter: string, idCampaign: string) {
    const personaje = await Personaje.findById(idCharacter);

    if (personaje?.user !== idUser) {
      throw new Error('El personaje no existe o no pertenece al usuario');
    }
    
    personaje.campaign = idCampaign

    personaje.save()

    return await this.formatearPersonajeBasico(personaje)
  }

  async generarPdf(personaje: any, idUser: string): Promise<any> {
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
 
      const background = personaje?.background?.name
 
      form.getTextField('CharacterName').setText(personaje?.name);
      form.getTextField('ClassLevel').setText(personaje?.classes?.map((cl: any) => cl?.name + ' ' + cl?.level)?.join(', '));
      form.getDropdown('Background').addOptions([background ?? ""]);
      form.getDropdown('Background').select(background ?? "");
      form.getTextField('PlayerName').setText(usuario);
      form.getDropdown('Race').addOptions([personaje?.race ?? ""]);
      form.getDropdown('Race').select(personaje?.race ?? "");
      form.getDropdown('Alignment').addOptions([personaje?.background?.alignment ?? ""]);
      form.getDropdown('Alignment').select(personaje?.background?.alignment ?? "");
      form.getTextField('ExperiencePoints').setText(personaje?.XP + '/' + personaje?.XPMax);

      form.getTextField('CharacterName 2').setText(personaje?.name);
      form.getTextField('Age').setText((personaje?.appearance?.age ?? 0) + ' años');
      form.getTextField('Eyes').setText(personaje?.appearance?.eyes);
      form.getTextField('Height').setText((personaje?.appearance?.height ?? 0) + ' cm');
      form.getTextField('Skin').setText(personaje?.appearance?.skin);
      form.getTextField('Weight').setText((personaje?.appearance?.weight ?? 0) + ' kg');
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
            form.getTextField('Attack' + (index+golpeCuerpo+1)).setText(equi.name + " " + (equi.isMagic ? " +1" : ""));
            form.getTextField('AtkBonus' + (index+golpeCuerpo+1)).setText('+' + this.sumaGolpe(personaje, equi));
            form.getTextField('Damage' + (index+golpeCuerpo+1)).setText(equi?.weapon?.damage?.dice + ' +' + this.sumaDaño(personaje, equi) + ' ' + equi?.weapon?.damage?.name);
          }
        })
  
      form.getTextField('Copper').setText(personaje?.money?.pc + '');
      form.getTextField('Silver').setText(personaje?.money?.pp + '');
      form.getTextField('Electrum').setText(personaje?.money?.pe + '');
      form.getTextField('Gold').setText(personaje?.money?.po + '');
      form.getTextField('Platinum').setText(personaje?.money?.ppt + '');
      
      form.getTextField('HPMax').setText(personaje?.HPMax + '');
      form.getTextField('ProfBonus').setText('+' + personaje?.prof_bonus);
      form.getTextField('AC').setText(personaje?.CA + '');
      form.getTextField('Init').setText(this.formatNumber(bonus.dex) + '');
      form.getTextField('Speed').setText(personaje?.speed + '');

      form.getTextField('HitDiceTotal').setText(personaje.classes?.map((clase: any) => clase.level + 'd' + (clase.hit_die ?? "?"))?.join(' / ') + '');

      if (personaje?.skills?.find((skill: any) => skill?.index === 'perception' && skill?.competencia)) {
        form.getTextField('PWP').setText(10 + bonus.wis + personaje?.prof_bonus + '');
      } else {
        form.getTextField('PWP').setText(10 + bonus.wis + '');
      }

      escribirRasgos({
        traits: personaje?.traits,
        invocations: personaje?.invocations,
        disciplines: personaje?.disciplines,
        metamagic: personaje?.metamagic,
        pdfDoc: originalPdf
      })
     
      escribirCompetencias({
        pdfDoc: originalPdf,
        languages: personaje?.languages,
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
      if (personaje?.img) {
        const imageResponse = await axios.get(personaje?.img, { responseType: 'arraybuffer' });
        const imageBytes = imageResponse.data; // Obtener los bytes de la imagen
        const contentType = imageResponse.headers['content-type'];

        let image;

        if (contentType.includes('png')) {
          image = await originalPdf.embedPng(imageBytes);
        } else if (contentType.includes('jpeg') || contentType.includes('jpg')) {
          image = await originalPdf.embedJpg(imageBytes);
        } else {
          throw new Error(`Formato de imagen no soportado: ${contentType}`);
        }

        // Obtener la posición y tamaño del botón
        const page = originalPdf.getPage(1); // Página donde está el botón

        page.drawImage(image, {
          x: 39,
          y: 490,
          width: 155,
          height: 155,
        });
      }
      
      // También puedes desactivar la edición si quieres bloquear el PDF después de llenarlo
      form.flatten();
 
    } catch (e) {
      console.error(e)
    }

    // Crear un nuevo documento
    const nuevoPdf = await PDFDocument.create();

    // Copiar las primeras 3 páginas
    const [pag1, pag2, pag3] = await nuevoPdf.copyPages(originalPdf, [0, 1, 2]);

    nuevoPdf.addPage(pag1);
    nuevoPdf.addPage(pag2);

    let conjuros = false

    personaje.classes.forEach((clase: any) => {
      if (clase.class !== 'monk' && clase.class !== 'barbarian') {
        conjuros = true
      }
    })

    if (conjuros) {
      nuevoPdf.addPage(pag3);
    }

    const pdfBytes = await nuevoPdf.save();
  
    return pdfBytes
  }

  formatNumber(num: any) {
    return (num >= 0 ? "+" : "") + num.toString();
  }
}