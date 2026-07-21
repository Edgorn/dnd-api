import UserService from '../../../domain/services/user.service';

export default class ValidateTokenUseCase {
  constructor(private readonly userService: UserService) { }

  execute(token: string): Promise<string | null> {
    return this.userService.validateToken(token);
  }
}
