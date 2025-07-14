import { EquipamientoApi } from "../types";

export default class IEquipamientoRepository {
  obtenerEquipamientosPorIndices(index: string[]): EquipamientoApi[] {
    throw new Error('Método no implementado');
  }

  obtenerEquipamientoPorIndice(index: string): EquipamientoApi {
    throw new Error('Método no implementado');
  }
  
  obtenerEquipamientosPorTipos(categoria: string, tipo: string, rango: string): EquipamientoApi[] {
    throw new Error('Método no implementado');
  }

  obtenerEquipamientosPorTipo(tipo: string): EquipamientoApi[] {
    throw new Error('Método no implementado');
  }
}