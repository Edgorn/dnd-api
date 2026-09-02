import IPersonajeRepository from '../../../../domain/repositories/IPersonajeRepository';
import Personaje from '../schemas/Personaje';
import IUserRepository from '../../../../domain/repositories/IUserRepository';
import { escribirCompetencias, escribirConjuros, escribirEquipo, escribirOrganizaciones, escribirRasgos, escribirTransfondo } from '../../../../utils/escribirPdf';
import ISpellRepository from '../../../../domain/repositories/ISpellRepository';
import { ClaseLevelUpCharacter, PersonajeApi, PersonajeBasico, PersonajeMongo, TypeAñadirEquipamiento, TypeCrearPersonaje, TypeEliminarEquipamiento, TypeEquiparArmadura, TypeSubirNivel } from '../../../../domain/types/personajes.types';
import Campaña from '../schemas/Campaña';
import { Damage } from '../../../../domain/types';
import AttributeService from '../../../../domain/services/attribute.service';
import SkillService from '../../../../domain/services/skill.service';
import IDoteRepository from '../../../../domain/repositories/IDoteRepository';
import ICharacterClassRepository from '../../../../domain/repositories/ICharacterClassRepository';
import IEquipmentRepository from '../../../../domain/repositories/IEquipmentRepository';
import ITraitRepository from '../../../../domain/repositories/ITraitRepository';
import IProficiencyRepository from '../../../../domain/repositories/IProficiencyRepository';
import ILanguageRepository from "../../../../domain/repositories/ILanguageRepository";
import ISkillRepository from '../../../../domain/repositories/ISkillRepository';
import { SpellApi } from '../../../../domain/types/spell.types';
import { EstadoApi } from '../../../../domain/types/estados.types';
import { TypeEntradaPersonajeCampaña } from '../../../../domain/types/campañas.types';
import { CharacterEquipmentApi } from '../../../../domain/types/equipment.types';
import IInvocacionRepository from '../../../../domain/repositories/IInvocacionRepository';
import IRaceRepository from '../../../../domain/repositories/IRaceRepository';
import { deepMerge } from '../../../../utils/formatters';
import { TraitApi } from '../../../../domain/types/traits.types';
import ICriaturaRepository from '../../../../domain/repositories/ICriaturaRepository';
import fs from 'fs'
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { CharacterAttributeApi } from '../../../../domain/types/attribute.types';
import { evaluateFormula, enrichSkillsWithPassive } from '../../../../utils/formulaEvaluator';
import { enrichEquipmentWithCombatBonuses } from '../../../../utils/combatBonuses';
import ISystemRepository from '../../../../domain/repositories/ISystemRepository';
import ICoinRepository from '../../../../domain/repositories/ICoinRepository';
import { CoinApi } from '../../../../domain/types/coin.types';
import {
  DEFAULT_PROFICIENCY_PROGRESSION,
  DEFAULT_XP_PROGRESSION,
} from '../../../../utils/systemRulesMerge';

