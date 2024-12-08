import TransfondoService from "../../domain/services/transfondo.service"

export default class ObtenerTodosLosTransfondos {
  private transfondoService: TransfondoService

  constructor(transfondoService: TransfondoService) {
    this.transfondoService = transfondoService;
  }

  async execute(): Promise<any> {
    return await this.transfondoService.obtenerTodosLosTransfondos();
  }
}
