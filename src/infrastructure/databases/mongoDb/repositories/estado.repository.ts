import IEstadoRepository from '../../../../domain/repositories/IEstadoRepository';
import { EstadoApi, EstadoMongo } from '../../../../domain/types/estados.types';
import { ordenarPorNombre } from '../../../../utils/formatters';
import EstadoSchema from '../schemas/Estado';

export default class EstadoRepository implements IEstadoRepository {
  private estadosMap: Record<string, EstadoMongo>

  constructor() {
    this.estadosMap = {}
  }

  async obtenerEstadosPorIndices(indices: string[]) {
    if (!indices.length) return [];

    const result: EstadoMongo[] = [];
    const missing: string[] = [];

    indices.forEach(indice => {
      if (this.estadosMap[indice]) {
        result.push(this.estadosMap[indice]);
      } else {
        missing.push(indice);
      }
    })

    if (missing.length > 0) {
      const estados = await EstadoSchema.find({ index: { $in: missing } })
        
      estados.forEach(estado => (this.estadosMap[estado.index] = estado));
      result.push(...estados);
    }

    return ordenarPorNombre(this.formatearEstados(result));
  }

  private formatearEstados(estados: EstadoMongo[]): EstadoApi[] {
    return estados.map(estado => this.formatearEstado(estado));
  }

  private formatearEstado(estado: EstadoMongo): EstadoApi {
    return {
      index: estado.index,
      name: estado.name
    }
  }
}
