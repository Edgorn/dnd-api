import ICompetenciaRepository from '../../../../domain/repositories/ICompetenciaRepository';
import { ChoiceMongo, ChoiceApi } from '../../../../domain/types';
import { CompetenciaApi, CompetenciaMongo } from '../../../../domain/types/competencias.types';
import { ordenarPorNombre } from '../../../../utils/formatters';
import CompetenciaSchema from '../schemas/Competencia';

export default class CompetenciaRepository implements ICompetenciaRepository {
  private competenciasMap: Record<string, CompetenciaMongo>

  constructor() {
    this.competenciasMap = {}
  }

  async obtenerCompetenciasPorIndices(indices: string[]): Promise<CompetenciaApi[]> {
    if (!indices.length) return [];
    
    const result: CompetenciaMongo[] = [];
    const missing: string[] = [];

    indices.forEach(indice => {
      if (this.competenciasMap[indice]) {
        result.push(this.competenciasMap[indice]);
      } else {
        missing.push(indice);
      }
    })

    if (missing.length > 0) {
      const competencias = await CompetenciaSchema.find({ index: { $in: missing } })
        
      competencias.forEach(competencia => (this.competenciasMap[competencia.index] = competencia));
      result.push(...competencias);
    }

    return ordenarPorNombre(this.formatearCompetencias(result));
  }

  async formatearOpcionesDeCompetencias(opciones: ChoiceMongo[] | undefined): Promise<ChoiceApi<CompetenciaApi>[]> {
    if (!opciones) return []

    const opcionesDeCompetencias = await Promise.all(
      opciones.map(opc => this.formatearOpcionesDeCompetencia(opc))
    );

    return opcionesDeCompetencias.filter((item): item is ChoiceApi<CompetenciaApi> => item !== undefined);
  }

  async obtenerCompetenciaPorIndice(index: string): Promise<CompetenciaApi | null> {
    if (this.competenciasMap[index]) {
      return this.formatearCompetencia(this.competenciasMap[index])
    } else {
      const competencia = await CompetenciaSchema.findOne({ index })

      if (competencia) {
        return this.formatearCompetencia(competencia)
      } else {
        return null
      }
    }
  }

  private async formatearOpcionesDeCompetencia(opciones: ChoiceMongo | undefined): Promise<ChoiceApi<CompetenciaApi> | undefined> {
    if (!opciones) return undefined

    if (Array.isArray(opciones.options)) {
      const competencias = await this.obtenerCompetenciasPorIndices(opciones.options);
      
      return {
        choose: opciones.choose,
        options: competencias
      };
    }

    const competencias = await this.obtenerCompetenciasPorTipo(opciones.options);
      
    return {
      choose: opciones.choose,
      options: competencias
    };
  }

  private async obtenerCompetenciasPorTipo(type: string): Promise<CompetenciaApi[]> {
    const competencias = await CompetenciaSchema.find({ type })
      .collation({ locale: 'es', strength: 1 })
      .sort({ name: 1 });

    competencias.forEach(competencia => (this.competenciasMap[competencia.index] = competencia))
    
    return this.formatearCompetencias(competencias)
  }
  
  private formatearCompetencias(competencias: CompetenciaMongo[]): CompetenciaApi[] {
    return competencias.map(competencia => this.formatearCompetencia(competencia));
  }
  
  private formatearCompetencia(competencia: CompetenciaMongo): CompetenciaApi {
    return {
      index: competencia.index,
      name: competencia.name,
      type: competencia.type
    }
  }
}
