const IDañoRepository = require('../../../../domain/repositories/IDañoRepository');
const DañoSchema = require('../schemas/Daño');

class DañoRepository extends IDañoRepository {

  constructor() {
    super()
    this.dañosMap = {}
    this.cargarDaños();
  }

  async cargarDaños() {
    const daños = await DañoSchema.find();

    daños.forEach(daño => {
      this.dañosMap[daño.index] = {
        index: daño.index,
        name: daño.name
      };
    });
  }

  obtenerDañoPorIndice(index) {
    return this.dañosMap[index];
  }

  obtenerDañosPorIndices(indices) {
    return indices.map(index => this.obtenerDañoPorIndice(index));
  }
}

module.exports = DañoRepository;