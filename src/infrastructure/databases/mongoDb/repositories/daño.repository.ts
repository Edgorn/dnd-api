import IDañoRepository from '../../../../domain/repositories/IDañoRepository';
import { DañoApi } from '../../../../domain/types';
const DañoSchema = require('../schemas/Daño');

export default class DañoRepository extends IDañoRepository {
  dañosMap: {
    [key: string]: {
      index: string,
      name: string
    }
  }

  constructor() {
    super()
    this.dañosMap = {}
    this.cargarDaños();
  }

  async cargarDaños() {
    const daños = await DañoSchema.find();

    daños.forEach((daño: DañoApi) => {
      this.dañosMap[daño.index] = {
        index: daño.index,
        name: daño.name
      };
    });
  }

  obtenerDañoPorIndice(index: string) {
    return this.dañosMap[index] ?? {index, name: index};
  }

  obtenerDañosPorIndices(indices: string[]) {
    const daños = indices.map(index => this.obtenerDañoPorIndice(index))
    
    daños.sort((a: any, b: any) => {
      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
    });

    return daños;
  }
}
