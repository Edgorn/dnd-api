import { ClaseApi, ClaseLevelUp } from "../types/clases.types";

export default interface IClaseRepository {
  obtenerTodas(): Promise<ClaseApi[]>
  dataLevelUp(idClase: string, level: number, subclasses: string[]): Promise<ClaseLevelUp | null>
}