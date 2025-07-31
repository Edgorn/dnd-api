import IIdiomaRepository from '../../../../domain/repositories/IIdiomaRepository';
import { ChoiceMongo, ChoiceApi } from '../../../../domain/types';
import { IdiomaApi, IdiomaMongo } from '../../../../domain/types/idiomas.types';
import { ordenarPorNombre } from '../../../../utils/formatters';
import IdiomaSchema from '../schemas/Idioma';

export default class IdiomaRepository implements IIdiomaRepository {
  private idiomasMap: Record<string, IdiomaMongo>
  private todosConsultados = false

  constructor() {
    this.idiomasMap = {}
  }

  async obtenerTodos(): Promise<IdiomaApi[]> {
    if (!this.todosConsultados) {
      const idiomas = await IdiomaSchema.find()
        .collation({ locale: 'es', strength: 1 })
        .sort({ name: 1 });

      idiomas.forEach(idioma => (this.idiomasMap[idioma.index] = idioma))
      this.todosConsultados = true
    }
    
    return this.formatearIdiomas(Object.values(this.idiomasMap))
  }

  async obtenerIdiomasPorIndices(indices: string[]): Promise<IdiomaApi[]> {
    if (!indices.length) return [];
    
    const result: IdiomaApi[] = [];
    const missing: string[] = [];

    indices.forEach(indice => {
      if (this.idiomasMap[indice]) {
        result.push(this.formatearIdioma(this.idiomasMap[indice]));
      } else {
        missing.push(indice);
      }
    })

    if (missing.length > 0) {
      const idiomas = await IdiomaSchema.find({ index: { $in: missing } })
        
      idiomas.forEach(i => (this.idiomasMap[i.index] = i));
      result.push(...this.formatearIdiomas(idiomas));
    }

    return ordenarPorNombre(result);
  }
  
  async formatearOpcionesDeIdioma(opciones: ChoiceMongo | undefined): Promise<ChoiceApi<IdiomaApi> | undefined> {
    if (!opciones) return undefined

    if (Array.isArray(opciones.options)) {
      const idiomas = await this.obtenerIdiomasPorIndices(opciones.options);
      
      return {
        choose: opciones.choose,
        options: idiomas
      };
    }

    if (opciones.options === 'all') {
      const idiomas = await this.obtenerTodos()

      return {
        choose: opciones.choose,
        options: idiomas
      }
    }

    console.warn("Opciones de idioma no reconocidas:", opciones.options);
    return undefined;
  }

  private formatearIdiomas(idiomas: IdiomaMongo[]): IdiomaApi[] {
    return idiomas.map(idioma => this.formatearIdioma(idioma));
  }

  private formatearIdioma(idioma: IdiomaMongo): IdiomaApi {
    return {
      index: idioma.index,
      name: idioma.name
    }
  }
}
