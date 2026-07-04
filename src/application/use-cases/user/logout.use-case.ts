import UserService from '../../../domain/services/user.service';

export default class LogoutUseCase {
  constructor(private readonly userService: UserService) { }

  execute(refreshToken: string): Promise<boolean> {
    return this.userService.logout(refreshToken);
  }
}
