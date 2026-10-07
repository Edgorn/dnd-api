import SystemService from "../../../domain/services/system.service";
import IUserRepository from "../../../domain/repositories/IUserRepository";
import GetSystemApi from "./getSystemApi.use-case";
import { System, SystemApi } from "../../../domain/types/system.types";
import { AppError, NotFoundError } from "../../../domain/errors/AppError";

export default class GetSystemById {
  constructor(
    private readonly systemService: SystemService,
    private readonly userRepository: IUserRepository,
    private readonly getSystemApi: GetSystemApi
  ) {}

  async execute(systemId: string, userId: string): Promise<SystemApi> {
    const system = await this.systemService.getById(systemId);
    if (!system) {
      throw new NotFoundError("Sistema no encontrado");
    }

    const user = await this.userRepository.getUserById(userId);
    const accessibleSystemIds = user?.accessibleSystems ?? [];

    if (!this.canAccess(system, userId, accessibleSystemIds)) {
      throw new AppError("No tienes permisos de acceso a este sistema", 403);
    }

    return this.getSystemApi.execute(system, userId);
  }

  private canAccess(system: System, userId: string, accessibleSystemIds: string[]): boolean {
    if (system.publisher === userId) return true;
    if (system.isOpen) return true;
    return accessibleSystemIds.includes(system._id.toString());
  }
}
