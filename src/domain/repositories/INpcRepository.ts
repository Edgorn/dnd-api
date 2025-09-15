import { CriaturaApi } from "../types/criaturas.types";

export default interface INpcRepository {
  obtenerTodos(): Promise<CriaturaApi[]>
}
