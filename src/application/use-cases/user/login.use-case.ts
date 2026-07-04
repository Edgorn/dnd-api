import UserService from '../../../domain/services/user.service';
import { LoginParams, LoginResult } from '../../../domain/types/user.types';

export default class LoginUseCase {
  constructor(private readonly userService: UserService) { }

  execute({ user, password }: LoginParams): Promise<LoginResult | null> {
    return this.userService.login({ user, password });
  }
}
