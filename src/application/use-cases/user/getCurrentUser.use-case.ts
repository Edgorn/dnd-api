import UserService from "../../../domain/services/user.service";
import { UserProfile } from "../../../domain/types/user.types";

export default class GetCurrentUserUseCase {
  constructor(private readonly userService: UserService) { }

  execute(id: string): Promise<UserProfile> {
    return this.userService.getCurrentUser(id);
  }
}
