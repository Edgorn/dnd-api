import IEquipamientoRepository from '../../../../domain/repositories/IEquipamientoRepository';
import EquipamientoSchema from '../schemas/Equipamiento';

export default class EquipamientoRepository extends IEquipamientoRepository {
  equipamientosMap: {
    [key: string]: any
  }

  constructor() {
    super()
    this.equipamientosMap = {}
    this.cargarEquipamientos();
  }

  async cargarEquipamientos() {
    const equipamientos = await EquipamientoSchema.find();

    equipamientos.forEach((equipamiento: any) => {
      this.equipamientosMap[equipamiento.index] = {
        index: equipamiento.index,
        name: equipamiento.name,
        category: equipamiento.category,
        weapon: equipamiento.weapon,
        armor: equipamiento.armor,
        content: equipamiento.content,
        weight: equipamiento.weight
      };
    });
  }

  obtenerEquipamientoPorIndice(index: string) {
    return this.equipamientosMap[index] ?? {
      index: index,
      name: index,
      category: 'personalizado',
      weapon: {},
      armor: {},
      content: [],
      weight: 0
    };
  } 

  obtenerEquipamientosPorIndices(indices: string[]) {
    return indices.map(index => this.obtenerEquipamientoPorIndice(index));
  }

  obtenerEquipamientosPorTipos(categoria: string, tipo: string, rango: string) {
    const equipamientos:any[] = Object.values(this.equipamientosMap)

    return equipamientos
      .filter(eq => !categoria || eq?.category?.toLowerCase() === categoria)
      .filter(eq => !tipo || eq?.weapon?.category?.toLowerCase() === tipo)
      .filter(eq => !rango || eq?.weapon?.range?.toLowerCase() === rango)
  }

  async obtenerEquipamientosPorTipo(tipo: string) {
    const equipamientos:any[] = Object.values(this.equipamientosMap)

    equipamientos.sort((a: any, b: any) => {
      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
    })

    return equipamientos
      .filter(eq => !tipo || eq?.category?.toLowerCase() === tipo.toLowerCase())
  }
}