const attributesLabels: any = {
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
    private readonly userRepository: IUserRepository,
    private readonly equipmentRepository: IEquipmentRepository,
    private readonly traitRepository: ITraitRepository,
    private readonly proficiencyRepository: IProficiencyRepository,
    private readonly languageRepository: ILanguageRepository,
    private readonly skillService: SkillService,
    private readonly spellRepository: ISpellRepository,
    private readonly doteRepository: IDoteRepository,
    private readonly claseRepository: ICharacterClassRepository,
    private readonly invocacionRepository: IInvocacionRepository,
    private readonly raceRepository: IRaceRepository,
    private readonly criaturaRepository: ICriaturaRepository,
    private readonly attributeService: AttributeService,
    private readonly systemRepository: ISystemRepository,
    private readonly coinRepository: ICoinRepository
  ) { }

  async consultarPorUsuario(id: string): Promise<PersonajeBasico[]> {
    try {
      const personajes = await Personaje.find({ user: id })
        .collation({ locale: 'es', strength: 1 })
        .sort({ name: 1 });

      const userName = await this.userRepository.getUserName(id);
      return this.formatearPersonajesBasicos(personajes, userName)
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
      attributes,
      systems,
      race,
      raceId,
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

    let HP: number;
    const rulesConfig = await this.systemRepository.getMergedRulesConfig(systems ?? []);
    const apiAttributesForHp = await this.attributeService.formatAttributes(attributes, systems ?? []);

    if (rulesConfig.hpInitialFormula) {
      HP = Math.floor(evaluateFormula(
        rulesConfig.hpInitialFormula,
        apiAttributesForHp,
        undefined,
        { classVariables: { hitDie: hit_die ?? 1 } }
      ));
    } else {
      HP = hit_die ?? 1;
      const conVal = attributes.find(a => a.key === 'con')?.value ?? 10;
      HP += Math.floor((conVal / 2) - 5);
    }

    if (traits.includes('dwarven-toughness') || traits.includes('draconid-resistance')) {
      HP += 1
    }

    const resolvedProfBonus = rulesConfig.proficiencyProgression?.[0] ?? prof_bonus ?? 0;

    let moneyArray: { quantity: number; unit: string }[] = [];
    if (Array.isArray(money)) {
      moneyArray = money;
    } else if (money && typeof money === 'object' && 'unit' in money) {
      moneyArray = [money as any];
    }

    const personaje = new Personaje({
      name,
      user,
      img,
      background: dataBackground,
      appearance,
      attributes,
      systems,
      raceId: raceId,
      campaign,
      classes: [{ class: claseId, name: clase ?? "Ninguna", level: 1, hit_die }],
      subclasses: subclase ? [subclase] : [],
      race: race,
      traits,
      traits_data: { ...traits_data },
      prof_bonus: resolvedProfBonus,
      speed,
      plusSpeed: 0,
      size,
      languages: languages,
      saving_throws: saving_throws ?? [],
      skills: [...skills ?? []],
      double_skills: [...double_skills ?? []],
      proficiencies,
      spells,
      equipment: equipment,
      dotes,
      money: moneyArray,
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

  async añadirEquipamiento(data: TypeAñadirEquipamiento): Promise<{ completo: PersonajeApi, basico: PersonajeBasico } | null> {
    const { id, equip, cantidad, isMagic, isBond } = data
    const personaje = await Personaje.findById(id);
    const equipment = personaje?.equipment ?? []

    if (isBond) {
      equipment.push({ id: equip, quantity: cantidad, isMagic, isBond, equipped: false })
    } else {
      const idx = equipment.findIndex(eq => eq.id === equip && !!eq.isMagic === !!isMagic)

      if (idx > -1) {
        equipment[idx].quantity += cantidad
      } else {
        equipment.push({ id: equip, quantity: cantidad, isMagic, equipped: false, isBond })
      }
    }

    const resultado = await Personaje.findByIdAndUpdate(
      id,
      {
        $set: {
          equipment
        }
      },
      { returnDocument: 'after' }
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

  async eliminarEquipamiento(data: TypeEliminarEquipamiento): Promise<{ completo: PersonajeApi, basico: PersonajeBasico } | null> {
    const { id, equip, cantidad, isMagic, isBond } = data
    const personaje = await Personaje.findById(id);
    const equipment = personaje?.equipment ?? []

    const idx = equipment.findIndex(eq => eq.id === equip && !!eq.isMagic === !!isMagic && !!eq.isBond === !!isBond)

    if (idx > -1) {
      if (isBond) {
        if (isMagic) {
          equipment[idx].isBond = false
        } else {
          equipment.splice(idx, 1)
        }
      } else {
        if (equipment[idx].quantity === cantidad) {
          equipment.splice(idx, 1)
        } else {
          equipment[idx].quantity -= cantidad
        }
      }
    }

    const resultado = await Personaje.findByIdAndUpdate(
      id,
      {
        $set: {
          equipment
        }
      },
      { returnDocument: 'after' }
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

  async equiparArmadura(data: TypeEquiparArmadura): Promise<{ completo: PersonajeApi, basico: PersonajeBasico } | null> {
    const { id, equip, nuevoEstado, isMagic } = data
    const personaje = await Personaje.findById(id);

    const equipment = await this.equipmentRepository.getCharacterEquipmentsByIds(personaje?.equipment ?? [])

    if (equipment) {
      const idx = equipment.findIndex(eq => eq.id === equip && !!eq.isMagic === !!isMagic)

      if (idx > -1) {
        if (equip === 'shield') {
          equipment.forEach(item => {
            if (item.id === "shield") {
              item.equipped = false;
            }
          });
        } else if (equip === 'Armadura') {
          equipment.forEach(item => {
            if (item.id === "Armadura") {
              item.equipped = false;
            }
          });
        } else {
          equipment[idx].equipped = nuevoEstado
        }
      }
    }

    const resultado = await Personaje.findByIdAndUpdate(
      id,
      {
        $set: {
          equipment
        }
      },
      { returnDocument: 'after' }
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

  async modificarDinero(id: string, money: { quantity: number; unit: string }[]): Promise<{ completo: PersonajeApi, basico: PersonajeBasico } | null> {
    const moneyArray = Array.isArray(money) ? money : (money && typeof money === 'object' && 'unit' in money ? [money] : []);
    const resultado = await Personaje.findByIdAndUpdate(
      id,
      {
        $set: {
          money: moneyArray
        }
      },
      { returnDocument: 'after' }
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

  async cambiarXp({ id, XP }: { id: string, XP: number }): Promise<{ completo: PersonajeApi, basico: PersonajeBasico } | null> {
    const resultado = await Personaje.findByIdAndUpdate(
      id,
      {
        $set: {
          XP
        }
      },
      { returnDocument: 'after' }
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

    const dataLevel = await this.claseRepository.dataLevelUp?.(clase, level + 1, personaje?.subclasses ?? [])
    const totalLevels = personaje?.classes?.reduce((acc, clas) => acc + clas.level, 0) ?? 0;
    const rulesConfig = await this.systemRepository.getMergedRulesConfig(personaje?.systems ?? []);
    const raceLevel = await this.raceRepository.dataLevelUp(personaje?.raceId ?? '', level + 1)

    let raceTraitsData = {}

    if (raceLevel) {
      raceTraitsData = deepMerge(raceLevel?.traits_data ?? {}, personaje?.traits_data ?? {})
    }

    return {
      clase,
      hit_die: dataLevel?.hit_die ?? 0,
      prof_bonus: rulesConfig.proficiencyProgression?.[totalLevels]
        ?? DEFAULT_PROFICIENCY_PROGRESSION[totalLevels]
        ?? 0,
      traits: dataLevel?.traits ?? [],
      traits_data: deepMerge(dataLevel?.traits_data ?? {}, raceTraitsData),
      traits_options: dataLevel?.traits_options ?? undefined,
      subclasesData: dataLevel?.subclasesData ?? null,
      ability_score: dataLevel?.ability_score ?? false,
      dotes: dataLevel?.dotes,
      double_skills: dataLevel?.double_skills,
      spell_choices: dataLevel?.spell_choices,
      mixed_spell_choices: dataLevel?.mixed_spell_choices,
      spells: dataLevel?.spells,
      spell_changes: dataLevel?.spell_changes,
      skill_choices: dataLevel?.skill_choices,
      invocations_choices: dataLevel?.invocations_choices,
      invocations_change: dataLevel?.invocations_change,
      /*
      disciplines_new,
      disciplines_change,
      metamagic,
    */
    }
  }

  async subirNivel(data: TypeSubirNivel): Promise<{ completo: PersonajeApi, basico: PersonajeBasico } | null> {
    const { id, hit, clase, traits, traits_data, prof_bonus, subclase, attributes, dotes, skills, double_skills, spells, proficiencies, invocations, /*,disciplines, metamagic*/ } = data
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

    const conVal = personaje?.attributes?.find(a => a.key === 'con')?.value ?? 10
    const rulesConfig = await this.systemRepository.getMergedRulesConfig(personaje?.systems ?? []);
    const apiAttributesForHp = await this.attributeService.formatAttributes(
      personaje?.attributes ?? [],
      personaje?.systems ?? []
    );
    const classHitDie = personaje?.classes?.find(clas => clas.class === clase)?.hit_die ?? hit;

    let HP: number;
    if (rulesConfig.hpLevelUpFormula) {
      HP = Math.floor(evaluateFormula(
        rulesConfig.hpLevelUpFormula,
        apiAttributesForHp,
        undefined,
        { classVariables: { hitDie: hit ?? classHitDie } }
      ));
    } else {
      HP = hit + Math.floor(((conVal) / 2) - 5);
    }

    if (traits.includes('dwarven-toughness')) {
      HP += 1
    }

    const totalLevels = personaje?.classes?.reduce((acc, clas) => acc + clas.level, 0) ?? 0;

    const traitsSinRepetidos = [...new Set([...personaje?.traits ?? [], ...traits ?? []])];

    const subclaseArray = subclase ? [subclase] : []

    const resultado = await Personaje.findByIdAndUpdate(
      id,
      {
        $set: {
          XP: 0,
          prof_bonus: Math.max(
            rulesConfig.proficiencyProgression?.[totalLevels]
              ?? DEFAULT_PROFICIENCY_PROGRESSION[totalLevels]
              ?? prof_bonus
              ?? 0,
            personaje?.prof_bonus ?? 0
          ),
          traits: traitsSinRepetidos,
          traits_data: { ...personaje?.traits_data, ...traits_data },
          subclasses: [...personaje?.subclasses ?? [], ...subclaseArray ?? []],
          attributes: attributes ?? personaje?.attributes,
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
          spells: spellsData,
          invocations,
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
        returnDocument: 'after'
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
      const personajes = await Personaje.find().where('_id').in(indices)
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

  async vincularPacto(data: { equip: string, id: string }): Promise<{ completo: PersonajeApi, basico: PersonajeBasico } | null> {
    const { equip, id } = data
    const personaje = await Personaje.findById(id);
    const equipment = personaje?.equipment ?? []

    const idx = equipment.findIndex(eq => eq.id === equip && !!eq.isMagic === true)

    if (idx > -1) {
      equipment[idx].isBond = true
    }

    const resultado = await Personaje.findByIdAndUpdate(
      id,
      {
        $set: {
          equipment
        }
      },
      { returnDocument: 'after' }
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

  async aprenderConjuros(data: { id: string, spells: string[], type: string }): Promise<PersonajeApi | null> {
    const { id, spells, type } = data
    const personaje = await Personaje.findById(id);

    if (!personaje) {
      return null
    }

    if (personaje.spells[type]) {
      personaje.spells[type].push(...spells)
    } else {
      personaje.spells[type] = [...spells]
    }

    const resultado = await Personaje.findByIdAndUpdate(
      id,
      {
        $set: {
          spells: personaje.spells
        }
      },
      { returnDocument: 'after' }
    );

    if (!resultado) {
      return null
    }

    const personajeFormateado = await this.formatearPersonaje(resultado)

    return personajeFormateado
  }

  async añadirForma(data: { id: string, form: string }): Promise<PersonajeApi | null> {
    const { id, form } = data
    const personaje = await Personaje.findById(id);

    if (!personaje) {
      return null
    }

    personaje.forms.push(form)

    const resultado = await Personaje.findByIdAndUpdate(
      id,
      {
        $set: {
          forms: personaje.forms
        }
      },
      { returnDocument: 'after' }
    );

    if (!resultado) {
      return null
    }

    const personajeFormateado = await this.formatearPersonaje(resultado)

    return personajeFormateado
  }

  private async formatearPersonajesBasicos(personajes: PersonajeMongo[], userName?: string): Promise<PersonajeBasico[]> {
    const campaignIds = [...new Set(personajes.map(p => p.campaign).filter(id => id))];

    const campaigns = await Campaña.find().where('_id').in(campaignIds)
    const campaignMap = new Map(campaigns.map(c => [c._id.toString(), c.name]));

    return Promise.all(personajes.map(personaje => {
      const campaignName = personaje.campaign ? campaignMap.get(personaje.campaign.toString()) : undefined;
      return this.formatearPersonajeBasico(personaje, userName, campaignName);
    }));
  }

  private async formatearPersonajeBasico(personaje: PersonajeMongo, userName?: string, campaignName?: string): Promise<PersonajeBasico> {
    const level = personaje?.classes?.map((cl: any) => cl.level).reduce((acumulador: number, valorActual: number) => acumulador + valorActual, 0) ?? 0
    const user = userName ?? await this.userRepository.getUserName(personaje?.user ?? null)

    const traits = await this.traitRepository.getTraitsByIndexes(personaje?.traits, personaje?.traits_data)
    const { CA } = await this.calcularCA(personaje, traits)
    const rulesConfig = await this.systemRepository.getMergedRulesConfig(personaje.systems ?? []);

    let finalCampaignName = campaignName;
    if (finalCampaignName === undefined) {
      const campaña = await Campaña.findById(personaje?.campaign)
      finalCampaignName = campaña?.name ?? '';
    }

    return {
      id: personaje?._id?.toString() ?? '',
      img: personaje.img,
      name: personaje.name,
      user,
      attributes: personaje.attributes,
      systems: personaje.systems ?? [],
      speed: personaje.speed,
      race: personaje.race,
      campaign: finalCampaignName,
      classes: personaje?.classes?.map((clas: any) => { return { name: clas.name, level: clas.level } }) ?? [],
      CA,
      HPMax: personaje.HPMax,
      HPActual: personaje.HPActual,
      XP: personaje.XP,
      XPMax: rulesConfig.xpProgression?.[level]
        ?? DEFAULT_XP_PROGRESSION[level]
        ?? DEFAULT_XP_PROGRESSION[level - 1]
        ?? 0,
    }
  }

  private async calcularCA(personaje: PersonajeMongo, traits: TraitApi[]) {
    let armadura = false
    let armaduraPesada = false
    let CA = 10
    let shield = 0
    let bonus = 0

    let plusSpeed = 0

    const equipment = await this.equipmentRepository.getCharacterEquipmentsByIds(personaje.equipment.filter(eq => eq.equipped))

    equipment?.forEach(equip => {
      const armor = { ...equip, ...personaje.equipment.find(eq => eq.equipped && eq.id === equip.id) }
      if (armor.category === 'Armadura') {
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
            const dexVal = personaje.attributes.find(a => a.key === 'dex')?.value ?? 10
            CA += Math.max(Math.min(Math.floor((dexVal / 2) - 5), armor?.armor?.class?.max_bonus ?? 99), 0)
          }

          armadura = true

          if (armor.armor?.category === "Pesada") {
            armaduraPesada = true
          }
        }
      } else {
        bonus += armor.bonuses?.armor_class ?? 0
      }
    })

    traits.forEach(trait => {
      if (trait?.bonuses?.armor_class) {
        bonus += trait?.bonuses?.armor_class ?? 0
      }
    })

    if (!armadura) {
      const hasSpecialUnarmoredDefense =
        personaje.traits.includes('barbarian-unarmored-defense')
        || personaje.traits.includes('monk-unarmored-defense')
        || personaje.traits.includes('draconid-resistance');

      if (!hasSpecialUnarmoredDefense) {
        const rulesConfig = await this.systemRepository.getMergedRulesConfig(personaje.systems ?? []);
        if (rulesConfig.baseAcFormula) {
          const apiAttributes = await this.attributeService.formatAttributes(
            personaje.attributes,
            personaje.systems ?? []
          );
          CA = evaluateFormula(rulesConfig.baseAcFormula, apiAttributes);
        } else {
          const dexVal = personaje.attributes.find(a => a.key === 'dex')?.value ?? 10;
          CA = 10 + Math.floor((dexVal / 2) - 5);
        }
      } else if (personaje.traits.includes('barbarian-unarmored-defense')) {
        const conVal = personaje.attributes.find(a => a.key === 'con')?.value ?? 10
        const dexVal = personaje.attributes.find(a => a.key === 'dex')?.value ?? 10
        CA += Math.floor((conVal / 2) - 5) + Math.floor((dexVal / 2) - 5)
      } else if (personaje.traits.includes('monk-unarmored-defense')) {
        const wisVal = personaje.attributes.find(a => a.key === 'wis')?.value ?? 10
        const dexVal = personaje.attributes.find(a => a.key === 'dex')?.value ?? 10
        CA += Math.floor((wisVal / 2) - 5) + Math.floor((dexVal / 2) - 5)
      } else if (personaje.traits.includes('draconid-resistance')) {
        const dexVal = personaje.attributes.find(a => a.key === 'dex')?.value ?? 10
        CA += 3 + Math.floor((dexVal / 2) - 5)
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
      CA: CA + shield + bonus,
      plusSpeed
    }
  }

  private async formatearPersonaje(personaje: PersonajeMongo): Promise<PersonajeApi> {
    const level = personaje.classes.map(cl => cl.level).reduce((acumulador: number, valorActual: number) => acumulador + valorActual, 0)

    const traits = await this.traitRepository.getTraitsByIndexes(personaje?.traits, personaje?.traits_data)
    const invocations = await this.invocacionRepository.obtenerPorIndices(personaje.invocations)
    const skills = [...(personaje?.skills ?? [])]

    const idiomasId = personaje?.languages ?? []
    const proficiencies = await this.proficiencyRepository.getProficienciesByIndices(personaje?.proficiencies ?? [])

    const resistances: Damage[] = []

    const conditional_resistances: { name: string, resistances: Damage[] }[] = []
    const condition_inmunities: { name: string, estados: EstadoApi[] }[] = []

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
        const idx = conditional_resistances.findIndex(name => name.name === (nameTraits[trait.id] ?? trait.name))
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
        speed.walk = trait?.speed
      }
    })

    invocations.forEach(invocation => {
      if (invocation?.skills) {
        skills.push(...invocation?.skills)
      }
    })

    const indexSet = new Set(proficiencies.map(item => item.id));

    // Remove old desc filtering
    const proficienciesFiltrados = proficiencies;

    const proficienciesUnicos = [
      ...new Map(proficienciesFiltrados.map(item => [item.id, item])).values()
    ];

    const idiomas_understands = await this.languageRepository.getLanguagesByIndex(personaje.languages?.understands ?? [])
    const idiomas_speaks = await this.languageRepository.getLanguagesByIndex(personaje.languages?.speaks ?? [])
    const equipment = await this.equipmentRepository.getCharacterEquipmentsByIds(personaje.equipment)

    const clases = personaje.classes

    const spellcasting = (await this.claseRepository.spellcastingClases?.(
      personaje.classes.map(clase => {
        return {
          id: clase.class,
          level: clase.level
        }
      })
    )) ?? []

    const spells = { ...personaje.spells }
    const updatedSpells: Record<string, {
      list: SpellApi[],
      type: string
    }> = {}

    await Promise.all(
      Object.keys(spells).map(async groupSpells => {
        const indices = [...spells[groupSpells]]

        if (!Array.isArray(indices) || indices.length === 0) {
          return
        }

        const dataList = await this.spellRepository.getSpellsByIndexes(indices)
        let type = ""

        if (groupSpells === "race") {
          if (personaje.raceId) {
            const race = await this.raceRepository.obtenerPorId(personaje.raceId)
            if (race?.spellcasting) {
              type = (race.spellcasting as any).key || race.spellcasting
            }
          }
        } else {
          const classSpellcasting = spellcasting.find(item => item?.class === groupSpells)
          if (classSpellcasting?.ability) {
            type = classSpellcasting.ability
          } else {
            const claseData = await this.claseRepository.getById(groupSpells)
            if (claseData?.spellcasting) {
              type = claseData.spellcasting
            }
          }
        }

        updatedSpells[groupSpells] = {
          list: dataList,
          type: attributesLabels[type] ?? ''
        }
      })
    )

    const campaign = await Campaña.findById(personaje?.campaign)
    const dotes = await this.doteRepository.obtenerDotesPorIndices(personaje?.dotes ?? [])
    const modifiedAttributes = this.calcularAttributes(personaje)
    const apiAttributes: CharacterAttributeApi[] = await this.attributeService.formatAttributes(modifiedAttributes, personaje.systems ?? [])

    const initiativeBonusFormula = await this.systemRepository.getInitiativeBonusFormula(personaje.systems ?? []);
    let initiativeBonus = 0;
    if (initiativeBonusFormula) {
      initiativeBonus = evaluateFormula(initiativeBonusFormula, apiAttributes);
    } else {
      const dexAttr = apiAttributes.find(a => a.key === 'dex');
      initiativeBonus = dexAttr?.modifier ?? 0;
    }

    const { CA, plusSpeed } = await this.calcularCA(personaje, traits)
    const rulesConfig = await this.systemRepository.getMergedRulesConfig(personaje.systems ?? []);

    let cargaMaxima: number;
    if (rulesConfig.carryingCapacityFormula) {
      cargaMaxima = evaluateFormula(rulesConfig.carryingCapacityFormula, apiAttributes);
    } else {
      const strVal = apiAttributes.find(a => a.key === 'str')?.value ?? 10;
      cargaMaxima = strVal * 15;
    }

    if (traits?.find(trait => trait.id === "semblance-beast-bear")) {
      cargaMaxima *= 2
    }

    const hasJackOfAllTrades = !!traits?.find(trait => trait.id === "jack-of-all-trades");
    const skillsListEvaluated = await this.skillService.getCharacterSkills(
      skills,
      [...(personaje?.double_skills ?? [])],
      apiAttributes,
      personaje?.prof_bonus ?? 0,
      hasJackOfAllTrades
    );

    const skillsWithPassive = enrichSkillsWithPassive(
      rulesConfig.passiveSkillFormula,
      skillsListEvaluated,
      { attributes: apiAttributes }
    );

    const equipmentWithCombatBonuses = enrichEquipmentWithCombatBonuses({
      equipment: equipment ?? [],
      attributes: apiAttributes,
      proficiencies: proficienciesUnicos,
      proficiencyBonus: personaje?.prof_bonus ?? 0,
      level,
      rules: rulesConfig,
    });

    const forms = await this.criaturaRepository.obtenerPorIndices(personaje?.forms ?? [])
    const money = await this.normalizeAndFormatMoney(personaje);

    return {
      id: personaje._id.toString(),
      img: personaje.img,
      name: personaje.name,
      race: personaje.race,
      size: personaje.size,
      classes: clases,
      subclasses: personaje.subclasses,
      campaign: personaje?.campaign ? { index: personaje?.campaign, name: campaign?.name } : null,
      appearance: personaje?.appearance,
      background: personaje?.background,
      level,
      XP: personaje.XP,
      XPMax: rulesConfig.xpProgression?.[level]
        ?? DEFAULT_XP_PROGRESSION[level]
        ?? DEFAULT_XP_PROGRESSION[level - 1]
        ?? 0,
      attributes: apiAttributes,
      systems: personaje.systems ?? [],
      initiativeBonus,
      HPMax: personaje?.HPMax,
      CA,
      speed: {
        walk: speed.walk + plusSpeed
      },
      skills: skillsWithPassive,
      languages: {
        understands: idiomas_understands,
        speaks: idiomas_speaks,
        notes: idiomasId.notes
      },
      proficiencies: proficienciesUnicos,
      traits,
      traits_data: personaje.traits_data,
      resistances,
      conditional_resistances,
      condition_inmunities,
      prof_bonus: personaje.prof_bonus,
      saving_throws: personaje.saving_throws,
      equipment: equipmentWithCombatBonuses,
      dotes,
      money,
      spells: updatedSpells,
      cargaMaxima,
      spellcasting: spellcasting.filter(item => item !== null),
      invocations,
      forms: forms
    }
  }

  private async normalizeAndFormatMoney(personaje: PersonajeMongo): Promise<({ quantity: number } & CoinApi)[]> {
    const raw = personaje?.money;
    if (!raw) return [];

    if (Array.isArray(raw)) {
      const coinUnits = raw.map(m => m?.unit).filter(Boolean);
      if (coinUnits.length === 0) return [];
      const coins = await this.coinRepository.getCoinsByIds(coinUnits);
      return raw.map(m => {
        const coin = coins.find(c => c.id === m?.unit);
        if (!coin) return null;
        return {
          quantity: m?.quantity ?? 0,
          ...coin
        };
      }).filter(Boolean) as ({ quantity: number } & CoinApi)[];
    }

    if (typeof raw === 'object' && 'unit' in raw && 'quantity' in raw) {
      const coin = await this.coinRepository.getById((raw as any).unit);
      if (!coin) return [];
      return [{
        quantity: (raw as any).quantity ?? 0,
        ...coin
      }];
    }

    if (typeof raw === 'object') {
      const systems = personaje.systems ?? [];
      const coins = await this.coinRepository.getBySystems(systems);
      const result: ({ quantity: number } & CoinApi)[] = [];

      const legacyKeys: { key: string, abbrs: string[], names: string[] }[] = [
        { key: 'pc', abbrs: ['pc', 'cp'], names: ['cobre', 'copper'] },
        { key: 'pp', abbrs: ['pp', 'sp'], names: ['plata', 'silver'] },
        { key: 'pe', abbrs: ['pe', 'ep'], names: ['electrum'] },
        { key: 'po', abbrs: ['po', 'gp'], names: ['oro', 'gold'] },
        { key: 'ppt', abbrs: ['ppt'], names: ['platino', 'platinum'] }
      ];

      for (const legacy of legacyKeys) {
        const qty = (raw as any)[legacy.key];
        if (typeof qty === 'number' && qty > 0) {
          const coin = coins.find(c => 
            legacy.abbrs.includes(c.abbreviation.toLowerCase()) || 
            legacy.names.some(n => c.name.toLowerCase().includes(n))
          );
          if (coin) {
            result.push({
              quantity: qty,
              ...coin
            });
          }
        }
      }

      return result;
    }

    return [];
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

      const usuario = await this.userRepository.getUserName(idUser)

      const background = personaje?.background?.type ? personaje?.background?.name + ' (' + personaje?.background?.type + ')' : personaje?.background?.name

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

      const abilities: string[] = ['str', 'dex', 'con', 'int', 'wis', 'cha']
      const getAttrVal = (key: string) => personaje?.attributes?.find(a => a.key === key)?.value ?? 10
      const getAttrMod = (key: string) => personaje?.attributes?.find(a => a.key === key)?.modifier ?? Math.floor((getAttrVal(key) / 2) - 5)

      const bonus: { [key: string]: number } = {
        str: getAttrMod('str'),
        dex: getAttrMod('dex'),
        con: getAttrMod('con'),
        int: getAttrMod('int'),
        wis: getAttrMod('wis'),
        cha: getAttrMod('cha')
      }

      abilities.forEach(ability => {
        form.getTextField(ability.toUpperCase() + 'score').setText(getAttrVal(ability) + '');
        form.getTextField(ability.toUpperCase() + 'bonus').setText(this.formatNumber(bonus[ability]) + '');

        if (personaje?.saving_throws?.includes(ability)) {
          form.getCheckBox(ability.toUpperCase() + 'savePROF').check()
          form.getTextField(ability.toUpperCase() + 'save').setText(this.formatNumber(bonus[ability] + personaje?.prof_bonus) + '');
        } else {
          form.getTextField(ability.toUpperCase() + 'save').setText(this.formatNumber(bonus[ability]) + '');
        }
      })

      personaje?.skills?.forEach(skill => {
        if (skill?.value) {
          form.getCheckBox(datos[skill?.key][0]).check()
        }
        form.getTextField(datos[skill?.key][1]).setText(this.formatNumber(skill?.modifier) + '');
      })

      if (personaje?.equipment?.find(equi => equi.name === 'Escudo' && equi.equipped)) {
        form.getCheckBox('shieldyes').check();
      }

      const monkTrait = personaje?.traits?.find(trait => trait.id === 'martial-arts')
      let golpeCuerpo = 0

      if (monkTrait) {
        const dado = parseInt(monkTrait.summary.join(' ').split('1d')[1][0])
        const strVal = personaje?.attributes?.find(a => a.key === 'str')?.value ?? 10
        const dexVal = personaje?.attributes?.find(a => a.key === 'dex')?.value ?? 10
        const max = Math.max(strVal, dexVal)
        const daño = Math.floor((max / 2) - 5)

        form.getTextField('Attack1').setText('Cuerpo a cuerpo');
        form.getTextField('AtkBonus1').setText('+' + ((personaje?.prof_bonus ?? 0) + daño));
        form.getTextField('Damage1').setText('1d' + dado + ' +' + daño);
        golpeCuerpo = 1
      }

      personaje?.equipment
        ?.filter(equi => equi?.category === 'Arma')
        ?.forEach((equi, index: number) => {
          if (index + golpeCuerpo < 3) {
            form.getTextField('Attack' + (index + golpeCuerpo + 1)).setText(equi.name + " " + (equi.isMagic ? " +1" : ""));
            form.getTextField('AtkBonus' + (index + golpeCuerpo + 1)).setText('+' + this.sumaGolpe(personaje, equi));
            form.getTextField('Damage' + (index + golpeCuerpo + 1)).setText(
              equi?.weapon?.damage?.map(damage => {
                return damage?.dice + ' +' + this.sumaDaño(personaje, equi) + ' ' + damage?.name
              }).join(", ")
            );
          }
        })

      const moneyArray = Array.isArray(personaje?.money) ? personaje.money : [];
      const getCoinQty = (abbrs: string[], names: string[]) => {
        const found = moneyArray.find(m => 
          (m?.abbreviation && abbrs.includes(m.abbreviation.toLowerCase())) ||
          (m?.name && names.some(n => m.name.toLowerCase().includes(n)))
        );
        return found ? (found.quantity ?? 0) : 0;
      };

      form.getTextField('Copper').setText(getCoinQty(['pc', 'cp'], ['cobre', 'copper']) + '');
      form.getTextField('Silver').setText(getCoinQty(['pp', 'sp'], ['plata', 'silver']) + '');
      form.getTextField('Electrum').setText(getCoinQty(['pe', 'ep'], ['electrum']) + '');
      form.getTextField('Gold').setText(getCoinQty(['po', 'gp'], ['oro', 'gold']) + '');
      form.getTextField('Platinum').setText(getCoinQty(['ppt', 'pp'], ['platino', 'platinum']) + '');

      form.getTextField('HPMax').setText(personaje?.HPMax + '');
      form.getTextField('ProfBonus').setText('+' + personaje?.prof_bonus);
      form.getTextField('AC').setText(personaje?.CA + '');
      form.getTextField('Init').setText(this.formatNumber(personaje.initiativeBonus) + '');
      form.getTextField('Speed').setText(personaje?.speed?.walk + '');

      form.getTextField('HitDiceTotal').setText(personaje.classes?.map(clase => clase.level + 'd' + (clase.hit_die ?? "?"))?.join(' / ') + '');

      const skillPerception = personaje?.skills?.find(skill => skill?.key === 'perception')
      const passivePerception = skillPerception?.passive;

      if (passivePerception !== undefined) {
        form.getTextField('PWP').setText(String(passivePerception));
      } else if (skillPerception) {
        form.getTextField('PWP').setText(10 + skillPerception.modifier + '');
      } else {
        form.getTextField('PWP').setText(10 + bonus.wis + '');
      }

      escribirRasgos({
        traits: personaje?.traits ?? [],
        invocations: personaje?.invocations ?? [],
        disciplines: [],//personaje?.disciplines,
        metamagic: [],//personaje?.metamagic,
        dotes: personaje?.dotes ?? [],
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

      // Descargar la imagen usando fetch nativo
      if (personaje?.img) {
        const imageResponse = await fetch(personaje?.img);
        if (!imageResponse.ok) {
          throw new Error(`Error descargando la imagen: ${imageResponse.statusText}`);
        }
        const imageBytes = new Uint8Array(await imageResponse.arrayBuffer()); // Obtener los bytes de la imagen
        const contentType = String(imageResponse.headers.get('content-type') || '');

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

  private calcularAttributes(personaje: PersonajeMongo): { key: string, value: number }[] {
    const attributes = personaje.attributes ?? []

    if (personaje?.traits?.includes('primal-champion')) {
      return attributes.map(attr => {
        let val = attr.value
        if (attr.key === 'str' || attr.key === 'con') {
          val += 4
        }
        return { key: attr.key, value: val }
      })
    }

    return attributes
  }

  private sumaDaño(character: PersonajeApi, equip: CharacterEquipmentApi) {
    if (equip.damageBonus !== undefined) {
      let suma = equip.damageBonus;

      if (
        equip?.weapon?.range === 'Distancia'
        && character?.traits?.map(trait => trait.id)?.includes("fighter-fighting-style-archery")
      ) {
        suma += 2;
      }

      return suma;
    }

    let suma = equip?.isMagic ? 1 : 0

    const getAttrVal = (key: string) => character.attributes?.find(a => a.key === key)?.value ?? 10

    if (equip?.weapon?.properties.find(prop => prop.name.toLowerCase() === 'finesse' || prop.name.toLowerCase() === 'sutileza')) {
      const max = Math.max(getAttrVal('str'), getAttrVal('dex'))

      suma += Math.floor((max / 2) - 5)
    } else if (equip?.weapon?.range === 'Distancia') {
      suma += Math.floor((getAttrVal('dex') / 2) - 5)
      if (character?.traits?.map(trait => trait.id)?.includes("fighter-fighting-style-archery")) {
        suma += 2
      }
    } else {
      suma += Math.floor((getAttrVal('str') / 2) - 5)
    }

    return suma
  }

  private sumaGolpe(character: PersonajeApi, equip: CharacterEquipmentApi) {
    if (equip.attackBonus !== undefined) {
      return equip.attackBonus;
    }

    let suma = 0

    suma += this.sumaDaño(character, equip)

    if (character?.proficiencies?.some(arma => equip?.proficiencies?.some(p => p.id === arma?.id))) {
      suma += character?.prof_bonus ?? 0
    }

    return suma
  }

  private formatNumber(num: number) {
    return (num >= 0 ? "+" : "") + num.toString();
  }
}