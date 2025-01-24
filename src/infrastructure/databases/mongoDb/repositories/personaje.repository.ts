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
import { escribirCompetencias, escribirEquipo, escribirRasgos, escribirTransfondo } from '../../../../utils/escribirPdf';
import axios from 'axios';
import IUsuarioRepository from '../../../../domain/repositories/IUsuarioRepository';
import UsuarioRepository from './usuario.repository';

const fs = require('fs');
const path = require('path');
const { PDFDocument } = require('pdf-lib');

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
  transfondoRepository: ITransfondoRepository
  usuarioRepository: IUsuarioRepository

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
    this.transfondoRepository = new TransfondoRepository()
    this.usuarioRepository = new UsuarioRepository()
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
    
    const dataBackground = { ...background }

    const transfondos = await this.transfondoRepository.obtenerTodos()
    const transfondo = transfondos.find(tra => tra.index === background.index)
    
    dataBackground.name = transfondo?.name ?? ''

    const traits = [
       ...raza?.traits ?? [], 
       ...subraza?.traits ?? [], 
       ...claseDataLevel?.traits ?? [],
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

    let money = 0

    if (transfondo?.money?.unit === 'po') {
      money += transfondo?.money?.quantity * 100
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
      subclasses: [],
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
      proficiency_weapon: proficiency_weapon.map((prof: any) => prof.index),
      proficiency_armor: proficiency_armor.map((prof: any) => prof.index),
      proficiencies: [
        ...raza?.starting_proficiencies?.filter((prof: any) => prof.type === 'herramienta')?.map((prof: any) => prof.index) ?? [],
        ...subraza?.starting_proficiencies?.filter((prof: any) => prof.type === 'herramienta')?.map((prof: any) => prof.index) ?? [],
        ...data?.proficiencies ?? []
      ],
      spells: [...raza?.spells ?? [], ...subraza?.spells ?? [], ...spells ?? []],
      equipment: equipmentData,
      money,
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
    const dataLevelOld = claseData.levels.find((l:any)=> l.level === level)

    const subclasesData = await this.claseRepository.formatearSubclasesType(dataLevel.subclasses_options, dataLevel.subclasses)
    
    const traits: any[] = []
    
    Object.keys(dataLevel.traits_data).forEach(t => {
      const data = dataLevel.traits_data[t]
      const dataOld = dataLevelOld.traits_data[t]

      if (this.valoresNumericosDistintos(data, dataOld)) {
        const trait = this.rasgoRepository.obtenerRasgoPorIndice(t)
      
        let desc: string = trait?.desc ?? ''

        Object.keys(data).forEach(d => {
          desc = desc.replaceAll(d, data[d])
        })

        traits.push({ ...trait, desc })
      }
    })

    traits.push(
      ...this.rasgoRepository
        .obtenerRasgosPorIndices(
          dataLevel.traits?.filter((t: any) => !traits.map(trait => trait.index).includes(t))
        )
    )

    let traits_options = null

    personaje?.subclasses?.forEach(s => {
      if (dataLevel?.subclasses && dataLevel?.subclasses[s]?.traits) {
        traits.push(
          ...this.rasgoRepository
            .obtenerRasgosPorIndices(
              dataLevel?.subclasses[s]?.traits?.filter((t: any) => !traits.map(trait => trait.index).includes(t))
            )
        )
      }

      if (dataLevel?.subclasses && dataLevel?.subclasses[s]?.traits_options) {
        traits_options = dataLevel?.subclasses[s]?.traits_options

        if (traits_options) {
          traits_options.options = this.rasgoRepository.obtenerRasgosPorIndices(dataLevel?.subclasses[s]?.traits_options?.options ?? [])
        }
      }
    })

    return {
      hit_die: claseData?.hit_die,
      prof_bonus: dataLevel.prof_bonus === dataLevelOld?.prof_bonus ? null : dataLevel.prof_bonus,
      traits,
      traits_options,
      ability_score: dataLevel?.ability_score,
      subclasesData
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

    const { hit, clase, abilities, subclases, trait } = data.data

    const personaje = await Personaje.findById(id);
    const level = personaje?.classes?.find(clas => clas.class === clase)?.level ?? 0

    const claseData = await this.claseRepository.getClase(clase)
    const dataLevel = claseData.levels.find((l:any)=> l.level === level+1)

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

    if (!armadura && traits.includes('barbarian-unarmored-defense')) {
      CA += Math.floor((personaje?.abilities.con/2) - 5) + Math.floor((personaje?.abilities.dex/2) - 5)
    }

    let plusSpeed = 0

    if (!armadura && traits.includes('fast-movement')) {
      plusSpeed += 10
    }

    const resultado = await Personaje.findByIdAndUpdate(
      id,
      {
        $set: {
          XP: 0,
          traits_data: { ...personaje?.traits_data, ...dataLevel?.traits_data },
          prof_bonus: dataLevel?.prof_bonus ?? personaje?.prof_bonus,
          traits: [...personaje?.traits ?? [], ...dataLevel?.traits ?? [], ...traitsSubclase ?? []],
          plusSpeed,
          abilities,
          CA: CA + shield,
          subclasses: [...personaje?.subclasses ?? [], ...subclases ?? []]
        },
        $inc: { 
          'classes.$[elem].level': 1,
          HPMax: hit + Math.floor((personaje?.abilities?.con/2) - 5),
          HPActual: hit + Math.floor((personaje?.abilities?.con/2) - 5)
        }
      },
      {
        arrayFilters: [{ 'elem.class': clase }],
        new: true 
      }
    );
 
/*
    if (!resultado) {
      console.log('No se encontró el personaje o no se realizó la actualización.');
    } else {
      console.log('Actualización exitosa:', resultado);
    }*/

    return resultado
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

    if (!armadura && personaje?.traits.includes('barbarian-unarmored-defense')) {
      CA += Math.floor((personaje?.abilities.con/2) - 5) + Math.floor((personaje?.abilities.dex/2) - 5)
    }

    let plusSpeed = 0

    if (!armadura && personaje?.traits.includes('fast-movement')) {
      plusSpeed += 10
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
      XPMax: nivel[level-1]
    }
  }

  async formatearPersonaje(personaje: any): Promise<any> {
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

    return {
      id: personaje._id.toString(),
      img: personaje.img,
      name: personaje.name,
      race: personaje.race,
      classes: clases,
      appearance: personaje?.appearance,
      background: personaje?.background,
      level,
      XP: personaje.XP,
      XPMax: nivel[level-1],
      abilities: personaje?.abilities,
      HPMax: personaje?.HPMax,
      CA: personaje?.CA,
      speed: personaje?.speed + personaje?.plusSpeed,
      skills: habilidades,
      languages: idiomas,
      weapons,
      armors,
      proficiencies,
      traits: traitsData,
      prof_bonus: personaje.prof_bonus,
      saving_throws: personaje.saving_throws,
      equipment: equipo,
      money: personaje?.money ?? 0
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
    const pdfPath = path.join(__dirname, '../../../../utils/hoja-nueva.pdf');
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
      
      const fields = form.getFields();
      fields.forEach((field: any) => {
        const fieldName = field.getName(); // Nombre del campo
        const fieldType = field.constructor.name; // Tipo del campo
        //if (fieldName.includes('Dice')) {
          //console.log(`Nombre: ${fieldName}, Tipo: ${fieldType}`);
        //}
      });
      //console.log('_________________');

      const usuario = await this.usuarioRepository.nombreUsuario(idUser)
 
      form.getTextField('CharacterName').setText(personaje?.name);
      form.getTextField('ClassLevel').setText(personaje?.classes?.map((cl: any) => cl?.name + ' ' + cl?.level)?.join(', '));
      form.getDropdown('Background').addOptions([personaje?.background?.name + ' (' + personaje?.background?.type + ')']);
      form.getDropdown('Background').select(personaje?.background?.name + ' (' + personaje?.background?.type + ')');
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
          form.getTextField(datos[skill?.index][1]).setText(this.formatNumber(bonus[skill.ability_score] + personaje?.prof_bonus) + '');
        } else {
          form.getTextField(datos[skill?.index][1]).setText(this.formatNumber(bonus[skill.ability_score]) + '');
        }
      })
 
      if(personaje?.equipment?.find((equi: any) => equi.name === 'Escudo' && equi.equipped)) {
        form.getCheckBox('shieldyes').check();
      }

      personaje?.equipment
        ?.filter((equi: any) => equi?.category === 'Arma')
        ?.forEach((equi: any, index: number) => {
          if (index < 3) {
            form.getTextField('Attack' + (index+1)).setText(equi.name);
            form.getTextField('AtkBonus' + (index+1)).setText('+' + this.sumaGolpe(personaje, equi));
            form.getTextField('Damage' + (index+1)).setText(equi?.weapon?.damage?.dice + ' +' + this.sumaDaño(personaje, equi) + ' ' + equi?.weapon?.damage?.name);
          }
        })

      form.getTextField('Copper').setText(personaje?.money % 10 + '');
      form.getTextField('Silver').setText((personaje?.money / 10) % 10 + '');
      form.getTextField('Electrum').setText('0');
      form.getTextField('Gold').setText(personaje?.money / 100 + '');
      form.getTextField('Platinum').setText('0');
      
      form.getTextField('HPMax').setText(personaje?.HPMax + '');
      form.getTextField('ProfBonus').setText('+' + personaje?.prof_bonus);
      form.getTextField('AC').setText(personaje?.CA + '');
      form.getTextField('Init').setText(this.formatNumber(bonus.dex) + '');
      form.getTextField('Speed').setText(personaje?.speed + '');

      form.getTextField('HitDiceTotal').setText(personaje.classes?.map((clase: any) => clase.level)?.join(' / ') + '');
      form.getTextField('Text1').setText(personaje.classes?.map((clase: any) => 'd' + clase.hit_die)?.join(' / ') + '');

      if (personaje?.skills?.find((skill: any) => skill?.index === 'perception' && skill?.competencia)) {
        form.getTextField('PWP').setText(10 + bonus.dex + personaje?.prof_bonus + '');
      } else {
        form.getTextField('PWP').setText(10 + bonus.dex + '');
      }

      escribirRasgos({
        traits: personaje?.traits,
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
        equipment: personaje?.equipment
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
    //nuevoPdf.addPage(pag3);

    const pdfBytes = await nuevoPdf.save();
  
    return pdfBytes
  }

  formatNumber(num: any) {
    return (num >= 0 ? "+" : "") + num.toString();
  }
}
