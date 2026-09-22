import UserService from "../../../domain/services/user.service";
import { UserProfile } from "../../../domain/types/user.types";

export default class GetUserProfileUseCase {
  constructor(private readonly userService: UserService) { }

  execute(actorId: string, id: string): Promise<UserProfile> {
    return this.userService.getUserProfile(actorId, id);
  }
}
