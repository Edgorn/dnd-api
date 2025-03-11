import IIdiomaRepository from '../../../../domain/repositories/IIdiomaRepository';
import { IdiomaApi } from '../../../../domain/types';
const IdiomaSchema = require('../schemas/Idioma');

export default class IdiomaRepository extends IIdiomaRepository {
  idiomasMap: {
    [key: string]: {
      index: string,
      name: string
    }
  }

  constructor() {
    super()
    this.idiomasMap = {}
    this.cargarIdiomas();
  }

  async cargarIdiomas() {
    const idiomas = await IdiomaSchema.find();
    idiomas.forEach((idioma: IdiomaApi) => {
      this.idiomasMap[idioma.index] = {
        index: idioma.index,
        name: idioma.name
      };
    });
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
