import UserService from "../../../domain/services/user.service";

export default class SoftDeleteUserUseCase {
  constructor(private readonly userService: UserService) { }

  execute(actorId: string, id: string): Promise<void> {
    return this.userService.softDeleteUser(actorId, id);
  }
}
