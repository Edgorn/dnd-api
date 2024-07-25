const IHabilidadRepository = require('../../../../domain/repositories/IHabilidadRepository');
const HabilidadSchema = require('../schemas/Habilidad');

class HabilidadRepository extends IHabilidadRepository {
  constructor() {
    super()
    this.habilidadesMap = {}
    this.cargarHabilidades();
  }

  async cargarHabilidades() {
    const habilidades = await HabilidadSchema.find();
    habilidades.forEach(habilidad => {
      this.habilidadesMap[habilidad.index] = {
        index: habilidad.index,
        name: habilidad.name
      };
    });
  }

  obtenerHabilidadPorIndice(index) {
    return this.habilidadesMap[index];
  }

  obtenerHabilidadesPorIndices(indices) {
    return indices.map(index => this.obtenerHabilidadPorIndice(index));
  }

  obtenerHabilidades() {
    return Object.values(this.habilidadesMap)
  }
}

module.exports = HabilidadRepository;