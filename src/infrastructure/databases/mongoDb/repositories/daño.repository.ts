import IDañoRepository from '../../../../domain/repositories/IDañoRepository';
import { DañoApi } from '../../../../domain/types';
import { ordenarPorNombre } from '../../../../utils/formatters';
import DañoSchema from '../schemas/Daño';

export default class DañoRepository implements IDañoRepository {
  private dañosMap: Record<string, DañoApi>

  constructor() {
    this.dañosMap = {}
  }

  async obtenerDañosPorIndices(indices: string[]) {
    if (!indices.length) return [];
    
    const result: DañoApi[] = [];
    const missing: string[] = [];

    indices.forEach(indice => {
      if (this.dañosMap[indice]) {
        result.push(this.dañosMap[indice]);
      } else {
        missing.push(indice);
      }
    })

    if (missing.length > 0) {
      const daños = await DañoSchema.find({ index: { $in: missing } })
        
      daños.forEach(daño => (this.dañosMap[daño.index] = daño));
      result.push(...daños);
    }

    return ordenarPorNombre(result);
  }

  async obtenerDañoPorIndice(index: string) {
    if (this.dañosMap[index]) {
      return this.dañosMap[index]
    } else {
      const daño = await DañoSchema.findOne({index});

      if (!daño) return null;

      this.dañosMap[index] = daño

      return daño
    }
  }
}
