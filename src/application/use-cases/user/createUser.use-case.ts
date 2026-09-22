import UserService from "../../../domain/services/user.service";
import { CreateUserParams, UserProfile } from "../../../domain/types/user.types";

export default class CreateUserUseCase {
  constructor(private readonly userService: UserService) { }

  execute(actorId: string, params: CreateUserParams): Promise<UserProfile> {
    return this.userService.createUser(actorId, params);
  }
}
