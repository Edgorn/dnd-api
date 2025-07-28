import ICompetenciaRepository from '../../../../domain/repositories/ICompetenciaRepository';
import { CompetenciaApi } from '../../../../domain/types';
import CompetenciaSchema from '../schemas/Competencia';

export default class CompetenciaRepository extends ICompetenciaRepository {
  competenciasMap: {
    [key: string]: CompetenciaApi
  }

  constructor() {
    super()
    this.competenciasMap = {}
  }

  async obtenerCompetenciasPorIndices(indices: string[]) {
    const competencias = await Promise.all(indices.map(index => this.obtenerCompetenciaPorIndice(index)))

    return competencias.filter(index => index !== null && index !== undefined);
  }

  async obtenerCompetenciaPorIndice(index: string) {
    if (index) {
      if (this.competenciasMap[index]) {
        return this.competenciasMap[index]
      } else {
        const competencia = await CompetenciaSchema.findOne({index});
        if (!competencia) return null;

        this.competenciasMap[index] = competencia

        return competencia
      }
    } else {
      return null
    }
  }

  obtenerCompetencias() {
    return Object.values(this.competenciasMap)
  }

  async obtenerCompetenciasPorType(type: string) {
    const competencias = await CompetenciaSchema.find({ type })

    competencias.forEach(competencia => {
      if (this.competenciasMap[competencia._id.toString()]) {
        this.competenciasMap[competencia._id.toString()] = competencia
      }
    })

    return competencias
  }

  obtenerCompetenciasPorIndicesSinRep(indices: string[]) {
    /*const indicesSinRep = [...new Set(indices)]
    const competencias_aux = indicesSinRep.map(index => this.obtenerCompetenciaPorIndice(index))
    const indices_aux = competencias_aux.map(comp => comp.index)

    const competencias:any[] = []

    competencias_aux.forEach(competencia => {
      if(!competencia.desc.some(elemento => indices_aux.includes(elemento))) {
        competencias.push(competencia)
      }
    })

    return competencias;*/

  }
}
