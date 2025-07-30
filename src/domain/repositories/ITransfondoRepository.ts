import { TransfondoApi } from "../types/transfondos.types";

export default interface ITransfondoRepository {
  obtenerTodos(): Promise<TransfondoApi[]>
}