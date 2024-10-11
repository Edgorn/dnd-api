import ICompetenciaRepository from '../../../../domain/repositories/ICompetenciaRepository';
import { CompetenciaApi } from '../../../../domain/types';
const CompetenciaSchema = require('../schemas/Competencia');

export default class CompetenciaRepository extends ICompetenciaRepository {
  competenciasMap: {
    [key: string]: {
      index: string,
      name: string,
      type: string,
      desc: [string]
    }
  }

  constructor() {
    super()
    this.competenciasMap = {}
    this.cargarCompetencias();
  }

  async cargarCompetencias() {
    const competencias: CompetenciaApi[] = await CompetenciaSchema.find();

    competencias.forEach(competencia => {
      this.competenciasMap[competencia.index] = {
        index: competencia.index,
        name: competencia.name,
        type: competencia.type,
        desc: competencia?.desc ?? []
      };
    });
  }

  obtenerCompetenciaPorIndice(index: string) {
    return this.competenciasMap[index];
  }

  obtenerCompetenciasPorIndices(indices: string[]) {
    return indices.map(index => this.obtenerCompetenciaPorIndice(index));
  }

  obtenerCompetencias() {
    return Object.values(this.competenciasMap)
  }

  obtenerCompetenciasPorType(type: string) {
    return this.obtenerCompetencias().filter(competencia => competencia.type === type)
  }

  obtenerCompetenciasPorIndicesSinRep(indices: string[]) {
    const indicesSinRep = [...new Set(indices)]
    const competencias_aux = indicesSinRep.map(index => this.obtenerCompetenciaPorIndice(index))
    const indices_aux = competencias_aux.map(comp => comp.index)

    const competencias:any[] = []

    competencias_aux.forEach(competencia => {
      if(!competencia.desc.some(elemento => indices_aux.includes(elemento))) {
        competencias.push(competencia)
      }
    })

    return competencias;
  }
}
