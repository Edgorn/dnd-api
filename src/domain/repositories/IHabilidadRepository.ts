import { ChoiceApi, ChoiceMongo } from "../types";
import { HabilidadApi, HabilidadPersonajeApi } from "../types/habilidades.types";

export default interface IHabilidadRepository {
  obtenerHabilidadesPorIndices(indices: string[]): Promise<HabilidadApi[]>
  obtenerHabilidadesPersonaje(skills: string[]): Promise<HabilidadPersonajeApi[]>
  formatearOpcionesDeHabilidad(opciones: ChoiceMongo | undefined): Promise<ChoiceApi<HabilidadApi> | undefined>
}
