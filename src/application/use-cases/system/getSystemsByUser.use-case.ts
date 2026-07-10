import SystemService from "../../../domain/services/system.service";
import IUserRepository from "../../../domain/repositories/IUserRepository";
import GetSystemApi from "./getSystemApi.use-case";
import { SystemApi } from "../../../domain/types/system.types";

export default class GetSystemsByUser {
  constructor(
    private readonly systemService: SystemService,
    private readonly userRepository: IUserRepository,
    private readonly getSystemApi: GetSystemApi
  ) {}

  async execute(userId: string): Promise<SystemApi[]> {
    const user = await this.userRepository.getUserById(userId);
    const accessibleSystemIds = user?.accessibleSystems || [];
    const systems = await this.systemService.getByUserId(userId, accessibleSystemIds);
    return Promise.all(systems.map(sys => this.getSystemApi.execute(sys, userId)));
  }
}
