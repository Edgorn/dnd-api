import IPersonajeRepository from '../../../../domain/repositories/IPersonajeRepository';
import Personaje from '../schemas/Personaje';
import { escribirCompetencias, escribirConjuros, escribirEquipo, escribirOrganizaciones, escribirRasgos, escribirTransfondo } from '../../../../utils/escribirPdf';
import axios from 'axios';
import IUsuarioRepository from '../../../../domain/repositories/IUsuarioRepository';
import IConjuroRepository from '../../../../domain/repositories/IConjuroRepository';
import { AbilityKey, ClaseLevelUpCharacter, PersonajeApi, PersonajeBasico, PersonajeMongo, TypeAñadirEquipamiento, TypeCrearPersonaje, TypeEliminarEquipamiento, TypeEquiparArmadura, TypeSubirNivel } from '../../../../domain/types/personajes.types';
import Campaña from '../schemas/Campaña';
import { DañoApi } from '../../../../domain/types';
import IDoteRepository from '../../../../domain/repositories/IDoteRepository';
import IClaseRepository from '../../../../domain/repositories/IClaseRepository';
import IEquipamientoRepository from '../../../../domain/repositories/IEquipamientoRepository';
import IRasgoRepository from '../../../../domain/repositories/IRasgoRepository';
import ICompetenciaRepository from '../../../../domain/repositories/ICompetenciaRepository';
import IIdiomaRepository from '../../../../domain/repositories/IIdiomaRepository';
import IHabilidadRepository from '../../../../domain/repositories/IHabilidadRepository';
import { ConjuroApi } from '../../../../domain/types/conjuros.types';
import { EstadoApi } from '../../../../domain/types/estados.types';
import { TypeEntradaPersonajeCampaña } from '../../../../domain/types/campañas.types';
import { EquipamientoPersonajeApi } from '../../../../domain/types/equipamientos.types';

const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

const nivel = [300, 900, 2700, 6500, 14000, 23000, 34000, 48000, 64000, 85000, 100000, 120000, 140000, 165000, 195000, 225000, 265000, 305000, 355000, 0]
const prof_bonus = [2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6]

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

export default class PersonajeRepository implements IPersonajeRepository {
  constructor(
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly equipamientoRepository: IEquipamientoRepository,
    private readonly rasgoRepository: IRasgoRepository,
    private readonly competenciaRepository: ICompetenciaRepository,
    private readonly idiomaRepository: IIdiomaRepository,
    private readonly habilidadRepository: IHabilidadRepository,
    private readonly conjuroRepository: IConjuroRepository,
    private readonly doteRepository: IDoteRepository,
    private readonly claseRepository: IClaseRepository
  ) {}
    
