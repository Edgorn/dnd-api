import crypto from "crypto";
import IUserRepository from "../repositories/IUserRepository";
import { LoginParams, LoginResult } from "../types/auth.types";
import { IPasswordHasher } from "../ports/IPasswordHasher";
import { ITokenService } from "../ports/ITokenService";
import { IUserCache } from "../ports/IUserCache";
import { IRefreshTokenRepository } from "../ports/IRefreshTokenRepository";
import { RateLimitedError } from "../errors/AppError";

const REFRESH_TOKEN_EXPIRATION_DAYS = 7;
const MINUTE_MS = 60 * 1000;

function lockDurationMs(failedAttempts: number): number | null {
  if (failedAttempts >= 20) return 60 * MINUTE_MS;
  if (failedAttempts >= 15) return 15 * MINUTE_MS;
  if (failedAttempts >= 10) return 5 * MINUTE_MS;
  if (failedAttempts >= 5) return MINUTE_MS;
  return null;
}

function retryAfterSeconds(lockedUntil: Date): number {
  return Math.max(1, Math.ceil((lockedUntil.getTime() - Date.now()) / 1000));
}

export default class AuthService {
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

    if (userResult.lockedUntil && userResult.lockedUntil.getTime() > Date.now()) {
      throw new RateLimitedError(retryAfterSeconds(userResult.lockedUntil));
    }

    const isPasswordValid = await this.passwordHasher.compare(password, userResult.password);
    if (!isPasswordValid) {
      const failedLoginAttempts = userResult.failedLoginAttempts + 1;
      const durationMs = lockDurationMs(failedLoginAttempts);
      await this.userRepository.updateLoginGuard(userResult.id, {
        failedLoginAttempts,
        lockedUntil: durationMs ? new Date(Date.now() + durationMs) : null
      });
      return null;
    }

    if (userResult.failedLoginAttempts > 0 || userResult.lockedUntil) {
      await this.userRepository.updateLoginGuard(userResult.id, {
        failedLoginAttempts: 0,
        lockedUntil: null
      });
    }

    const token = this.tokenService.sign({ id: userResult.id });
    const refreshToken = await this.generateAndStoreRefreshToken(userResult.id);

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
    const newRefreshToken = await this.generateAndStoreRefreshToken(userResult.id);

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

  async revokeAllSessions(userId: string): Promise<void> {
    await this.refreshTokenRepository.revokeAllByUser(userId);
  }

  invalidateUser(userId: string): void {
    this.userCache?.invalidate(userId);
  }

  private async generateAndStoreRefreshToken(userId: string): Promise<string> {
    const refreshToken = crypto.randomBytes(40).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRATION_DAYS);

    await this.refreshTokenRepository.create(userId, refreshToken, expiresAt);
    return refreshToken;
  }
}
