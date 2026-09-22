import { describe, it, expect, vi } from "vitest";
import UserService from "./user.service";
import IUserRepository from "../repositories/IUserRepository";
import { IPasswordHasher } from "../ports/IPasswordHasher";
import { ITokenService } from "../ports/ITokenService";
import { IRefreshTokenRepository } from "../ports/IRefreshTokenRepository";
import { IUserCache } from "../ports/IUserCache";
import { AppError, NotFoundError } from "../errors/AppError";
import { User } from "../types/user.types";

const user: User = {
  id: "507f1f77bcf86cd799439011",
  name: "Ada",
  password: "hashed-current",
  accessibleSystems: [],
  isAdmin: false,
  deletedAt: null
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
    create: vi.fn().mockResolvedValue({ id: user.id, name: "Ada", accessibleSystems: [], isAdmin: false }),
    updateName: vi.fn().mockResolvedValue({ id: user.id, name: "Grace", accessibleSystems: [] }),
    updatePassword: vi.fn().mockResolvedValue(true),
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

  const service = new UserService(
    userRepository,
    passwordHasher,
    tokenService,
    refreshTokenRepository,
    userCache
  );

  return { service, userRepository, passwordHasher, tokenService, refreshTokenRepository, userCache };
}

describe("UserService self-service", () => {
  it("stores a hash and returns the public profile", async () => {
    const admin = { ...user, isAdmin: true };
    const { service, userRepository, passwordHasher } = createService({
      userRepository: { getUserById: vi.fn().mockResolvedValue(admin) }
    });

    const result = await service.createUser(admin.id, { name: "  Ada  ", password: "secret123" });

    expect(passwordHasher.hash).toHaveBeenCalledWith("secret123");
    expect(userRepository.create).toHaveBeenCalledWith({
      name: "Ada",
      password: "hashed-new",
      accessibleSystems: []
    });
    expect(result).toEqual({ id: user.id, name: "Ada", accessibleSystems: [], isAdmin: false });
    expect(result).not.toHaveProperty("password");
  });

  it("returns the authenticated profile without the password", async () => {
    const { service } = createService();

    await expect(service.getCurrentUser(user.id)).resolves.toEqual({
      id: user.id,
      name: user.name,
      accessibleSystems: [],
      isAdmin: false
    });
  });

  it("throws when the authenticated user no longer exists", async () => {
    const { service } = createService({
      userRepository: { getUserById: vi.fn().mockResolvedValue(null) }
    });

    await expect(service.getCurrentUser(user.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("rejects a wrong current password and keeps the hash and sessions", async () => {
    const { service, userRepository, passwordHasher, refreshTokenRepository } = createService({
      passwordHasher: { compare: vi.fn().mockResolvedValue(false) }
    });

    await expect(service.changePassword({
      id: user.id,
      currentPassword: "wrong",
      newPassword: "newsecret1"
    })).rejects.toMatchObject({ statusCode: 401, message: "Contraseña actual incorrecta" });

    expect(passwordHasher.hash).not.toHaveBeenCalled();
    expect(userRepository.updatePassword).not.toHaveBeenCalled();
    expect(refreshTokenRepository.revokeAllByUser).not.toHaveBeenCalled();
  });

  it("replaces the password hash and revokes refresh tokens", async () => {
    const { service, userRepository, refreshTokenRepository } = createService();

    await service.changePassword({
      id: user.id,
      currentPassword: "secret123",
      newPassword: "newsecret1"
    });

    expect(userRepository.updatePassword).toHaveBeenCalledWith(user.id, "hashed-new");
    expect(refreshTokenRepository.revokeAllByUser).toHaveBeenCalledWith(user.id);
  });

  it("propagates a duplicate name as a conflict", async () => {
    const conflict = new AppError("Ya existe un usuario con ese nombre", 409);
    const { service } = createService({
      userRepository: { updateName: vi.fn().mockRejectedValue(conflict) }
    });

    await expect(service.updateUserName({ id: user.id, name: "Ada" })).rejects.toBe(conflict);
  });
});

describe("UserService deleted accounts", () => {
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
