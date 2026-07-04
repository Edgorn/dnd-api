import { UserApi, User } from "../types/user.types";

export default interface IUserRepository {
  getUserById(id: string): Promise<User | null>
  getUserByName(user: string): Promise<User | null>
  getUserName(id: string): Promise<string>

  getUsers(indexList: string[]): Promise<UserApi[]>
}