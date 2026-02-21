import { CriaturaApi } from "../types/criaturas.types";

export default interface ICriaturaRepository {
  obtenerTodas(): Promise<CriaturaApi[]>
  obtenerPorTipos(types: string[]): Promise<CriaturaApi[]>
}
