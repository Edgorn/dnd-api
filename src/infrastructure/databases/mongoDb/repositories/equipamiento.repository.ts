import IDañoRepository from '../../../../domain/repositories/IDañoRepository';
import IEquipamientoRepository from '../../../../domain/repositories/IEquipamientoRepository';
import IPropiedadArmaRepository from '../../../../domain/repositories/IPropiedadesArmas';
import { EquipamientoPersonajeMongo, EquipamientoPersonajeApi, EquipamientoMongo, EquipamientoOpcionesMongo, EquipamientoChoiceApi, EquipamientoApi, WeaponMongo, WeaponApi, WeaponDamageMongo, WeaponDamageApi } from '../../../../domain/types/equipamientos.types';
import { ordenarPorNombre } from '../../../../utils/formatters';
import EquipamientoSchema from '../schemas/Equipamiento';
import DañoRepository from './daño.repository';
import PropiedadArmaRepository from './propiedadesArmas.repository';

export default class EquipamientoRepository implements IEquipamientoRepository {
  private equipamientosMap: Record<string, EquipamientoMongo>

  dañoRepository: IDañoRepository
  propiedadesRepository: IPropiedadArmaRepository

  constructor(dañoRepository?: IDañoRepository, propiedadesRepository?: IPropiedadArmaRepository) {
    this.equipamientosMap = {}
    this.dañoRepository = dañoRepository ?? this.crearDañoRepositorioPorDefecto()
    this.propiedadesRepository = propiedadesRepository ?? this.crearPropiedadesRepositorioPorDefecto()
  }
  
  private crearDañoRepositorioPorDefecto(): IDañoRepository {
    return new DañoRepository();
  }
  
  private crearPropiedadesRepositorioPorDefecto(): IPropiedadArmaRepository {
    return new PropiedadArmaRepository();
  }

  async obtenerEquipamientosPersonajePorIndices(equipamientos: EquipamientoPersonajeMongo[]): Promise<EquipamientoPersonajeApi[] | undefined> {
    if (!equipamientos) return undefined;
    if (!equipamientos?.length) return [];

    const result: EquipamientoMongo[] = [];
    const missing: EquipamientoPersonajeMongo[] = [];

    equipamientos.forEach(equipamiento => {
      if (this.equipamientosMap[equipamiento.index]) {
        result.push(this.equipamientosMap[equipamiento.index]);
      } else {
        missing.push(equipamiento);
      }
    })

    if (missing.length > 0) {
      const equipamientosAux = await EquipamientoSchema.find({ index: { $in: missing?.map(miss => miss.index) } })
      equipamientosAux.forEach(equipamiento => (this.equipamientosMap[equipamiento.index] = equipamiento));
      result.push(...equipamientosAux);
    }

    const equipamiento = await this.formatearEquipamientosPersonaje(equipamientos, result)

    return ordenarPorNombre(equipamiento);
  }
  
  formatearOpcionesDeEquipamientos(equipamientosOptions: EquipamientoOpcionesMongo[][] | undefined): Promise<EquipamientoChoiceApi[][]> | undefined {
    if (!equipamientosOptions) return undefined
    
    return Promise.all(equipamientosOptions.map(
      equipamientoOptions => this.formatearOpcionesDeEquipamiento(equipamientoOptions)
    ))
  }

  formatearEquipamientosPersonaje(equipamientos: EquipamientoPersonajeMongo[], equipamientosMongo: EquipamientoMongo[]): Promise<EquipamientoPersonajeApi[]> {
    return Promise.all(equipamientos.map(equipamiento => this.formatearEquipamientoPersonaje(equipamiento, equipamientosMongo)));
  }

