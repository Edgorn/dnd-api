import { describe, it, expect, vi } from "vitest";
import UserService from "./user.service";
import IUserRepository from "../repositories/IUserRepository";
import { IPasswordHasher } from "../ports/IPasswordHasher";
import { AppError, NotFoundError } from "../errors/AppError";
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
} = {}) {
  const userRepository = {
    getUserById: vi.fn().mockResolvedValue(user),
    getUserByName: vi.fn().mockResolvedValue(user),
    create: vi.fn().mockResolvedValue({ id: user.id, name: "Ada", accessibleSystems: [], isAdmin: false }),
    updateName: vi.fn().mockResolvedValue({ id: user.id, name: "Grace", accessibleSystems: [] }),
    updatePassword: vi.fn().mockResolvedValue(true),
    updateLoginGuard: vi.fn().mockResolvedValue(undefined),
    ...overrides.userRepository
  } as unknown as IUserRepository;

  const passwordHasher = {
    hash: vi.fn().mockResolvedValue("hashed-new"),
    compare: vi.fn().mockResolvedValue(true),
    dummyHash: "dummy",
    ...overrides.passwordHasher
  } as unknown as IPasswordHasher;

  const service = new UserService(userRepository, passwordHasher);

  return { service, userRepository, passwordHasher };
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

  it("rejects a wrong current password and keeps the hash", async () => {
    const { service, userRepository, passwordHasher } = createService({
      passwordHasher: { compare: vi.fn().mockResolvedValue(false) }
    });

    await expect(service.changePassword({
      id: user.id,
      currentPassword: "wrong",
      newPassword: "newsecret1"
    })).rejects.toMatchObject({ statusCode: 401, message: "Contraseña actual incorrecta" });

    expect(passwordHasher.hash).not.toHaveBeenCalled();
    expect(userRepository.updatePassword).not.toHaveBeenCalled();
  });

  it("replaces the password hash", async () => {
    const { service, userRepository } = createService();

    await service.changePassword({
      id: user.id,
      currentPassword: "secret123",
      newPassword: "newsecret1"
    });

    expect(userRepository.updatePassword).toHaveBeenCalledWith(user.id, "hashed-new");
  });

  it("propagates a duplicate name as a conflict", async () => {
    const conflict = new AppError("Ya existe un usuario con ese nombre", 409);
    const { service } = createService({
      userRepository: { updateName: vi.fn().mockRejectedValue(conflict) }
    });

    await expect(service.updateUserName({ id: user.id, name: "Ada" })).rejects.toBe(conflict);
  });
});
