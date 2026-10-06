import IUserRepository from "../repositories/IUserRepository";
import { ChangePasswordParams, CreateUserParams, UpdateUserNameParams, UpdateUserProfileParams, User, UserProfile } from "../types/user.types";
import { IPasswordHasher } from "../ports/IPasswordHasher";
import { AppError, NotFoundError, ValidationError } from "../errors/AppError";

export default class UserService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher
  ) { }

  getUserById(id: string): Promise<User | null> {
    return this.userRepository.getUserById(id);
  }

  async createUser(actorId: string, { name, password, accessibleSystems }: CreateUserParams): Promise<UserProfile> {
    await this.requireAdmin(actorId);
    const trimmedName = this.requireName(name);
    const passwordHash = await this.passwordHasher.hash(password);

    return this.userRepository.create({
      name: trimmedName,
      password: passwordHash,
      accessibleSystems: accessibleSystems ?? []
    });
  }

  async listUsers(actorId: string): Promise<UserProfile[]> {
    await this.requireAdmin(actorId);
    return this.userRepository.listActive();
  }

  async getUserProfile(actorId: string, id: string): Promise<UserProfile> {
    await this.requireAdmin(actorId);
    const user = await this.requireActiveUser(id);
    return this.toProfile(user);
  }

  async updateUserProfile({ actorId, id, name, accessibleSystems }: UpdateUserProfileParams): Promise<UserProfile> {
    await this.requireAdmin(actorId);
    if (name === undefined && accessibleSystems === undefined) {
      throw new ValidationError("Debe proporcionar al menos un campo para modificar");
    }

    await this.requireActiveUser(id);

    const updated = await this.userRepository.updateProfile(id, {
      ...(name !== undefined ? { name: this.requireName(name) } : {}),
      ...(accessibleSystems !== undefined ? { accessibleSystems } : {})
    });
    if (!updated) {
      throw new NotFoundError("Usuario no encontrado");
    }

    return updated;
  }

  async softDeleteUser(actorId: string, id: string): Promise<void> {
    await this.requireAdmin(actorId);
    const target = await this.requireActiveUser(id);

    if (target.id === actorId) {
      throw new AppError("No puedes eliminar tu propia cuenta", 403);
    }

    if (target.isAdmin) {
      throw new AppError("No se puede eliminar un administrador", 403);
    }

    const deleted = await this.userRepository.softDelete(id);
    if (!deleted) {
      throw new NotFoundError("Usuario no encontrado");
    }
  }

  async getCurrentUser(id: string): Promise<UserProfile> {
    const user = await this.userRepository.getUserById(id);
    if (!user) {
      throw new NotFoundError("Usuario no encontrado");
    }

    return this.toProfile(user);
  }

  async updateUserName({ id, name }: UpdateUserNameParams): Promise<UserProfile> {
    const updated = await this.userRepository.updateName(id, this.requireName(name));
    if (!updated) {
      throw new NotFoundError("Usuario no encontrado");
    }

    return updated;
  }

  async changePassword({ id, currentPassword, newPassword }: ChangePasswordParams): Promise<void> {
    const user = await this.userRepository.getUserById(id);
    if (!user) {
      throw new NotFoundError("Usuario no encontrado");
    }

    const isCurrentPasswordValid = await this.passwordHasher.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new AppError("Contraseña actual incorrecta", 401);
    }

    const passwordHash = await this.passwordHasher.hash(newPassword);
    const updated = await this.userRepository.updatePassword(id, passwordHash);
    if (!updated) {
      throw new NotFoundError("Usuario no encontrado");
    }
  }

  private async requireAdmin(actorId: string): Promise<User> {
    const actor = await this.userRepository.getUserById(actorId);
    if (!actor || actor.deletedAt || !actor.isAdmin) {
      throw new AppError("No tienes permisos de administrador", 403);
    }
    return actor;
  }

  private async requireActiveUser(id: string): Promise<User> {
    const user = await this.userRepository.getUserById(id);
    if (!user || user.deletedAt) {
      throw new NotFoundError("Usuario no encontrado");
    }
    return user;
  }

  private requireName(name: string): string {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new ValidationError("El nombre es requerido");
    }
    return trimmedName;
  }

  private toProfile(user: User): UserProfile {
    return {
      id: user.id,
      name: user.name,
      accessibleSystems: user.accessibleSystems,
      isAdmin: user.isAdmin
    };
  }
}
