import IIdiomaRepository from '../../../../domain/repositories/IIdiomaRepository';
import { IdiomaApi } from '../../../../domain/types';
const IdiomaSchema = require('../schemas/Idioma');

export default class IdiomaRepository extends IIdiomaRepository {
  private initialized = false;

  idiomasMap: {
    [key: string]: {
      index: string,
      name: string
    }
  }

  constructor() {
    super()
    this.idiomasMap = {}
  }

  async init() {
    if (!this.initialized) {
      await this.cargar();
      this.initialized = true;
    }
  }

  async cargar() {
    console.log('Cargando idiomas...')
    const idiomas = await IdiomaSchema.find();
    idiomas.forEach((idioma: IdiomaApi) => {
      this.idiomasMap[idioma.index] = {
        index: idioma.index,
        name: idioma.name
      };
    });
    console.log('Idiomas cargados')
  }
 
  obtenerIdiomaPorIndice(index: string): IdiomaApi {
    return this.idiomasMap[index] ?? {
      index: index,
      name: index
    };
  }

  obtenerIdiomasPorIndices(indices: string[]): IdiomaApi[] {
    return indices.map(index => this.obtenerIdiomaPorIndice(index));
  }

  obtenerIdiomas() {
    return Object.values(this.idiomasMap)
  }
}
