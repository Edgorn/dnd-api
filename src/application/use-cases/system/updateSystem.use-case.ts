import SystemService from "../../../domain/services/system.service";
import BuildSystemSummary from "./buildSystemSummary.use-case";
import { SystemSummary, TypeModificarSystem } from "../../../domain/types/system.types";

export default class UpdateSystem {
  constructor(
    private readonly systemService: SystemService,
    private readonly buildSystemSummary: BuildSystemSummary
  ) {}

  async execute(data: TypeModificarSystem): Promise<SystemSummary | null> {
    const system = await this.systemService.update(data);
    if (!system) return null;
    return this.buildSystemSummary.execute(system, data.userId);
  }
}
