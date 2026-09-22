import UserService from "../../../domain/services/user.service";
import { UpdateUserNameParams, UserProfile } from "../../../domain/types/user.types";

export default class UpdateUserNameUseCase {
  constructor(private readonly userService: UserService) { }

  execute(params: UpdateUserNameParams): Promise<UserProfile> {
    return this.userService.updateUserName(params);
  }
}
