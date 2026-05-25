import SystemService from "../../../domain/services/system.service";
import { SystemApi, TypeModificarSystem } from "../../../domain/types/system.types";

export default class ModificarSistema {
  constructor(private readonly systemService: SystemService) {}

  execute(data: TypeModificarSystem): Promise<SystemApi | null> {
    return this.systemService.modificar(data);
  }
}
