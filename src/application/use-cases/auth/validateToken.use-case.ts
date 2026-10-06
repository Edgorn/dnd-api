import AuthService from "../../../domain/services/auth.service";

export default class ValidateTokenUseCase {
  constructor(private readonly authService: AuthService) { }

  execute(token: string): Promise<string | null> {
    return this.authService.validateToken(token);
  }
}
