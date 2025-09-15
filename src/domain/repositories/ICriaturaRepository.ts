import { CriaturaApi } from "../types/criaturas.types";

export default interface ICriaturaRepository {
  obtenerTodas(): Promise<CriaturaApi[]>
}
