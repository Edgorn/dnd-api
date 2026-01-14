import { EquipamientoBasico, EquipamientoChoiceApi, EquipamientoOpcionesMongo, EquipamientoPersonajeApi, EquipamientoPersonajeMongo } from "../types/equipamientos.types";

export default interface IEquipamientoRepository {
  obtenerEquipamientosPersonajePorIndices(index: EquipamientoPersonajeMongo[]): Promise<EquipamientoPersonajeApi[] | undefined>
  formatearOpcionesDeEquipamientos(equipamientosOptions: EquipamientoOpcionesMongo[][] | undefined): Promise<EquipamientoChoiceApi[][]> | undefined
  obtenerEquipamientosPorTipos(tipos: string[]): Promise<EquipamientoBasico[]>
}