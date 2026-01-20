import IDoteRepository from '../../../../domain/repositories/IDoteRepository';
import { ChoiceApi } from '../../../../domain/types';
import { DoteApi, DoteMongo } from '../../../../domain/types/dotes.types';
import { ordenarPorNombre } from '../../../../utils/formatters';
import DoteSchema from '../schemas/Dote';

export default class DoteRepository implements IDoteRepository {
  private dotesMap: Record<string, DoteMongo>
  private todosConsultados = false

  constructor() {
    this.dotesMap = {}
  }

  async formatearOpcionesDeDote(cantidad: number | undefined): Promise<ChoiceApi<DoteApi> | undefined> {
    if (cantidad === undefined) return undefined

    const dotes = await this.obtenerTodos()

    return {
      choose: cantidad,
      options: dotes
    }
  }

  async obtenerDotesPorIndices(indices: string[]): Promise<DoteApi[]> {
    if (!indices.length) return [];
    
    const result: DoteMongo[] = [];
    const missing: string[] = [];

    indices.forEach(indice => {
      if (this.dotesMap[indice]) {
        result.push(this.dotesMap[indice]);
      } else {
        missing.push(indice);
      }
    })

    if (missing.length > 0) {
      const dotes = await DoteSchema.find({ _id: { $in: missing } })
        
      dotes.forEach(dote => (this.dotesMap[dote._id.toString()] = dote));
      result.push(...dotes);
    }

    return ordenarPorNombre(this.formatearDotes(result));
  }

  async obtenerTodos(): Promise<DoteApi[]> {
    if (!this.todosConsultados) {
      const dotes = await DoteSchema.find()
        .collation({ locale: 'es', strength: 1 })
        .sort({ name: 1 });

      dotes.forEach(dote => (this.dotesMap[dote._id.toString()] = dote))
      this.todosConsultados = true
    } 
    
    return this.formatearDotes(Object.values(this.dotesMap))
  }

  formatearDotes(dotes: DoteMongo[]): DoteApi[] {
    return dotes.map(dote => this.formatearDote(dote));
  }

  formatearDote(dote: DoteMongo) {
    return {
      index: dote._id.toString(),
      name: dote.name,
      description: dote.description ?? dote.desc ?? [],
      summary: dote.summary ?? dote.description ?? dote.desc ?? []
    }
  }
}
