const IIdiomaRepository = require('../../../../domain/repositories/IIdiomaRepository');
const IdiomaSchema = require('../schemas/Idioma');

class IdiomaRepository extends IIdiomaRepository {
  constructor() {
    super()
    this.idiomasMap = {}
    this.cargarIdiomas();
  }

  async cargarIdiomas() {
    const idiomas = await IdiomaSchema.find();
    idiomas.forEach(idioma => {
      this.idiomasMap[idioma.index] = {
        index: idioma.index,
        name: idioma.name
      };
    });
  }

  obtenerIdiomaPorIndice(index) {
    return this.idiomasMap[index];
  }

  obtenerIdiomasPorIndices(indices) {
    return indices.map(index => this.obtenerIdiomaPorIndice(index));
  }
}

module.exports = IdiomaRepository;