  async formatearEquipamientoPersonaje(equipamiento: EquipamientoPersonajeMongo, equipamientosMongo: EquipamientoMongo[]): Promise<EquipamientoPersonajeApi> {
    const equipamientoAux = equipamientosMongo.find(eq => eq.index === equipamiento.index)
    
    if (equipamientoAux) {
      const weapon = await this.formatearWeapon(equipamientoAux.weapon)
      const content = await this.obtenerEquipamientosPersonajePorIndices(equipamientoAux?.content ?? [])

  
      return {
        index: equipamientoAux.index,
        name: equipamientoAux.name,
        quantity: equipamiento.quantity,
        content,
        category: equipamientoAux.category,
        weapon: weapon,
        armor: equipamientoAux.armor,
        isMagic: equipamiento.isMagic,
        weight: equipamientoAux.weight
      }
    } else {
      return {
        index: equipamiento.index,
        name: equipamiento.index,
        quantity: equipamiento.quantity,
        content: [],
        isMagic: equipamiento.isMagic,
        weight: 0
      }
    }
  }

  async formatearWeapon(weapon: WeaponMongo | undefined): Promise<WeaponApi | undefined> {
    if (!weapon) return undefined

    const damage = await this.obtenerDamages(weapon?.damage ?? [])
    const properties = await this.propiedadesRepository.obtenerPropiedadesPorIndices(weapon?.properties ?? [])
    const two_handed_damage = await this.obtenerDamages(weapon?.two_handed_damage ?? [])
    
    return {
      damage: damage,
      two_handed_damage,
      properties,
      range: weapon.range,
      range_throw: weapon.range_throw,
      competency: weapon.competency
    }
  }
 
  obtenerDamages(damages: WeaponDamageMongo[]): Promise<WeaponDamageApi[]> {
    return Promise.all(damages?.map(damage => this.obtenerDamage(damage)));
  } 

  async obtenerDamage(damage: WeaponDamageMongo): Promise<WeaponDamageApi> {
    const daño = await this.dañoRepository.obtenerDañoPorIndice(damage?.type ?? "")

    return {
      dice: damage.dice,
      name: daño?.name ?? "",
      desc: daño?.desc ?? ""
    }
  }

  formatearOpcionesDeEquipamiento(equipamientosOptions: EquipamientoOpcionesMongo[]): Promise<EquipamientoChoiceApi[]> {
    return Promise.all(equipamientosOptions.map(
      equipamientoOption => this.formatearOpcionDeEquipamiento(equipamientoOption)
    ))
  }

  async formatearOpcionDeEquipamiento(equipamientosOption: EquipamientoOpcionesMongo): Promise<EquipamientoChoiceApi> {
    if (Array.isArray(equipamientosOption.options)) {
      const options = await this.obtenerEquipamientosPersonajePorIndices(
        equipamientosOption.options.map(option => {
          return {
            index: option,
            quantity: equipamientosOption.quantity
          }
        })
      )

      const name = options?.length === 1 ? options[0]?.name : "Objeto"

      return {
        name,
        choose: equipamientosOption.choose,
        options: options ?? []
      };
    }

    const opcionesEquipamiento = equipamientosOption.options.split("-")
    console.log(opcionesEquipamiento[1])
    
    const options = await this.obtenerEquipamientoPorCategoria(opcionesEquipamiento[0], opcionesEquipamiento[1], opcionesEquipamiento[2])

    let name = equipamientosOption.options;

    // Reemplazar guiones por espacios
    name = name.replace(/-/g, " ");
    
    // Poner la primera letra en mayúscula
    name = name.charAt(0).toUpperCase() + name.slice(1);
 
    return {
      name,
      choose: equipamientosOption.choose,
      options: options
    }
  }  
 
  async obtenerEquipamientoPorCategoria(category: string, categoriaArma: string, distanciaArma: string): Promise<EquipamientoPersonajeApi[]> {
    const query:any = {};

    // Si existe, añádelo
    if (category) query.category = category;
    if (categoriaArma) query["weapon.category"] = categoriaArma;
    if (distanciaArma) query["weapon.range"] = distanciaArma;

    const equipamientos = await EquipamientoSchema.find(query)
      .collation({ locale: 'es', strength: 1 })
      .sort({ name: 1 })
      .lean();

    equipamientos.forEach(equipamiento => (this.equipamientosMap[equipamiento.index] = equipamiento))

    return this.formatearEquipamientosPersonaje(
      equipamientos.map(equipamiento => { return {...equipamiento, quantity: 1}}), 
      equipamientos
    )
  }
}