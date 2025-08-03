import IConjuroRepository from '../../../../domain/repositories/IConjuroRepository';
import { ChoiceApi } from '../../../../domain/types';
import { ChoiceSpell, ConjuroApi, ConjuroMongo } from '../../../../domain/types/conjuros.types';
import { ordenarPorNombre } from '../../../../utils/formatters';
import ConjuroSchema from '../schemas/Conjuro';

export default class ConjuroRepository implements IConjuroRepository {
  private conjurosMap: Record<string, ConjuroMongo>

  constructor() {
    this.conjurosMap = {}
  }

  async formatearOpcionesDeConjuros(opciones: ChoiceSpell | undefined): Promise<ChoiceApi<ConjuroApi> | undefined> {
    if (!opciones) return undefined

    const conjuros = await this.obtenerConjurosPorNivelClase(opciones.level, opciones.class)

    return {
      choose: opciones.choose,
      options: conjuros
    };
  } 

  async obtenerConjurosPorIndices(indices: string[]): Promise<ConjuroApi[]> {
    if (!indices.length) return [];
        
    const result: ConjuroMongo[] = [];
    const missing: string[] = [];

    indices.forEach(indice => {
      if (this.conjurosMap[indice]) {
        result.push(this.conjurosMap[indice]);
      } else {
        missing.push(indice);
      }
    })

    if (missing.length > 0) {
      const conjuros = await ConjuroSchema.find({ index: { $in: missing } })
        
      conjuros.forEach(conjuro => (this.conjurosMap[conjuro.index] = conjuro));
      result.push(...conjuros);
    }

    return ordenarPorNombre(this.formatearConjuros(result));
  }

  async obtenerConjurosPorNivelClase(nivel: number, clase: string): Promise<ConjuroApi[]> {
    const conjuros = await ConjuroSchema.find({
        level: nivel,
        classes: clase
      }) 
      .collation({ locale: 'es', strength: 1 })
      .sort({ name: 1 });
    
    conjuros.forEach(conjuro => (this.conjurosMap[conjuro.index] = conjuro));

    return this.formatearConjuros(conjuros)
  }
   
  formatearConjuros(conjuros: ConjuroMongo[]): ConjuroApi[] {
    return conjuros.map(conjuro => this.formatearConjuro(conjuro));
  }
  
  formatearConjuro(conjuro: ConjuroMongo): ConjuroApi {
    return {
      index: conjuro.index,
      name: conjuro.name,
      type: conjuro.type,
      level: conjuro.level,
      classes: conjuro.classes,
      typeName: conjuro.typeName,
      school: conjuro.school,
      casting_time: conjuro.casting_time,
      range: conjuro.range,
      components: conjuro.components,
      duration: conjuro.duration,
      desc: conjuro.desc.join("\n"),
      ritual: conjuro.ritual
    }
  }
}
