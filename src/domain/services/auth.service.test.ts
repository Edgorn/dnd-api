import { describe, it, expect, vi } from "vitest";
import AuthService from "./auth.service";
import IUserRepository from "../repositories/IUserRepository";
import { IPasswordHasher } from "../ports/IPasswordHasher";
import { ITokenService } from "../ports/ITokenService";
import { IRefreshTokenRepository } from "../ports/IRefreshTokenRepository";
import { IUserCache } from "../ports/IUserCache";
import { RateLimitedError } from "../errors/AppError";
import { User } from "../types/user.types";

const user: User = {
  id: "507f1f77bcf86cd799439011",
  name: "Ada",
  password: "hashed-current",
  accessibleSystems: [],
  isAdmin: false,
  deletedAt: null,
  failedLoginAttempts: 0,
  lockedUntil: null
};

function createService(overrides: {
  userRepository?: Partial<IUserRepository>;
  passwordHasher?: Partial<IPasswordHasher>;
  tokenService?: Partial<ITokenService>;
  refreshTokenRepository?: Partial<IRefreshTokenRepository>;
  userCache?: Partial<IUserCache>;
} = {}) {
  const userRepository = {
    getUserById: vi.fn().mockResolvedValue(user),
    getUserByName: vi.fn().mockResolvedValue(user),
    updateLoginGuard: vi.fn().mockResolvedValue(undefined),
    ...overrides.userRepository
  } as unknown as IUserRepository;

  const passwordHasher = {
    hash: vi.fn().mockResolvedValue("hashed-new"),
    compare: vi.fn().mockResolvedValue(true),
    dummyHash: "dummy",
    ...overrides.passwordHasher
  } as unknown as IPasswordHasher;

  const tokenService = {
    sign: vi.fn().mockReturnValue("access-token"),
    verify: vi.fn().mockReturnValue({ id: user.id }),
    ...overrides.tokenService
  } as unknown as ITokenService;

  const refreshTokenRepository = {
    revokeAllByUser: vi.fn().mockResolvedValue(undefined),
    create: vi.fn().mockResolvedValue(undefined),
    findByToken: vi.fn(),
    revokeByToken: vi.fn().mockResolvedValue(undefined),
    ...overrides.refreshTokenRepository
  } as unknown as IRefreshTokenRepository;

  const userCache = {
    get: vi.fn().mockReturnValue(null),
    set: vi.fn(),
    invalidate: vi.fn(),
    ...overrides.userCache
  } as unknown as IUserCache;

  const service = new AuthService(
    userRepository,
    passwordHasher,
    tokenService,
    refreshTokenRepository,
    userCache
  );

  return { service, userRepository, passwordHasher, tokenService, refreshTokenRepository, userCache };
}

describe("AuthService deleted accounts", () => {
  const deletedUser: User = { ...user, deletedAt: new Date("2026-01-01T00:00:00.000Z") };

  it("treats a deleted account as unknown credentials on login", async () => {
    const { service, passwordHasher, tokenService } = createService({
      userRepository: { getUserByName: vi.fn().mockResolvedValue(deletedUser) }
    });

    await expect(service.login({ user: "Ada", password: "secret123" })).resolves.toBeNull();
    expect(passwordHasher.compare).toHaveBeenCalledWith("secret123", "dummy");
    expect(tokenService.sign).not.toHaveBeenCalled();
  });

  it("rejects a refresh token that belongs to a deleted account", async () => {
    const { service, tokenService, refreshTokenRepository } = createService({
      userRepository: { getUserById: vi.fn().mockResolvedValue(deletedUser) },
      refreshTokenRepository: {
        findByToken: vi.fn().mockResolvedValue({
          token: "refresh",
          userId: user.id,
          expiresAt: new Date(Date.now() + 60_000),
          revoked: false
        })
      }
    });

    await expect(service.refreshToken("refresh")).resolves.toBeNull();
    expect(tokenService.sign).not.toHaveBeenCalled();
    expect(refreshTokenRepository.revokeByToken).not.toHaveBeenCalled();
  });

  it("rejects an access token when the account is deleted", async () => {
    const { service, userCache } = createService({
      userRepository: { getUserById: vi.fn().mockResolvedValue(deletedUser) }
    });

    await expect(service.validateToken("access-token")).resolves.toBeNull();
    expect(userCache.set).toHaveBeenCalledWith(user.id, false);
  });
});