  async consultarPorUsuario(id: string): Promise<PersonajeBasico[]> {
    try {
      const personajes = await Personaje.find({ user: id })
        .collation({ locale: 'es', strength: 1 })
        .sort({ name: 1 });
      return this.formatearPersonajesBasicos(personajes)
    } catch (error) {
      console.error("Error obteniendo personajes:", error);
      throw new Error("No se pudieron obtener los personajes");
    }
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
      traits_data: { ...traits_data },
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
      equipment: equipment,
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
  
  async consultarPorId(idCharacter: string, user: string): Promise<PersonajeApi> {
    const personaje = await Personaje.findById(idCharacter);

    if (personaje?.user === user) {
      return this.formatearPersonaje(personaje)
    } else if (personaje?.campaign) {
      const campaña = await Campaña.findById(personaje?.campaign)

      if (campaña?.master === user) {
        return this.formatearPersonaje(personaje)
      } else {
        throw new Error('No tienes permiso para consultar este personaje');
      }
    } else {
      throw new Error('No tienes permiso para consultar este personaje');
    }
  }

  async obtenerPdf(idCharacter: string, user: string): Promise<any> {
    const personaje = await this.consultarPorId(idCharacter, user)

    return this.generarPdf(personaje, user)
  }

  async añadirEquipamiento(data: TypeAñadirEquipamiento): Promise<{completo: PersonajeApi, basico: PersonajeBasico} | null> {
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

    if (!resultado) {
      return null
    }

    const completo = await this.formatearPersonaje(resultado)
    const basico = await this.formatearPersonajeBasico(resultado)

    return {
      completo,
      basico
    }
  }

  async eliminarEquipamiento(data: TypeEliminarEquipamiento): Promise<{completo: PersonajeApi, basico: PersonajeBasico} | null> {
    const { id, equip, cantidad, isMagic } = data
    const personaje = await Personaje.findById(id);

    const equipment = personaje?.equipment ?? []

    const idx = equipment.findIndex(eq => eq.index === equip && !!eq.isMagic === !!isMagic)

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

    if (!resultado) {
      return null
    }

    const completo = await this.formatearPersonaje(resultado)
    const basico = await this.formatearPersonajeBasico(resultado)

    return {
      completo,
      basico
    }
  }
  
  async equiparArmadura(data: TypeEquiparArmadura): Promise<{completo: PersonajeApi, basico: PersonajeBasico} | null> {
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

    const resultado = await Personaje.findByIdAndUpdate(
      id,
      {
        $set: {
          equipment
        }
      },
      { new: true }
    );

    if (!resultado) {
      return null
    }

    const completo = await this.formatearPersonaje(resultado)
    const basico = await this.formatearPersonajeBasico(resultado)

    return {
      completo,
      basico
    }
  }
  
  async modificarDinero(id: string, money: number): Promise<{completo: PersonajeApi, basico: PersonajeBasico} | null> {
    const resultado = await Personaje.findByIdAndUpdate(
      id,
      {
        $set: {
          money
        }
      },
      { new: true }
    );

    if (!resultado) {
      return null
    }

    const completo = await this.formatearPersonaje(resultado)
    const basico = await this.formatearPersonajeBasico(resultado)

    return {
      completo,
      basico
    }
  }
  
  async cambiarXp({id, XP}: {id: string, XP: number}): Promise<{completo: PersonajeApi, basico: PersonajeBasico} | null> {
    const resultado = await Personaje.findByIdAndUpdate(
      id,
      {
        $set: {
          XP
        }
      },
      { new: true }
    );

    if (!resultado) {
      return null
    }

    const completo = await this.formatearPersonaje(resultado)
    const basico = await this.formatearPersonajeBasico(resultado)

    return {
      completo,
      basico
    }
  }
  
  async subirNivelDatos({ id, clase }: { id: string, clase: string }): Promise<ClaseLevelUpCharacter> {
    const personaje = await Personaje.findById(id);
    const level = personaje?.classes?.find(clas => clas.class === clase)?.level ?? 0

    const dataLevel = await this.claseRepository.dataLevelUp(clase, level+1, personaje?.subclasses ?? [])
    const totalLevels = personaje?.classes?.reduce((acc, clas) => acc + clas.level, 0) ?? 0;

    return {
      clase,
      hit_die: dataLevel?.hit_die ?? 0,
      prof_bonus: prof_bonus[totalLevels] ?? 0,
      traits: dataLevel?.traits ?? [],
      traits_data: dataLevel?.traits_data ?? {},
      traits_options: dataLevel?.traits_options ?? undefined,
      subclasesData: dataLevel?.subclasesData ?? null,
      ability_score: dataLevel?.ability_score ?? false,
      dotes: dataLevel?.dotes,
      double_skills: dataLevel?.double_skills,
      spell_choices: dataLevel?.spell_choices,
      mixed_spell_choices: dataLevel?.mixed_spell_choices,
      spell_changes: dataLevel?.spell_changes,
      skill_choices: dataLevel?.skill_choices
      
      /*
      //spellcasting_options: ,
      //spellcasting_changes: ,
      invocations,
      invocations_change,
      disciplines_new,
      disciplines_change,
      metamagic,
      //spells
    */
    }
  }

  async subirNivel(data: TypeSubirNivel): Promise<{completo: PersonajeApi, basico: PersonajeBasico} | null> {
    const { id, hit, clase, traits, traits_data, prof_bonus, subclase, abilities, dotes, skills, double_skills, spells, proficiencies /*, invocations, disciplines, metamagic*/ } = data
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
    const spellsData = { ...personaje?.spells }

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

    /*if (clase === 'sorcerer' && traits.includes('draconid-resistance')) {
      HP += 1
    }*/
    
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
          abilities: abilities ?? personaje?.abilities,
          dotes: [
            ...personaje?.dotes ?? [], ...dotes ?? []
          ],
          skills: [
            ...personaje?.skills ?? [],
            ...skills ?? []
          ],
          double_skills: [
            ...personaje?.double_skills ?? [],
            ...double_skills ?? []
          ],
          proficiencies: [
            ...personaje?.proficiencies ?? [],
            ...proficiencies ?? []
          ],
          spells: spellsData
          //invocations,
          //disciplines: actualDisciplines,
          //metamagic: [...personaje?.metamagic ?? [], ...metamagic ?? []],
          //
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

    if (!resultado) {
      return null
    }

    const completo = await this.formatearPersonaje(resultado)
    const basico = await this.formatearPersonajeBasico(resultado)

    return {
      completo,
      basico
    }
  }

  async consultarPorIds(indices: string[]): Promise<PersonajeBasico[]> {
    try {
      const personajes = await Personaje.find({ _id: { $in: indices } })
        .collation({ locale: 'es', strength: 1 })
        .sort({ name: 1 });
      return this.formatearPersonajesBasicos(personajes)
    } catch (error) {
      console.error("Error obteniendo personajes:", error);
      throw new Error("No se pudieron obtener los personajes");
    }
  }

  async entrarCampaña(data: TypeEntradaPersonajeCampaña): Promise<PersonajeBasico | null> {
    const { userId, campaignId, characterId } = data

    const personaje = await Personaje.findById(characterId);

    if (personaje?.user !== userId) {
      throw new Error('El personaje no existe o no pertenece al usuario');
    }
    
    personaje.campaign = campaignId

    personaje.save()

    return this.formatearPersonajeBasico(personaje)
  }

  private formatearPersonajesBasicos(personajes: PersonajeMongo[]): Promise<PersonajeBasico[]> {
    return Promise.all(personajes.map(personaje => this.formatearPersonajeBasico(personaje)))
  }

  private async formatearPersonajeBasico(personaje: PersonajeMongo): Promise<PersonajeBasico> {
    const level = personaje?.classes?.map((cl: any) => cl.level).reduce((acumulador: number, valorActual: number) => acumulador + valorActual, 0) ?? 0

    const user = await this.usuarioRepository.consultarNombreUsuario(personaje?.user ?? null)
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
      CA,
      HPMax: personaje.HPMax,
      HPActual: personaje.HPActual,
      XP: personaje.XP,
      XPMax: nivel[level-1]
    }
  }

