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
      school: string;
      casting_time: string;
      range: string;
      components: string[];
      duration: string;
      desc: string[];
      ritual: boolean
    };
  }

  constructor() {
    super()
    this.conjurosMap = {}
    this.cargar();
  }

  async cargar() {
    const conjuros: ConjuroMongo[] = await ConjuroSchema.find();
 
    conjuros.forEach(conjuro => {
      this.conjurosMap[conjuro.index] = {
        index: conjuro.index,
        name: conjuro.name,
        level: conjuro.level,
        classes: conjuro.classes,
        school: conjuro.school,
        casting_time: conjuro.casting_time,
        range: conjuro.range,
        components: conjuro.components,
        duration: conjuro.duration,
        desc: conjuro.desc,
        ritual: conjuro.ritual
      };
    });
  }

  obtenerConjuroPorIndice(index: string) {
    return this.conjurosMap[index];
  }

  obtenerConjurosPorIndices(indices: string[]) {
    return indices.map(index => this.obtenerConjuroPorIndice(index));
  }

  obtenerConjurosPorNivelClase(nivel: string, clase: string): any {
    const conjuros = Object.values(this.conjurosMap)
      .filter(conjuro => conjuro.level === parseInt(nivel))
      .filter(conjuro => conjuro.classes.includes(clase))
    
    conjuros.sort((a, b) => {
      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
    });

    return conjuros
  }
}
