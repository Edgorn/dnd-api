import UserService from "../../../domain/services/user.service";
import { ChangePasswordParams } from "../../../domain/types/user.types";

export default class ChangePasswordUseCase {
  constructor(private readonly userService: UserService) { }

  execute(params: ChangePasswordParams): Promise<void> {
    return this.userService.changePassword(params);
  }
}
