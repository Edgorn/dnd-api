import UserService from "../../../domain/services/user.service";
import AuthService from "../../../domain/services/auth.service";

export default class SoftDeleteUserUseCase {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService
  ) { }

  async execute(actorId: string, id: string): Promise<void> {
    await this.userService.softDeleteUser(actorId, id);
    await this.authService.revokeAllSessions(id);
    this.authService.invalidateUser(id);
  }
}
