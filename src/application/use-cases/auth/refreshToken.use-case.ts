import AuthService from "../../../domain/services/auth.service";
import { LoginResult } from "../../../domain/types/auth.types";

export default class RefreshTokenUseCase {
  constructor(private readonly authService: AuthService) { }

  execute(refreshToken: string): Promise<LoginResult | null> {
    return this.authService.refreshToken(refreshToken);
  }
}
