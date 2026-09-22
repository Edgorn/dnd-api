import { UserApi, User, UserProfile, CreateUserRecord, UpdateUserProfileData } from "../types/user.types";

export default interface IUserRepository {
  getUserById(id: string): Promise<User | null>
  getUserByName(user: string): Promise<User | null>
  getUserName(id: string): Promise<string>

  getUsers(indexList: string[]): Promise<UserApi[]>
  listActive(): Promise<UserProfile[]>

  create(data: CreateUserRecord): Promise<UserProfile>
  updateName(id: string, name: string): Promise<UserProfile | null>
  updateProfile(id: string, data: UpdateUserProfileData): Promise<UserProfile | null>
  updatePassword(id: string, password: string): Promise<boolean>
  softDelete(id: string): Promise<boolean>
}