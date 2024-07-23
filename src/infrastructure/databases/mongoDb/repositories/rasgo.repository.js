const IRasgoRepository = require('../../../../domain/repositories/IRasgoRepository');
const RasgoSchema = require('../schemas/Rasgo');

class RasgoRepository extends IRasgoRepository {

  constructor() {
    super()
    this.rasgosMap = {}
    this.cargarRasgos();
  }

  async cargarRasgos() {
    const rasgos = await RasgoSchema.find();

    rasgos.forEach(rasgo => {
      this.rasgosMap[rasgo.index] = {
        index: rasgo.index,
        name: rasgo.name,
        desc: rasgo?.desc?.join('\n'),
      };
    });
  }

  obtenerRasgoPorIndice(index) {
    if (index === 'rogue-expertise') {
      return {
        index: 'rogue-expertise',
        name: '',
        desc: ''
      }
    } else {
      return this.rasgosMap[index];
    }
  }

  obtenerRasgosPorIndices(indices) {
    return indices.map(index => this.obtenerRasgoPorIndice(index));
  }
}

module.exports = RasgoRepository;