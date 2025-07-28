import IDoteRepository from '../../../../domain/repositories/IDoteRepository';
import { DoteApi, DoteMongo } from '../../../../domain/types';
import DoteSchema from '../schemas/Dote';

export default class DoteRepository extends IDoteRepository {
  dotesMap: {
    [key: string]: DoteApi
  }

  constructor() {
    super()
    this.dotesMap = {}
  }

  async obtenerTodos() {
    const dotes = await DoteSchema.find()

    const formateados = this.formatearDotes(dotes)
    
    formateados.sort((a: any, b: any) => {
      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
    });

    formateados.forEach(dote => {
      if (!this.dotesMap[dote.index]) {
        this.dotesMap[dote.index] = dote
      }
    })

    return formateados.filter(index => index !== null && index !== undefined);
  }

  async obtenerDotesPorIndices(indices: string[]) {
    const formateados = await Promise.all(indices.map(index => this.obtenerDotePorIndice(index)))

    formateados.sort((a: any, b: any) => {
      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
    });

    return formateados.filter(index => index !== null && index !== undefined);
  }

  async obtenerDotePorIndice(index: string) {
    if (index) {
      if (this.dotesMap[index]) {
        return this.dotesMap[index]
      } else {
        const dote = await DoteSchema.findById(index)
        if (!dote) return null;

        const doteFormateado = this.formatearDote(dote)

        this.dotesMap[index] = doteFormateado

        return doteFormateado
      }
    } else {
      return null
    }
  }

  formatearDotes(dotes: DoteMongo[]) {
    const dotesFormateados = dotes.map(dote => this.formatearDote(dote))

    return dotesFormateados
  }

  formatearDote(dote: DoteMongo) {
    return {
      index: dote._id.toString(),
      name: dote.name,
      desc: dote.desc.join("\n")
    }
  }
}