describe("AuthService login lockout", () => {
  it("records a failed attempt without locking before the fifth failure", async () => {
    const { service, userRepository } = createService({
      passwordHasher: { compare: vi.fn().mockResolvedValue(false) }
    });

    await expect(service.login({ user: "Ada", password: "wrong" })).resolves.toBeNull();
    expect(userRepository.updateLoginGuard).toHaveBeenCalledWith(user.id, {
      failedLoginAttempts: 1,
      lockedUntil: null
    });
  });

  it("locks the account for one minute on the fifth consecutive failure", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-06T12:00:00.000Z"));

    try {
      const { service, userRepository } = createService({
        userRepository: { getUserByName: vi.fn().mockResolvedValue({ ...user, failedLoginAttempts: 4 }) },
        passwordHasher: { compare: vi.fn().mockResolvedValue(false) }
      });

      await expect(service.login({ user: "Ada", password: "wrong" })).resolves.toBeNull();
      expect(userRepository.updateLoginGuard).toHaveBeenCalledWith(user.id, {
        failedLoginAttempts: 5,
        lockedUntil: new Date("2026-10-06T12:01:00.000Z")
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it("rejects login while the account is locked", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-06T12:00:00.000Z"));

    try {
      const lockedUntil = new Date("2026-10-06T12:05:00.000Z");
      const { service, userRepository, passwordHasher } = createService({
        userRepository: {
          getUserByName: vi.fn().mockResolvedValue({
            ...user,
            failedLoginAttempts: 10,
            lockedUntil
          })
        }
      });

      await expect(service.login({ user: "Ada", password: "secret123" })).rejects.toSatisfy(
        (error: unknown) =>
          error instanceof RateLimitedError
          && error.statusCode === 429
          && error.retryAfterSeconds === 300
      );
      expect(passwordHasher.compare).not.toHaveBeenCalled();
      expect(userRepository.updateLoginGuard).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it("resets the lockout counters after a successful login", async () => {
    const { service, userRepository } = createService({
      userRepository: {
        getUserByName: vi.fn().mockResolvedValue({ ...user, failedLoginAttempts: 3 })
      }
    });

    await expect(service.login({ user: "Ada", password: "secret123" })).resolves.toMatchObject({
      token: "access-token"
    });
    expect(userRepository.updateLoginGuard).toHaveBeenCalledWith(user.id, {
      failedLoginAttempts: 0,
      lockedUntil: null
    });
  });
});

describe("AuthService refresh rotation", () => {
  it("revokes the previous refresh token and issues a new pair", async () => {
    const { service, refreshTokenRepository, tokenService } = createService({
      refreshTokenRepository: {
        findByToken: vi.fn().mockResolvedValue({
          token: "old-refresh",
          userId: user.id,
          expiresAt: new Date(Date.now() + 60_000),
          revoked: false
        })
      }
    });

    const result = await service.refreshToken("old-refresh");

    expect(refreshTokenRepository.revokeByToken).toHaveBeenCalledWith("old-refresh");
    expect(refreshTokenRepository.create).toHaveBeenCalled();
    expect(tokenService.sign).toHaveBeenCalledWith({ id: user.id });
    expect(result?.token).toBe("access-token");
    expect(result?.refreshToken).toEqual(expect.any(String));
    expect(result?.refreshToken).not.toBe("old-refresh");
  });
});

describe("AuthService session teardown", () => {
  it("revokes refresh tokens without touching the access-token cache", async () => {
    const { service, refreshTokenRepository, userCache } = createService();

    await service.revokeAllSessions(user.id);

    expect(refreshTokenRepository.revokeAllByUser).toHaveBeenCalledWith(user.id);
    expect(userCache.invalidate).not.toHaveBeenCalled();
  });

  it("invalidates the access-token cache", () => {
    const { service, userCache } = createService();

    service.invalidateUser(user.id);

    expect(userCache.invalidate).toHaveBeenCalledWith(user.id);
  });
});
