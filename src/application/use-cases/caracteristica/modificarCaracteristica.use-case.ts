import CaracteristicaService from "../../../domain/services/caracteristica.service";
import { CaracteristicaApi, InputModificarCaracteristica } from "../../../domain/types/caracteristica.types";

export default class ModificarCaracteristica {
  constructor(private readonly caracteristicaService: CaracteristicaService) { }

  execute(data: InputModificarCaracteristica): Promise<CaracteristicaApi> {
    return this.caracteristicaService.modificar(data);
  }
}