  private async calcularCA(personaje: PersonajeMongo) {
    let armadura = false
    let armaduraPesada = false
    let CA = 10
    let shield = 0

    let plusSpeed = 0

    const equipment = await this.equipamientoRepository.obtenerEquipamientosPersonajePorIndices(personaje.equipment.filter(eq => eq.equipped))

    equipment?.forEach(equip => {
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
    
  private async formatearPersonaje(personaje: PersonajeMongo): Promise<PersonajeApi> {
    const level = personaje.classes.map(cl => cl.level).reduce((acumulador: number, valorActual: number) => acumulador + valorActual, 0)

    const traits = await this.rasgoRepository.obtenerRasgosPorIndices(personaje?.traits, personaje?.traits_data)
    const skills = personaje?.skills ?? []
    
    const idiomasId = personaje?.languages ?? []
    const proficiencies = await this.competenciaRepository.obtenerCompetenciasPorIndices(personaje?.proficiencies ?? [])

    const resistances:DañoApi[] = []

    const conditional_resistances:{ name: string, resistances: DañoApi[] }[] = []
    const condition_inmunities:{ name: string, estados: EstadoApi[] }[] = []
    
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

      if (trait?.proficiencies) {
        proficiencies.push(...trait?.proficiencies)
      }

      if (trait?.speed) {
        speed = trait?.speed
      }
    })

    const indexSet = new Set(proficiencies.map(item => item.index));

    const proficienciesFiltrados = proficiencies.filter(item =>
      item.desc.every(ref => !indexSet.has(ref))
    );

    const proficienciesUnicos = [
    ...new Map(proficienciesFiltrados.map(item => [item.index, item])).values()
  ];

    const idiomas = await this.idiomaRepository.obtenerIdiomasPorIndices(idiomasId)
    let habilidades = await this.habilidadRepository.obtenerHabilidadesPersonaje(skills, personaje?.double_skills ?? [])
    const equipment = await this.equipamientoRepository.obtenerEquipamientosPersonajePorIndices(personaje.equipment)

    const clases = personaje.classes

    const spellcasting = await this.claseRepository.spellcastingClases(
      personaje.classes.map(clase => {
        return {
          id: clase.class,
          level: clase.level
        }
      })
    )

    const spells = { ...personaje.spells }
    const updatedSpells: Record<string, {
      list: ConjuroApi[],
      type: string
    }> = {}
    
    await Promise.all(
      Object.keys(spells).map(async groupSpells => {
        const indices = [...spells[groupSpells]]

        if (!Array.isArray(indices) || indices.length === 0) {
          return
        }

        const dataList = await this.conjuroRepository.obtenerConjurosPorIndices(indices)
        let type = ""

        if (groupSpells === "race") {
          if (personaje.raceId === "elf") {
            type = "int"
          }
        }

        updatedSpells[groupSpells] = {
          list: dataList,
          type: caracteristicas[type] ?? ''
        }
      })
    )

    const campaign = await Campaña.findById(personaje?.campaign)
    const dotes = await this.doteRepository.obtenerDotesPorIndices(personaje?.dotes ?? [])
    const abilities = this.calcularAbilites(personaje)
    const { CA, plusSpeed } = await this.calcularCA(personaje)
    
    let cargaMaxima = abilities.str*15

    if (traits?.find(trait => trait.index === "semblance-beast-bear")) {
      cargaMaxima *= 2
    }

    if (traits?.find(trait => trait.index === "jack-of-all-trades")) {
      habilidades = habilidades.map(habilidad => { return {
        ...habilidad,
        value: habilidad.value ? habilidad.value : 0.5
      }})
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
      proficiencies: proficienciesUnicos,
      traits,
      traits_data: personaje.traits_data,
      resistances,  
      conditional_resistances,
      condition_inmunities,
      prof_bonus: personaje.prof_bonus,
      saving_throws: personaje.saving_throws,
      equipment: equipment ?? [],
      dotes,
      money: personaje?.money,
      spells: updatedSpells,
      cargaMaxima,
      spellcasting: spellcasting.filter(item => item !== null)
    } 
  }

  private async generarPdf(personaje: PersonajeApi, idUser: string): Promise<any> {
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
 
      const usuario = await this.usuarioRepository.consultarNombreUsuario(idUser)
 
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

      const abilities: AbilityKey[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']
      
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

      personaje?.skills?.forEach(skill => {
        if (skill?.value) {
          form.getCheckBox(datos[skill?.index][0]).check()
          form.getTextField(datos[skill?.index][1]).setText(this.formatNumber(bonus[skill.ability_score] + (personaje?.prof_bonus * skill?.value)) + '');
        } else {
          form.getTextField(datos[skill?.index][1]).setText(this.formatNumber(bonus[skill.ability_score]) + '');
        }
      })
 
      if(personaje?.equipment?.find(equi => equi.name === 'Escudo' && equi.equipped)) {
        form.getCheckBox('shieldyes').check();
      }

      const monkTrait = personaje?.traits?.find(trait => trait.index==='martial-arts')
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
        ?.filter(equi => equi?.category === 'Arma')
        ?.forEach((equi, index: number) => {
          if (index+golpeCuerpo < 3) {
            form.getTextField('Attack' + (index+golpeCuerpo+1)).setText(equi.name + " " + (equi.isMagic ? " +1" : ""));
            form.getTextField('AtkBonus' + (index+golpeCuerpo+1)).setText('+' + this.sumaGolpe(personaje, equi));
            form.getTextField('Damage' + (index+golpeCuerpo+1)).setText(
              equi?.weapon?.damage?.map(damage => {
                return damage?.dice + ' +' + this.sumaDaño(personaje, equi) + ' ' + damage?.name
              }).join(", ")
            );
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

      form.getTextField('HitDiceTotal').setText(personaje.classes?.map(clase => clase.level + 'd' + (clase.hit_die ?? "?"))?.join(' / ') + '');
 
      const skillPerception = personaje?.skills?.find(skill => skill?.index === 'perception' && skill?.value)

      if (skillPerception) {
        form.getTextField('PWP').setText(10 + bonus.wis + (personaje?.prof_bonus * skillPerception.value) + '');
      } else {
        form.getTextField('PWP').setText(10 + bonus.wis + '');
      }

      escribirRasgos({
        traits: personaje?.traits,
        invocations: [],//personaje?.invocations,
        disciplines: [],//personaje?.disciplines,
        metamagic: [],//personaje?.metamagic,
        dotes: personaje?.dotes,
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

  private calcularAbilites(personaje: PersonajeMongo) {
    const { abilities } = personaje

    if (personaje?.traits?.includes('primal-champion')) {
      abilities.str += 4
      abilities.con += 4
    }

    return abilities
  }

  private sumaDaño(character: PersonajeApi, equip: EquipamientoPersonajeApi) {
    let suma = equip?.isMagic ? 1 : 0

    if (equip?.weapon?.properties.find(prop => prop.index === 'finesse')) {
      const max = Math.max(character?.abilities?.str, character?.abilities?.dex)

      suma += Math.floor((max/2) - 5)
    } else if (equip?.weapon?.range === 'Distancia') {
      suma += Math.floor((character?.abilities?.dex/2) - 5)
      if (character?.traits?.map(trait => trait.index)?.includes("fighter-fighting-style-archery")) {
        suma += 2
      } 
    } else {
      suma += Math.floor((character?.abilities?.str/2) - 5)
    }

    return suma
  } 

  private sumaGolpe(character: PersonajeApi, equip: EquipamientoPersonajeApi) {
    let suma = 0
    
    suma += this.sumaDaño(character, equip)

    if (character?.proficiencies?.some(arma => equip?.weapon?.competency?.includes(arma?.index))) {
      suma += character?.prof_bonus ?? 0
    }

    return suma
  }

  private formatNumber(num: number) {
    return (num >= 0 ? "+" : "") + num.toString();
  }
}