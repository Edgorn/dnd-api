import IPropiedadArmaRepository from '../../../../domain/repositories/IPropiedadesArmas';
const PropiedadArma = require('../schemas/PropiedadArma');

export default class PropiedadArmaRepository extends IPropiedadArmaRepository {
  propiedadesMap: {
    [key: string]: {
      index: string,
      name: string,
      desc: string
    }
  }
  constructor() {
    super()
    this.propiedadesMap = {}
    this.cargarPropiedades();
  }

  async cargarPropiedades() {
    const propiedades = await PropiedadArma.find();

    propiedades.forEach((propiedad: any) => {
      this.propiedadesMap[propiedad.index] = {
        index: propiedad.index,
        name: propiedad.name,
        desc: propiedad?.desc?.join('\n'),
      };
    });
  }

  obtenerPropiedadPorIndice(index: string) {
    return this.propiedadesMap[index] ?? index;
  }

  obtenerPropiedadesPorIndices(indices: string[]) {
    return indices.map(index => this.obtenerPropiedadPorIndice(index));
  }
}
