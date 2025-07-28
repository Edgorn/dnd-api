import IConjuroRepository from '../../../../domain/repositories/IConjuroRepository';
import { ConjuroApi, ConjuroMongo } from '../../../../domain/types';
import ConjuroSchema from '../schemas/Conjuro';

export default class ConjuroRepository extends IConjuroRepository {
  conjurosMap: {[key: string]: ConjuroApi}

  constructor() {
    super()
    this.conjurosMap = {}
  }

  async obtenerConjurosPorIndices(indices: string[]) {
    const conjuros = await Promise.all(indices.map(index => this.obtenerConjuroPorIndice(index)))
    return conjuros.filter(index => index !== null && index !== undefined);
  }

  async obtenerConjuroPorIndice(index: string) {
    if (index) {
      if (this.conjurosMap[index]) {
        return this.conjurosMap[index];
      } else {
        const conjuro = await ConjuroSchema.findOne({index});
        if (!conjuro) return null;

        this.conjurosMap[index] = conjuro

        return conjuro
      }
    } else {
      return null
    }
  }

  async obtenerConjurosPorNivelClase(nivel: string, clase: string) {
    const conjuros = await ConjuroSchema.find({
      level: parseInt(nivel),
      classes: clase
    });

    conjuros.sort((a, b) => {
      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
    });

    conjuros.forEach(conjuro => {
      this.conjurosMap[conjuro.index] = conjuro
    })

    return conjuros
  }
}
