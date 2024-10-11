export default class IEquipamientoRepository {
  obtenerEquipamientosPorIndices(index: string[]): any[] {
    throw new Error('Método no implementado');
  }

  obtenerEquipamientoPorIndice(index: string): any {
    throw new Error('Método no implementado');
  }
  
  obtenerEquipamientosPorTipos(categoria: string, tipo: string, rango: string): any[] {
    throw new Error('Método no implementado');
  }
}