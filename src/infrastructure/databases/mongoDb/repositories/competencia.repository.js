const ICompetenciaRepository = require('../../../../domain/repositories/ICompetenciaRepository');
const CompetenciaSchema = require('../schemas/Competencia');

class CompetenciaRepository extends ICompetenciaRepository {
  constructor() {
    super()
    this.competenciasMap = {}
    this.cargarCompetencias();
  }

  async cargarCompetencias() {
    const competencias = await CompetenciaSchema.find();
    competencias.forEach(competencia => {
      this.competenciasMap[competencia.index] = {
        index: competencia.index,
        name: competencia.name,
        type: competencia.type
      };
    });
  }

  obtenerCompetenciaPorIndice(index) {
    return this.competenciasMap[index];
  }

  obtenerCompetenciasPorIndices(indices) {
    return indices.map(index => this.obtenerCompetenciaPorIndice(index));
  }

  obtenerCompetencias() {
    return Object.values(this.competenciasMap)
  }
}

module.exports = CompetenciaRepository;