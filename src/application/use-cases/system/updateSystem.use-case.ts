import SystemService from "../../../domain/services/system.service";
import GetSystemApi from "./getSystemApi.use-case";
import { SystemApi, TypeModificarSystem } from "../../../domain/types/system.types";

export default class UpdateSystem {
  constructor(
    private readonly systemService: SystemService,
    private readonly getSystemApi: GetSystemApi
  ) {}

  async execute(data: TypeModificarSystem): Promise<SystemApi | null> {
    const system = await this.systemService.update(data);
    if (!system) return null;
    return this.getSystemApi.execute(system, data.userId);
  }
}
