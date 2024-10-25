import EquipamientoService from "../../domain/services/equipamiento.service"

export default class ConsultarEquipamientos {
  private equipamientoService: EquipamientoService

  constructor(equipamientoService: EquipamientoService) {
    this.equipamientoService = equipamientoService;
  }

  async execute(data: any): Promise<any> {
    return await this.equipamientoService.obtenerEquipamientosPorTipo(data)
  }
}
