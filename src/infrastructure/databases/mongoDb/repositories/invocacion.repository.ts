import IConjuroRepository from "../../../../domain/repositories/IConjuroRepository";
import IInvocacionRepository from "../../../../domain/repositories/IInvocacionRepository";
import IRasgoRepository from "../../../../domain/repositories/IRasgoRepository";
import InvocacionSchema from "../schemas/Invocacion";
import { InvocacionApi, InvocacionMongo } from "../../../../domain/types/invocaciones.types";
import { ordenarPorNombre } from "../../../../utils/formatters";
import { ChoiceApi } from "../../../../domain/types";

export default class InvocacionRepository implements IInvocacionRepository {
  private invocacionesMap: Record<string, InvocacionMongo>
  private todosConsultados = false

  constructor(
    private readonly conjuroRepository: IConjuroRepository,
    private readonly rasgoRepository: IRasgoRepository
  ) {
    this.invocacionesMap = {}
  }

  async obtenerOpciones(numberOptions: number): Promise<ChoiceApi<InvocacionApi> | undefined> {
    if (!numberOptions) return undefined;

    const options = await this.obtenerTodas();

    return {
      choose: numberOptions,
      options
    }
  }

  async obtenerPorIndices(indices: string[]): Promise<InvocacionApi[]> {
    if (!indices.length) return [];

    const procesados = await Promise.all(indices.map(async (indice) => {
      if (this.invocacionesMap[indice]) {
        const invocacion = await this.formatearInvocacion(this.invocacionesMap[indice]);
        return { encontrado: invocacion };
      } else {
        return { faltante: indice };
      }
    }));

    const result = procesados
      .filter(p => p.encontrado)
      .map(p => p.encontrado!);

    const missing = procesados
      .filter(p => p.faltante)
      .map(p => p.faltante!);

    if (missing.length > 0) {
      const invocaciones = await InvocacionSchema.find({ index: { $in: missing } })
      invocaciones.forEach(invocacion => (this.invocacionesMap[invocacion.index] = invocacion));

      const invocacionesFormateadas = await this.formatearInvocaciones(invocaciones)
      result.push(...invocacionesFormateadas);
    }

    return ordenarPorNombre(result);
  }

  private async obtenerTodas() {
    if (!this.todosConsultados) {
      const invocaciones = await InvocacionSchema.find()
        .collation({ locale: 'es', strength: 1 })
        .sort({ name: 1 });

      invocaciones.forEach(invocacion => (this.invocacionesMap[invocacion.index] = invocacion))
      this.todosConsultados = true
    }

    const invocacionesFormateadas = await this.formatearInvocaciones(Object.values(this.invocacionesMap))

    return ordenarPorNombre(invocacionesFormateadas)
  }

  private formatearInvocaciones(invocaciones: InvocacionMongo[]): Promise<InvocacionApi[]> {
    return Promise.all(invocaciones.map(invocacion => this.formatearInvocacion(invocacion)));
  }

  private async formatearInvocacion(invocacion: InvocacionMongo): Promise<InvocacionApi> {
    const traits = await this.rasgoRepository.obtenerRasgosPorIndices(invocacion?.requirements?.traits ?? [])
    const spells = await this.conjuroRepository.obtenerConjurosPorIndices(invocacion?.spells ?? [])
    const spells_required = await this.conjuroRepository.obtenerConjurosPorIndices(invocacion?.requirements?.spells ?? [])

    return {
      index: invocacion.index,
      name: invocacion.name,
      desc: invocacion?.desc,
      spells,
      skills: invocacion?.skills ?? [],
      requirements: {
        spells: spells_required
          .map(spell => {
            return {
              index: spell.index,
              name: spell.name
            }
          }),
        traits: traits.map(trait => {
          return {
            index: trait.index,
            name: trait.name
          }
        }),
        level: invocacion?.requirements?.level ?? 0
      }
    }
  }
}
