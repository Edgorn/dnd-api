import UserService from "../../../domain/services/user.service";
import { UpdateUserProfileParams, UserProfile } from "../../../domain/types/user.types";

export default class UpdateUserProfileUseCase {
  constructor(private readonly userService: UserService) { }

  execute(params: UpdateUserProfileParams): Promise<UserProfile> {
    return this.userService.updateUserProfile(params);
  }
}
