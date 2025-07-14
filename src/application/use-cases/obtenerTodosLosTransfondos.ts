import TransfondoService from "../../domain/services/transfondo.service"
import { TransfondoApi } from "../../domain/types/transfondos";

export default class ObtenerTodosLosTransfondos {
  private transfondoService: TransfondoService

  constructor(transfondoService: TransfondoService) {
    this.transfondoService = transfondoService;
  }

  async execute(): Promise<{success: boolean, data?: TransfondoApi[], message?: string}> {
    return await this.transfondoService.obtenerTodosLosTransfondos();
  }
}
