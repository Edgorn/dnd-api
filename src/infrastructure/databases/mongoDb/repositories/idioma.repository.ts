import IIdiomaRepository from '../../../../domain/repositories/IIdiomaRepository';
import { IdiomaApi, IdiomaMongo } from '../../../../domain/types';
import IdiomaSchema from '../schemas/Idioma';

export default class IdiomaRepository implements IIdiomaRepository {
  private idiomasMap: Record<string, IdiomaMongo>
  private todosConsultados = false

  constructor() {
    this.idiomasMap = {}
  }

  public async obtenerTodos(): Promise<IdiomaApi[]> {
    if (this.todosConsultados) {
      return this.formatearIdiomas(Object.values(this.idiomasMap))
    } else {
      const idiomas = await IdiomaSchema.find()

      idiomas.forEach(idioma => (this.idiomasMap[idioma.index] = idioma))
      this.todosConsultados = true
  
      const formateadas = this.formatearIdiomas(idiomas)
  
      return formateadas
    }
  }

  public async obtenerIdiomasPorIndices(indices: string[]): Promise<IdiomaApi[]> {
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
      const idiomas = await IdiomaSchema.find({ index: { $in: missing } });
      idiomas.forEach(i => (this.idiomasMap[i.index] = i));
      result.push(...idiomas.map(i => this.formatearIdioma(i)));
    }

    return this.ordenarPorNombre(result);
  }

  public async obtenerIdiomaPorIndice(indice: string): Promise<IdiomaApi> {
    if (this.idiomasMap[indice]) {
      return this.formatearIdioma(this.idiomasMap[indice])
    } else {
      const idioma = await IdiomaSchema.findOne({ index: indice })
  
      if (idioma) {
        this.idiomasMap[indice] = idioma
        return this.formatearIdioma(idioma)
      } else {
        return {
          index: indice,
          name: `Desconocido (${indice})`
        }
      }
    }
  }

  private formatearIdiomas(idiomas: IdiomaMongo[]): IdiomaApi[] {
    return this.ordenarPorNombre(idiomas.map(idioma => this.formatearIdioma(idioma)));
  }

  private formatearIdioma(idioma: IdiomaMongo): IdiomaApi {
    return {
      index: idioma.index,
      name: idioma.name
    }
  }

  private ordenarPorNombre<T extends { name: string }>(items: T[]): T[] {
    return [...items].sort((a, b) => 
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
    );
  }
}
