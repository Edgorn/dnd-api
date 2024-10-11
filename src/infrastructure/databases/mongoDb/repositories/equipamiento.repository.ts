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
        content: equipamiento.content
      };
    });
  }

  obtenerEquipamientoPorIndice(index: string) {
    return this.equipamientosMap[index];
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
}