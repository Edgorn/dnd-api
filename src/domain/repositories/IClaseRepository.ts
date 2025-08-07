import { ClaseApi } from "../types/clases.types";

export default interface IClaseRepository {
  obtenerTodas(): Promise<ClaseApi[]>
}