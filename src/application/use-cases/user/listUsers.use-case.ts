import UserService from "../../../domain/services/user.service";
import { UserProfile } from "../../../domain/types/user.types";

export default class ListUsersUseCase {
  constructor(private readonly userService: UserService) { }

  execute(actorId: string): Promise<UserProfile[]> {
    return this.userService.listUsers(actorId);
  }
}
