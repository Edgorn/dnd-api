import AuthService from "../../../domain/services/auth.service";

export default class LogoutUseCase {
  constructor(private readonly authService: AuthService) { }

  execute(refreshToken: string): Promise<boolean> {
    return this.authService.logout(refreshToken);
  }
}
