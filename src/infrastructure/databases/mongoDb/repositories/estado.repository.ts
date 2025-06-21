import IEstadoRepository from '../../../../domain/repositories/IEstadoRepository';
const EstadoSchema = require('../schemas/Estado');

export default class EstadoRepository extends IEstadoRepository {
  estadosMap: {
    [key: string]: {
      index: string,
      name: string
    }
  }

  constructor() {
    super()
    this.estadosMap = {}
    this.cargarEstados();
  }

  async cargarEstados() {
    const estados = await EstadoSchema.find();

    estados.forEach((estado: any) => {
      this.estadosMap[estado.index] = {
        index: estado.index,
        name: estado.name
      };
    });
  }

  obtenerEstadoPorIndice(index: string) {
    return this.estadosMap[index];
  }

  obtenerEstadosPorIndices(indices: string[]) {
    const estados = indices.map(index => this.obtenerEstadoPorIndice(index))
    
    estados.sort((a: any, b: any) => {
      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
    });

    return estados;
  }
}
