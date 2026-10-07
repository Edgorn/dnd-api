import SystemService from "../../../domain/services/system.service";
import BuildSystemSummary from "./buildSystemSummary.use-case";
import { SystemSummary, TypeCrearSystem } from "../../../domain/types/system.types";

export default class CreateSystem {
  constructor(
    private readonly systemService: SystemService,
    private readonly buildSystemSummary: BuildSystemSummary
  ) {}

  async execute(data: TypeCrearSystem): Promise<SystemSummary | null> {
    const system = await this.systemService.create(data);
    if (!system) return null;
    return this.buildSystemSummary.execute(system, data.publisher);
  }
}
