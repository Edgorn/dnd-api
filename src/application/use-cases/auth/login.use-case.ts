import AuthService from "../../../domain/services/auth.service";
import { LoginParams, LoginResult } from "../../../domain/types/auth.types";

export default class LoginUseCase {
  constructor(private readonly authService: AuthService) { }

  execute({ user, password }: LoginParams): Promise<LoginResult | null> {
    return this.authService.login({ user, password });
  }
}
