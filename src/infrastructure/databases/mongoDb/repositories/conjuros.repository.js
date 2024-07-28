const IConjuroRepository = require('../../../../domain/repositories/IConjuroRepository');
const ConjuroSchema = require('../schemas/Conjuro');

class ConjuroRepository extends IConjuroRepository {
  constructor() {
    super()
    this.conjurosMap = {}
    this.cargarConjuros();
  }

  async cargarConjuros() {
    const conjuros = await ConjuroSchema.find();
    conjuros.forEach(conjuro => {
      this.conjurosMap[conjuro.index] = {
        index: conjuro.index,
        name: conjuro.name,
        level: conjuro.level,
        classes: conjuro.classes
      };
    });
  }

  obtenerConjuroPorIndice(index) {
    return this.conjurosMap[index];
  }

  obtenerConjurosPorIndices(indices) {
    return indices.map(index => this.obtenerConjuroPorIndice(index));
  }

  obtenerConjurosPorNivelClase(nivel, clase) {
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

module.exports = ConjuroRepository;