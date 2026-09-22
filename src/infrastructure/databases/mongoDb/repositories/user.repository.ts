import IUserRepository from '../../../../domain/repositories/IUserRepository';
import { ConflictError } from '../../../../domain/errors/AppError';
import { UserApi, User, UserProfile, CreateUserRecord, UpdateUserProfileData } from '../../../../domain/types/user.types';
import UserModel, { UserDocument } from '../schemas/User';

const DUPLICATE_KEY_CODE = 11000;

function isDuplicateKeyError(error: unknown): boolean {
  return typeof error === "object"
    && error !== null
    && "code" in error
    && (error as { code: unknown }).code === DUPLICATE_KEY_CODE;
}

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

  async listActive(): Promise<UserProfile[]> {
    const users = await UserModel.find({ deletedAt: null }).lean<UserDocument[]>();
    return users.map(user => this.toProfile(user));
  }

  async create(data: CreateUserRecord): Promise<UserProfile> {
    try {
      const created = await UserModel.create({
        name: data.name,
        password: data.password,
        accessibleSystems: data.accessibleSystems,
        isAdmin: false,
        deletedAt: null
      });

      return this.toProfile(created);
    } catch (error: unknown) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictError("Ya existe un usuario con ese nombre");
      }
      throw error;
    }
  }

  async updateName(id: string, name: string): Promise<UserProfile | null> {
    try {
      const updated = await UserModel.findByIdAndUpdate(
        id,
        { $set: { name } },
        { returnDocument: "after" }
      ).lean<UserDocument>();

      return updated ? this.toProfile(updated) : null;
    } catch (error: unknown) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictError("Ya existe un usuario con ese nombre");
      }
      throw error;
    }
  }

  async updateProfile(id: string, data: UpdateUserProfileData): Promise<UserProfile | null> {
    const update: UpdateUserProfileData = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.accessibleSystems !== undefined) update.accessibleSystems = data.accessibleSystems;

    try {
      const updated = await UserModel.findOneAndUpdate(
        { _id: id, deletedAt: null },
        { $set: update },
        { returnDocument: "after" }
      ).lean<UserDocument>();

      return updated ? this.toProfile(updated) : null;
    } catch (error: unknown) {
      if (isDuplicateKeyError(error)) {
        throw new ConflictError("Ya existe un usuario con ese nombre");
      }
      throw error;
    }
  }

  async updatePassword(id: string, password: string): Promise<boolean> {
    const result = await UserModel.updateOne({ _id: id }, { $set: { password } });
    return result.matchedCount > 0;
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await UserModel.updateOne(
      { _id: id, deletedAt: null },
      { $set: { deletedAt: new Date() } }
    );
    return result.matchedCount > 0;
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

  private toProfile(doc: Pick<UserDocument, "_id" | "name" | "accessibleSystems" | "isAdmin">): UserProfile {
    return {
      id: doc._id.toString(),
      name: doc.name,
      accessibleSystems: doc.accessibleSystems ?? [],
      isAdmin: doc.isAdmin === true
    };
  }

  private toDomain(doc: UserDocument): User {
    return {
      id: doc._id.toString(),
      name: doc.name,
      password: doc.password,
      accessibleSystems: doc.accessibleSystems ?? [],
      isAdmin: doc.isAdmin === true,
      deletedAt: doc.deletedAt ?? null
    };
  }
}

