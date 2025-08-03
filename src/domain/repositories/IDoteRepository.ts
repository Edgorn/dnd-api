import { ChoiceApi } from "../types";
import { DoteApi } from "../types/dotes.types";

export default interface IDoteRepository {
  formatearOpcionesDeDote(cantidad: number | undefined): Promise<ChoiceApi<DoteApi> | undefined>
  obtenerDotesPorIndices(indices: string[]): Promise<DoteApi[]>
}
