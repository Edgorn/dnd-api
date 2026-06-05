import CaracteristicaService from "../../../domain/services/caracteristica.service";
import { CaracteristicaApi } from "../../../domain/types/caracteristica.types";

export default class AñadirCaracteristicaASistema {
  constructor(private readonly caracteristicaService: CaracteristicaService) { }

  execute(caracteristicaId: string, systemId: string): Promise<CaracteristicaApi> {
    return this.caracteristicaService.añadirASistema(caracteristicaId, systemId);
  }
}
