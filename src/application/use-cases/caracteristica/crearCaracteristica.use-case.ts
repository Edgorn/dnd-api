import CaracteristicaService from "../../../domain/services/caracteristica.service";
import { CaracteristicaApi, InputCrearCaracteristica } from "../../../domain/types/caracteristica.types";

export default class CrearCaracteristica {
  constructor(private readonly caracteristicaService: CaracteristicaService) { }

  execute(data: InputCrearCaracteristica): Promise<CaracteristicaApi> {
    return this.caracteristicaService.crear(data);
  }
}
