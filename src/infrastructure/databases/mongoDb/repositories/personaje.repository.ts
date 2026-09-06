import IPersonajeRepository from '../../../../domain/repositories/IPersonajeRepository';
import Personaje from '../schemas/Personaje';
import IUserRepository from '../../../../domain/repositories/IUserRepository';
import ISpellRepository from '../../../../domain/repositories/ISpellRepository';
import { ClaseLevelUpCharacter, PersonajeApi, PersonajeBasico, PersonajeMongo, TypeAddEquipment, TypeCrearPersonaje, TypeDeleteEquipment, TypeEquiparArmadura, TypeToggleFavoriteEquipment, ToggleFavoriteEquipmentResponse, TypeSubirNivel, UpdateCharacterMoneyResponse, UpdateCharacterEquipmentResponse } from '../../../../domain/types/personajes.types';
import { NotFoundError, ConflictError, ValidationError, AppError } from '../../../../domain/errors/AppError';
import { Damage } from '../../../../domain/types';
import AttributeService from '../../../../domain/services/attribute.service';
import SkillService from '../../../../domain/services/skill.service';
import { canAccessCharacter } from '../../../../domain/services/characterAccess';
import { ICampaignReader } from '../../../../domain/ports/ICampaignReader';
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
import { CharacterAttributeApi } from '../../../../domain/types/attribute.types';
import { evaluateFormula, enrichSkillsWithPassive } from '../../../../utils/formulaEvaluator';
import { enrichEquipmentWithCombatBonuses } from '../../../../utils/combatBonuses';
import ISystemRepository from '../../../../domain/repositories/ISystemRepository';
import ICoinRepository from '../../../../domain/repositories/ICoinRepository';
import { CoinApi } from '../../../../domain/types/coin.types';
import {
  buildPersonajeMoneyItems,
  getOrphanUnitIds,
  parseCharacterMoneyQuantities,
} from '../../../../utils/characterMoney';
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
    private readonly coinRepository: ICoinRepository,
    private readonly campaignReader: ICampaignReader
  ) { }

  async consultarPorUsuario(id: string): Promise<PersonajeBasico[]> {
    try {
      const personajes = await Personaje.find({ user: id })
        .collation({ locale: 'es', strength: 1 })
        .sort({ name: 1 });

      const userName = await this.userRepository.getUserName(id);
      return this.formatBasicCharacters(personajes, userName)
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
      return await this.formatBasicCharacter(resultado)
    } else {
      return null
    }
  }

  async consultarPorId(idCharacter: string, user: string): Promise<PersonajeApi> {
    const personaje = await Personaje.findById(idCharacter);

    if (!personaje) {
      throw new NotFoundError(`No se encontró el personaje con id: ${idCharacter}`);
    }

    await this.assertCanAccessCharacter(personaje, user);

    return this.formatCharacter(personaje);
  }

  async addEquipment(data: TypeAddEquipment): Promise<UpdateCharacterEquipmentResponse> {
    const { id, equip, quantity, isMagic, isBond } = data;
    const personaje = await Personaje.findById(id);

    if (!personaje) {
      throw new NotFoundError(`No se encontró el personaje con id: ${id}`);
    }

    const equipment = [...(personaje.equipment ?? [])];
    const normalizedIsMagic = !!isMagic;
    const normalizedIsBond = !!isBond;

    if (normalizedIsBond) {
      equipment.push({
        id: equip,
        quantity,
        isMagic: normalizedIsMagic,
        isBond: true,
        equipped: false,
      });
    } else {
      const idx = equipment.findIndex(
        eq => eq.id === equip && !!eq.isMagic === normalizedIsMagic && !eq.isBond
      );

      if (idx > -1) {
        equipment[idx].quantity += quantity;
      } else {
        equipment.push({
          id: equip,
          quantity,
          isMagic: normalizedIsMagic,
          equipped: false,
          isBond: false,
        });
      }
    }

    const resultado = await Personaje.findByIdAndUpdate(
      id,
      { $set: { equipment } },
      { returnDocument: "after" }
    );

    if (!resultado) {
      throw new NotFoundError(`No se encontró el personaje con id: ${id}`);
    }

    return {
      equipment: await this.formatCharacterEquipment(resultado),
    };
  }

  async deleteEquipment(data: TypeDeleteEquipment): Promise<UpdateCharacterEquipmentResponse> {
    const { id, equip, quantity, isMagic, isBond } = data;
    const personaje = await Personaje.findById(id);

    if (!personaje) {
      throw new NotFoundError(`No se encontró el personaje con id: ${id}`);
    }

    const equipment = [...(personaje.equipment ?? [])];
    const normalizedIsMagic = !!isMagic;
    const normalizedIsBond = !!isBond;

    const idx = equipment.findIndex(
      eq =>
        eq.id === equip
        && !!eq.isMagic === normalizedIsMagic
        && !!eq.isBond === normalizedIsBond
    );

    if (idx === -1) {
      throw new NotFoundError("No se encontró el equipamiento en el personaje");
    }

    const item = equipment[idx];

    if (item.isFavorite || item.equipped) {
      throw new ConflictError(
        "No se puede eliminar un equipamiento favorito o equipado"
      );
    }

    if (normalizedIsBond) {
      if (normalizedIsMagic) {
        equipment[idx] = { ...item, isBond: false };
      } else {
        equipment.splice(idx, 1);
      }
    } else if (item.quantity <= quantity) {
      equipment.splice(idx, 1);
    } else {
      equipment[idx] = { ...item, quantity: item.quantity - quantity };
    }

    const resultado = await Personaje.findByIdAndUpdate(
      id,
      { $set: { equipment } },
      { returnDocument: "after" }
    );

    if (!resultado) {
      throw new NotFoundError(`No se encontró el personaje con id: ${id}`);
    }

    return {
      equipment: await this.formatCharacterEquipment(resultado),
    };
  }

  async equiparArmadura(data: TypeEquiparArmadura): Promise<{ completo: PersonajeApi, basico: PersonajeBasico }> {
    const { id, equip, equipped, isMagic, isBond } = data;
    const normalizedIsMagic = !!isMagic;
    const normalizedIsBond = !!isBond;

    const personaje = await Personaje.findById(id);
    if (!personaje) {
      throw new NotFoundError(`No se encontró el personaje con id: ${id}`);
    }

    const equipment = [...(personaje.equipment ?? [])];
    const idx = equipment.findIndex(
      eq =>
        eq.id === equip
        && !!eq.isMagic === normalizedIsMagic
        && !!eq.isBond === normalizedIsBond
    );

    if (idx === -1) {
      throw new NotFoundError("No se encontró el equipamiento en el personaje");
    }

    if (equipped) {
      const formatted = await this.equipmentRepository.getCharacterEquipmentsByIds(equipment) ?? [];

      const matchesItem = (
        raw: { id?: string; isMagic?: boolean; isBond?: boolean },
        fmt: { id: string; isMagic?: boolean; isBond?: boolean }
      ) =>
        fmt.id === raw.id
        && !!fmt.isMagic === !!raw.isMagic
        && !!fmt.isBond === !!raw.isBond;

      const targetFormatted = formatted.find(fmt => matchesItem(equipment[idx], fmt));
      const targetSlot = targetFormatted?.equipSlot ?? null;

      if (!targetSlot) {
        throw new ValidationError("El equipamiento no tiene ranura de equipamiento (equipSlot)");
      }

      for (let i = 0; i < equipment.length; i++) {
        if (i === idx) continue;
        const itemFormatted = formatted.find(fmt => matchesItem(equipment[i], fmt));
        if (itemFormatted?.equipSlot === targetSlot) {
          equipment[i] = { ...equipment[i], equipped: false };
        }
      }

      equipment[idx] = { ...equipment[idx], equipped: true };
    } else {
      equipment[idx] = { ...equipment[idx], equipped: false };
    }

    const resultado = await Personaje.findByIdAndUpdate(
      id,
      { $set: { equipment } },
      { returnDocument: "after" }
    );

    if (!resultado) {
      throw new NotFoundError(`No se encontró el personaje con id: ${id}`);
    }

    const completo = await this.formatCharacter(resultado);
    const basico = await this.formatBasicCharacter(resultado);

    return { completo, basico };
  }

  async toggleFavoriteEquipment(data: TypeToggleFavoriteEquipment): Promise<ToggleFavoriteEquipmentResponse> {
    const { id, equip, isMagic, isBond, isFavorite } = data;
    const normalizedIsMagic = !!isMagic;
    const normalizedIsBond = !!isBond;

    const updated = await Personaje.findOneAndUpdate(
      {
        _id: id as any,
        equipment: {
          $elemMatch: {
            id: equip,
            isMagic: normalizedIsMagic,
            isBond: normalizedIsBond,
          },
        },
      },
      { $set: { "equipment.$[elem].isFavorite": isFavorite } },
      {
        arrayFilters: [
          {
            "elem.id": equip,
            "elem.isMagic": normalizedIsMagic,
            "elem.isBond": normalizedIsBond,
          },
        ],
        returnDocument: "after",
      }
    );

    if (updated) {
      return {
        id,
        equip,
        isMagic: normalizedIsMagic,
        isBond: normalizedIsBond,
        isFavorite,
      };
    }

    const personaje = await Personaje.findById(id);

    if (!personaje) {
      throw new NotFoundError(`No se encontró el personaje con id: ${id}`);
    }

    const equipment = personaje.equipment ?? [];
    const idx = equipment.findIndex(
      eq => eq.id === equip && !!eq.isMagic === normalizedIsMagic && !!eq.isBond === normalizedIsBond
    );

    if (idx === -1) {
      throw new NotFoundError("No se encontró el equipamiento en el personaje");
    }

    equipment[idx].isFavorite = isFavorite;

    await Personaje.findByIdAndUpdate(
      id,
      { $set: { equipment } },
      { returnDocument: "after" }
    );

    return {
      id,
      equip,
      isMagic: normalizedIsMagic,
      isBond: normalizedIsBond,
      isFavorite,
    };
  }

  async updateMoney(id: string, money: { quantity: number; unit: string }[]): Promise<UpdateCharacterMoneyResponse> {
    const moneyArray = Array.isArray(money)
      ? money
      : (money && typeof money === "object" && "unit" in money ? [money] : []);

    const resultado = await Personaje.findByIdAndUpdate(
      id,
      {
        $set: {
          money: moneyArray,
        },
      },
      { returnDocument: "after" }
    );

    if (!resultado) {
      throw new NotFoundError(`No se encontró el personaje con id: ${id}`);
    }

    const formattedMoney = await this.normalizeAndFormatMoney(resultado);

    return { money: formattedMoney };
  }

  async updateXp(id: string, xp: number, userId: string): Promise<void> {
    const personaje = await Personaje.findById(id);

    if (!personaje) {
      throw new NotFoundError(`No se encontró el personaje con id: ${id}`);
    }

    await this.assertCanAccessCharacter(personaje, userId);

    await Personaje.findByIdAndUpdate(id, { $set: { XP: xp } });
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

    const completo = await this.formatCharacter(resultado)
    const basico = await this.formatBasicCharacter(resultado)

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
      return this.formatBasicCharacters(personajes)
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

    return this.formatBasicCharacter(personaje)
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

    const completo = await this.formatCharacter(resultado)
    const basico = await this.formatBasicCharacter(resultado)

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

    const personajeFormateado = await this.formatCharacter(resultado)

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

    const personajeFormateado = await this.formatCharacter(resultado)

    return personajeFormateado
  }

  private async assertCanAccessCharacter(
    personaje: PersonajeMongo,
    userId: string
  ): Promise<void> {
    const campaign = personaje.campaign
      ? await this.campaignReader.getById(personaje.campaign)
      : null;

    if (!canAccessCharacter({
      ownerId: personaje.user,
      campaignMasterId: campaign?.master,
      userId,
    })) {
      throw new AppError('No tienes permiso para consultar este personaje', 403);
    }
  }

  private async formatBasicCharacters(personajes: PersonajeMongo[], userName?: string): Promise<PersonajeBasico[]> {
    const campaignIds = [...new Set(
      personajes
        .map((p) => p.campaign)
        .filter((id): id is string => Boolean(id))
    )];

    const campaignMap = await this.campaignReader.getNamesByIds(campaignIds);

    return Promise.all(personajes.map((personaje) => {
      const campaignName = personaje.campaign
        ? campaignMap.get(personaje.campaign.toString())
        : undefined;
      return this.formatBasicCharacter(personaje, userName, campaignName);
    }));
  }

  private async formatBasicCharacter(personaje: PersonajeMongo, userName?: string, campaignName?: string): Promise<PersonajeBasico> {
    const level = personaje?.classes?.map((cl: any) => cl.level).reduce((acumulador: number, valorActual: number) => acumulador + valorActual, 0) ?? 0
    const user = userName ?? await this.userRepository.getUserName(personaje?.user ?? null)

    const traits = await this.traitRepository.getTraitsByIndexes(personaje?.traits, personaje?.traits_data)
    const { CA } = await this.calcularCA(personaje, traits)
    const rulesConfig = await this.systemRepository.getMergedRulesConfig(personaje.systems ?? []);

    let finalCampaignName = campaignName;
    if (finalCampaignName === undefined) {
      if (personaje?.campaign) {
        const campaign = await this.campaignReader.getById(personaje.campaign);
        finalCampaignName = campaign?.name ?? '';
      } else {
        finalCampaignName = '';
      }
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

  private async formatCharacter(personaje: PersonajeMongo): Promise<PersonajeApi> {
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

    const campaignSummary = personaje?.campaign
      ? await this.campaignReader.getById(personaje.campaign)
      : null;
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

    let maxCarryingCapacity: number;
    if (rulesConfig.carryingCapacityFormula) {
      maxCarryingCapacity = evaluateFormula(rulesConfig.carryingCapacityFormula, apiAttributes);
    } else {
      const strVal = apiAttributes.find(a => a.key === 'str')?.value ?? 10;
      maxCarryingCapacity = strVal * 15;
    }

    if (traits?.find(trait => trait.id === "semblance-beast-bear")) {
      maxCarryingCapacity *= 2
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
      campaign: personaje?.campaign ? { index: personaje?.campaign, name: campaignSummary?.name } : null,
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
      maxCarryingCapacity,
      spellcasting: spellcasting.filter(item => item !== null),
      invocations,
      forms: forms
    }
  }

  private async formatCharacterEquipment(
    personaje: PersonajeMongo
  ): Promise<CharacterEquipmentApi[]> {
    const level =
      personaje.classes?.map(cl => cl.level).reduce((acc, value) => acc + value, 0) ?? 0;

    const [equipment, apiAttributes, baseProficiencies, traits, rulesConfig] = await Promise.all([
      this.equipmentRepository.getCharacterEquipmentsByIds(personaje.equipment ?? []),
      this.attributeService.formatAttributes(
        this.calcularAttributes(personaje),
        personaje.systems ?? []
      ),
      this.proficiencyRepository.getProficienciesByIndices(personaje?.proficiencies ?? []),
      this.traitRepository.getTraitsByIndexes(personaje?.traits, personaje?.traits_data),
      this.systemRepository.getMergedRulesConfig(personaje.systems ?? []),
    ]);

    const proficiencies = [
      ...new Map(
        [
          ...baseProficiencies,
          ...traits.flatMap(trait => trait.proficiencies ?? []),
        ].map(item => [item.id, item])
      ).values(),
    ];

    return enrichEquipmentWithCombatBonuses({
      equipment: equipment ?? [],
      attributes: apiAttributes,
      proficiencies,
      proficiencyBonus: personaje?.prof_bonus ?? 0,
      level,
      rules: rulesConfig,
    });
  }

  private async normalizeAndFormatMoney(personaje: PersonajeMongo): Promise<({ quantity: number } & CoinApi)[]> {
    const systems = personaje.systems ?? [];
    const raw = personaje?.money;

    if (systems.length === 0) {
      return this.formatMoneyFromUnitsOnly(raw);
    }

    const systemCoins = await this.coinRepository.getBySystems(systems);
    const quantities = parseCharacterMoneyQuantities(raw, systemCoins);
    const orphanUnitIds = getOrphanUnitIds(quantities, systemCoins);
    const orphanCoins = orphanUnitIds.length > 0
      ? await this.coinRepository.getCoinsByIds(orphanUnitIds)
      : [];

    return buildPersonajeMoneyItems(systemCoins, quantities, orphanCoins);
  }

  private async formatMoneyFromUnitsOnly(raw: unknown): Promise<({ quantity: number } & CoinApi)[]> {
    const quantities = parseCharacterMoneyQuantities(raw);
    const unitIds = [...quantities.keys()];

    if (unitIds.length === 0) {
      return [];
    }

    const coins = await this.coinRepository.getCoinsByIds(unitIds);
    return unitIds
      .map(unitId => {
        const coin = coins.find(c => c.id === unitId);
        if (!coin) return null;
        return {
          quantity: quantities.get(unitId) ?? 0,
          ...coin,
        };
      })
      .filter(Boolean) as ({ quantity: number } & CoinApi)[];
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

}
