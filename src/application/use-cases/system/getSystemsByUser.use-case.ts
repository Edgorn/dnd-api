import SystemService from "../../../domain/services/system.service";
import { SystemApi } from "../../../domain/types/system.types";

export default class GetSystemsByUser {
  constructor(private readonly systemService: SystemService) {}

  execute(userId: string): Promise<SystemApi[]> {
    return this.systemService.consultarPorUsuario(userId);
  }
}
