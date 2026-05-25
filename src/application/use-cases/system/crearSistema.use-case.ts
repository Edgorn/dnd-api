import SystemService from "../../../domain/services/system.service";
import { SystemApi, TypeCrearSystem } from "../../../domain/types/system.types";

export default class CrearSistema {
  constructor(private readonly systemService: SystemService) {}

  execute(data: TypeCrearSystem): Promise<SystemApi | null> {
    return this.systemService.crear(data);
  }
}
