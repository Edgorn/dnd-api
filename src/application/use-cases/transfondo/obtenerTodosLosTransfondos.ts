import TransfondoService from "../../../domain/services/transfondo.service"
import { TransfondoApi } from "../../../domain/types/transfondos.types";

export default class ObtenerTodosLosTransfondos {
  constructor(private readonly transfondoService: TransfondoService) { }

  execute(): Promise<TransfondoApi[]> {
    return this.transfondoService.obtenerTodos();
  }
}
