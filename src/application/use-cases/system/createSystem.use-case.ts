import SystemService from "../../../domain/services/system.service";
import GetSystemApi from "./getSystemApi.use-case";
import { SystemApi, TypeCrearSystem } from "../../../domain/types/system.types";

export default class CreateSystem {
  constructor(
    private readonly systemService: SystemService,
    private readonly getSystemApi: GetSystemApi
  ) {}

  async execute(data: TypeCrearSystem): Promise<SystemApi | null> {
    const system = await this.systemService.create(data);
    if (!system) return null;
    return this.getSystemApi.execute(system, data.publisher);
  }
}
