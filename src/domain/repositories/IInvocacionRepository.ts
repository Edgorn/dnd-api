import { ChoiceApi } from "../types";
import { InvocacionApi } from "../types/invocaciones.types";

export default interface IInvocacionRepository {
  obtenerOpciones(numberOptions: number): Promise<ChoiceApi<InvocacionApi> | undefined>
  obtenerPorIndices(indices: string[]): Promise<InvocacionApi[]>
}
