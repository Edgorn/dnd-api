import crypto from 'crypto';
import IUserRepository from "../repositories/IUserRepository";
import { ChangePasswordParams, CreateUserParams, LoginParams, LoginResult, UpdateUserNameParams, UpdateUserProfileParams, User, UserProfile } from "../types/user.types";
import { IPasswordHasher } from "../ports/IPasswordHasher";
import { ITokenService } from "../ports/ITokenService";
import { IUserCache } from "../ports/IUserCache";
import { IRefreshTokenRepository } from "../ports/IRefreshTokenRepository";
import { AppError, NotFoundError, ValidationError } from "../errors/AppError";

const REFRESH_TOKEN_EXPIRATION_DAYS = 7;

export default class UserService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly passwordHasher: IPasswordHasher,
    private readonly tokenService: ITokenService,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly userCache?: IUserCache
  ) { }

  async login({ user, password }: LoginParams): Promise<LoginResult | null> {
    const userResult = await this.userRepository.getUserByName(user);

    if (!userResult || userResult.deletedAt) {
      await this.passwordHasher.compare(password, this.passwordHasher.dummyHash);
      return null;
    }

    const isPasswordValid = await this.passwordHasher.compare(password, userResult.password);
    if (!isPasswordValid) return null;

    const token = this.tokenService.sign({ id: userResult.id });
    const refreshToken = await this.generarYGuardarRefreshToken(userResult.id);

    return {
      token,
      refreshToken,
      user: {
        id: userResult.id,
        name: userResult.name
      }
    };
  }

  async refreshToken(rawRefreshToken: string): Promise<LoginResult | null> {
    if (!rawRefreshToken) return null;

    const storedToken = await this.refreshTokenRepository.findByToken(rawRefreshToken);
    if (!storedToken || storedToken.expiresAt < new Date()) {
      return null;
    }

    const userResult = await this.userRepository.getUserById(storedToken.userId);
    if (!userResult || userResult.deletedAt) return null;

    await this.refreshTokenRepository.revokeByToken(rawRefreshToken);

    const token = this.tokenService.sign({ id: userResult.id });
    const newRefreshToken = await this.generarYGuardarRefreshToken(userResult.id);

    return {
      token,
      refreshToken: newRefreshToken,
      user: {
        id: userResult.id,
        name: userResult.name
      }
    };
  }

  async logout(refreshToken: string): Promise<boolean> {
    if (!refreshToken) return false;
    await this.refreshTokenRepository.revokeByToken(refreshToken);
    return true;
  }

  async validateToken(token: string): Promise<string | null> {
    if (!token) return null;

    const decoded = this.tokenService.verify(token);
    if (!decoded) {
      console.warn("[AUTH] Token inválido o expirado");
      return null;
    }

    const cachedExists = this.userCache?.get(decoded.id);
    if (cachedExists !== null && cachedExists !== undefined) {
      return cachedExists ? decoded.id : null;
    }

    const userResult = await this.userRepository.getUserById(decoded.id);
    const exists = !!userResult && !userResult.deletedAt;
    this.userCache?.set(decoded.id, exists);

    return exists ? decoded.id : null;
  }

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

    await this.refreshTokenRepository.revokeAllByUser(id);
    this.userCache?.invalidate(id);
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

    await this.refreshTokenRepository.revokeAllByUser(id);
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

  private async generarYGuardarRefreshToken(userId: string): Promise<string> {
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRATION_DAYS);

    await this.refreshTokenRepository.create(userId, refreshToken, expiresAt);
    return refreshToken;
  }
}
