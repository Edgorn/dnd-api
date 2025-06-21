import CriaturaService from "../../domain/services/criatura.service";

export default class ConsultarCriaturas {
  private criaturaService: CriaturaService

  constructor(criaturaService: CriaturaService) {
    this.criaturaService = criaturaService;
  }

  async execute(): Promise<{success: boolean, data?: any[], message?: string}> {
    return await this.criaturaService.obtenerTodasLasCriaturas()
  }
}
