import CaracteristicaService from "../../../domain/services/caracteristica.service";
import { CaracteristicaApi } from "../../../domain/types/caracteristica.types";

export default class EliminarCaracteristicaDeSistema {
  constructor(private readonly caracteristicaService: CaracteristicaService) { }

  execute(caracteristicaId: string, systemId: string): Promise<CaracteristicaApi> {
    return this.caracteristicaService.eliminarDeSistema(caracteristicaId, systemId);
  }
}
