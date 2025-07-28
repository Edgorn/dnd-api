import IDañoRepository from '../../../../domain/repositories/IDañoRepository';
import { DañoApi } from '../../../../domain/types';
import DañoSchema from '../schemas/Daño';

export default class DañoRepository extends IDañoRepository {
  dañosMap: {
    [key: string]: DañoApi
  }

  constructor() {
    super()
    this.dañosMap = {}
  }

  async obtenerDañosPorIndices(indices: string[]) {
    const daños = await Promise.all(indices.map(index => this.obtenerDañoPorIndice(index)))
    
    daños?.sort((a: any, b: any) => {
      return a?.name?.localeCompare(b.name, 'es', { sensitivity: 'base' });
    });

    return daños.filter(index => index !== null && index !== undefined);
  }

  async obtenerDañoPorIndice(index: string) {
    if (index) {
      if (this.dañosMap[index]) {
        return this.dañosMap[index]
      } else {
        const daño = await DañoSchema.findOne({index});
        if (!daño) return null;

        this.dañosMap[index] = daño

        return daño
      }
    } else {
      return null
    }
  }
}
