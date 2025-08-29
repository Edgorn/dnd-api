import IPropiedadArmaRepository from '../../../../domain/repositories/IPropiedadesArmas';
import { PropiedadesArma } from '../../../../domain/types';
import { ordenarPorNombre } from '../../../../utils/formatters';
import PropiedadArmaSchema from '../schemas/PropiedadArma';

export default class PropiedadArmaRepository implements IPropiedadArmaRepository {
  private propiedadesMap: Record<string, PropiedadesArma>

  constructor() {
    this.propiedadesMap = {}
  }

  async obtenerPropiedadesPorIndices(indices: string[]) {
    if (!indices?.length) return [];
    
    const result: PropiedadesArma[] = [];
    const missing: string[] = [];

    indices.forEach(indice => {
      if (this.propiedadesMap[indice]) {
        result.push(this.propiedadesMap[indice]);
      } else {
        missing.push(indice);
      }
    })

    if (missing.length > 0) {
      const propiedadesAux = await PropiedadArmaSchema.find({ index: { $in: missing } })
      
      propiedadesAux.forEach(propiedad => (this.propiedadesMap[propiedad.index] = propiedad));
      result.push(...propiedadesAux);
    }

    return ordenarPorNombre(result);
  }
}
