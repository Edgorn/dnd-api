import IHabilidadRepository from '../../../../domain/repositories/IHabilidadRepository';
import { ChoiceMongo, ChoiceApi } from '../../../../domain/types';
import { HabilidadApi, HabilidadMongo, HabilidadPersonajeApi } from '../../../../domain/types/habilidades.types';
import { ordenarPorNombre } from '../../../../utils/formatters';
import HabilidadSchema from '../schemas/Habilidad';

export default class HabilidadRepository implements IHabilidadRepository {
  habilidadesMap: Record<string, HabilidadMongo>
  private todosConsultados = false

  constructor() {
    this.habilidadesMap = {}
  }

  async obtenerHabilidadesPorIndices(indices: string[]): Promise<HabilidadApi[]> {
    if (!indices.length) return [];
        
    const result: HabilidadApi[] = [];
    const missing: string[] = [];

    indices.forEach(indice => {
      if (this.habilidadesMap[indice]) {
        result.push(this.formatearHabilidad(this.habilidadesMap[indice]));
      } else {
        missing.push(indice);
      }
    })

    if (missing.length > 0) {
      const habilidades = await HabilidadSchema.find({ index: { $in: missing } })
        
      habilidades.forEach(habilidad => (this.habilidadesMap[habilidad.index] = habilidad));
      result.push(...this.formatearHabilidades(habilidades));
    }

    return ordenarPorNombre(result);
  }

  async obtenerHabilidadesPersonaje(skills: string[], double_skills: string[]): Promise<HabilidadPersonajeApi[]> {
    const habilidades = await this.obtenerTodas()

    const habilidadesFormateadas = habilidades.map(habilidad => {
      return {
        ...habilidad,
        value: double_skills?.includes(habilidad?.index)
          ? 2
          : skills?.includes(habilidad?.index)
            ? 1
            : 0
      }
    })

    return habilidadesFormateadas
  }
  
  async formatearOpcionesDeHabilidad(opciones: ChoiceMongo | undefined): Promise<ChoiceApi<HabilidadApi> | undefined> {
    if (!opciones) return undefined

    if (Array.isArray(opciones.options)) {
      const habilidades = await this.obtenerHabilidadesPorIndices(opciones.options);
      
      return {
        choose: opciones.choose,
        options: habilidades
      };
    }

    if (opciones.options === 'all') {
      const habilidades = await this.obtenerTodas()

      return {
        choose: opciones.choose,
        options: habilidades
      }
    }

    console.warn("Opciones de habilidades no reconocidas:", opciones.options);
    return undefined;
  }

  private async obtenerTodas(): Promise<HabilidadApi[]> {
    if (!this.todosConsultados) {
      const idiomas = await HabilidadSchema.find()
        .collation({ locale: 'es', strength: 1 })
        .sort({ name: 1 });

      idiomas.forEach(idioma => (this.habilidadesMap[idioma.index] = idioma))
      this.todosConsultados = true
    } 
    
    return this.formatearHabilidades(ordenarPorNombre(Object.values(this.habilidadesMap)))
  }

  private formatearHabilidades(habilidades: HabilidadMongo[]): HabilidadApi[] {
    return habilidades.map(habilidad => this.formatearHabilidad(habilidad));
  }

  private formatearHabilidad(habilidad: HabilidadMongo): HabilidadApi {
    return {
      index: habilidad.index,
      name: habilidad.name,
      ability_score: habilidad.ability_score
    }
  }
}
