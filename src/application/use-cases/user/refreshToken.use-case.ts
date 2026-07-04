import UserService from '../../../domain/services/user.service';
import { LoginResult } from '../../../domain/types/user.types';

export default class RefreshTokenUseCase {
  constructor(private readonly userService: UserService) { }

  execute(refreshToken: string): Promise<LoginResult | null> {
    return this.userService.refreshToken(refreshToken);
  }
}
