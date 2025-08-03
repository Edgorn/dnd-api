import { ChoiceApi } from "../types";
import { ChoiceSpell, ConjuroApi } from "../types/conjuros.types";

export default interface IConjuroRepository {
  formatearOpcionesDeConjuros(opciones: ChoiceSpell | undefined): Promise<ChoiceApi<ConjuroApi> | undefined>
  obtenerConjurosPorIndices(indices: string[]): Promise<ConjuroApi[]> 
}
