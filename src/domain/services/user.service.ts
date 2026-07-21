import crypto from 'crypto';
import IUserRepository from "../repositories/IUserRepository";
import { LoginParams, LoginResult, User } from "../types/user.types";
import { IPasswordHasher } from "../ports/IPasswordHasher";
import { ITokenService } from "../ports/ITokenService";
import { IUserCache } from "../ports/IUserCache";
import { IRefreshTokenRepository } from "../ports/IRefreshTokenRepository";

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

    if (!userResult) {
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
    if (!userResult) return null;

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
    const exists = !!userResult;
    this.userCache?.set(decoded.id, exists);

    return exists ? decoded.id : null;
  }

  getUserById(id: string): Promise<User | null> {
    return this.userRepository.getUserById(id);
  }

  private async generarYGuardarRefreshToken(userId: string): Promise<string> {
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRATION_DAYS);

    await this.refreshTokenRepository.create(userId, refreshToken, expiresAt);
    return refreshToken;
  }
}
