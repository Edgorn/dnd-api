import IConjuroRepository from '../../../../domain/repositories/IConjuroRepository';
import { ConjuroMongo } from '../../../../domain/types';
const ConjuroSchema = require('../schemas/Conjuro');

export default class ConjuroRepository extends IConjuroRepository {
  conjurosMap: {
    [key: string]: {
      index: string;
      name: string;
      level: number;
      classes: string[];
    };
  }

  constructor() {
    super()
    this.conjurosMap = {}
    this.cargarConjuros();
  }

  async cargarConjuros() {
    const conjuros: ConjuroMongo[] = await ConjuroSchema.find();

    conjuros.forEach(conjuro => {
      this.conjurosMap[conjuro.index] = {
        index: conjuro.index,
        name: conjuro.name,
        level: conjuro.level,
        classes: conjuro.classes
      };
    });
  }

  obtenerConjuroPorIndice(index: string) {
    return this.conjurosMap[index];
  }

  obtenerConjurosPorIndices(indices: string[]) {
    return indices.map(index => this.obtenerConjuroPorIndice(index));
  }

  obtenerConjurosPorNivelClase(nivel: string, clase: string) {
    const conjuros = Object.values(this.conjurosMap)
      .filter(conjuro => conjuro.level === parseInt(nivel))
      .filter(conjuro => conjuro.classes.includes(clase))
      .map(conjuro => { return { index: conjuro.index, name: conjuro.name } })
    
    conjuros.sort((a, b) => {
      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
    });

    return conjuros
  }
}
