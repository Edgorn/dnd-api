import IHabilidadRepository from '../../../../domain/repositories/IHabilidadRepository';
import { HabilidadApi } from '../../../../domain/types';
const HabilidadSchema = require('../schemas/Habilidad');

export default class HabilidadRepository extends IHabilidadRepository {
  habilidadesMap: {
    [key: string]: {
      index: string,
      name: string,
      ability_score: string
    }
  }

  constructor() {
    super()
    this.habilidadesMap = {}
    this.cargarHabilidades();
  }

  async cargarHabilidades() {
    const habilidades: HabilidadApi[] = await HabilidadSchema.find();
    habilidades.forEach(habilidad => {
      this.habilidadesMap[habilidad.index] = {
        index: habilidad.index,
        name: habilidad.name,
        ability_score: habilidad.ability_score
      };
    });
  }

  obtenerHabilidadPorIndice(index: string) {
    return this.habilidadesMap[index];
  }

  obtenerHabilidadesPorIndices(indices: string[]) {
    return indices.map(index => this.obtenerHabilidadPorIndice(index));
  }

  obtenerHabilidades() {
    return Object.values(this.habilidadesMap)
  }
}
