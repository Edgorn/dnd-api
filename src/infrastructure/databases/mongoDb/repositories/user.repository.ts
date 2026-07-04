import IUserRepository from '../../../../domain/repositories/IUserRepository';
import { UserApi, User } from '../../../../domain/types/user.types';
import UserModel, { UserDocument } from '../schemas/User';

export default class UserRepository implements IUserRepository {
  constructor() {
  }

  async getUserById(id: string): Promise<User | null> {
    const user = await UserModel.findById(id).lean<UserDocument>();
    return user ? this.toDomain(user) : null;
  }

  async getUserByName(user: string): Promise<User | null> {
    const userDoc = await UserModel.findOne({ name: user }).lean<UserDocument>();
    return userDoc ? this.toDomain(userDoc) : null;
  }

  async getUserName(id: string): Promise<string> {
    const user = await UserModel.findById(id).select('name').lean();
    return user?.name ?? '';
  }

  async getUsers(indices: string[]): Promise<UserApi[]> {
    const users = await UserModel.find().where('_id').in(indices).lean<UserDocument[]>();

    return this.formatearUsuariosBasicos(users);
  }

  private formatearUsuariosBasicos(users: UserDocument[]): UserApi[] {
    return users.map(user => this.formatearUsuarioBasico(user));
  }

  private formatearUsuarioBasico(user: UserDocument): UserApi {
    return {
      id: user?._id?.toString(),
      name: user.name
    };
  }

  private toDomain(doc: UserDocument): User {
    return {
      id: doc._id.toString(),
      name: doc.name,
      password: doc.password,
      accessibleSystems: doc.accessibleSystems ?? []
    };
  }
}

