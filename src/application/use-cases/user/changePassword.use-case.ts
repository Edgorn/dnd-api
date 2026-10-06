import UserService from "../../../domain/services/user.service";
import AuthService from "../../../domain/services/auth.service";
import { ChangePasswordParams } from "../../../domain/types/user.types";

export default class ChangePasswordUseCase {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService
  ) { }

  async execute(params: ChangePasswordParams): Promise<void> {
    await this.userService.changePassword(params);
    await this.authService.revokeAllSessions(params.id);
  }
}
