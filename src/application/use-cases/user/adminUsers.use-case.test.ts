import { describe, it, expect, vi } from "vitest";
import CreateUserUseCase from "./createUser.use-case";
import ListUsersUseCase from "./listUsers.use-case";
import GetUserProfileUseCase from "./getUserProfile.use-case";
import UpdateUserProfileUseCase from "./updateUserProfile.use-case";
import SoftDeleteUserUseCase from "./softDeleteUser.use-case";
import UserService from "../../../domain/services/user.service";
import IUserRepository from "../../../domain/repositories/IUserRepository";
import { IPasswordHasher } from "../../../domain/ports/IPasswordHasher";
import { ITokenService } from "../../../domain/ports/ITokenService";
import { IRefreshTokenRepository } from "../../../domain/ports/IRefreshTokenRepository";
import { IUserCache } from "../../../domain/ports/IUserCache";
import { AppError, NotFoundError } from "../../../domain/errors/AppError";
import { User, UserProfile } from "../../../domain/types/user.types";

const admin: User = {
  id: "507f1f77bcf86cd799439011",
  name: "Admin",
  password: "hashed",
  accessibleSystems: [],
  isAdmin: true,
  deletedAt: null
};

const otherAdmin: User = {
  ...admin,
  id: "507f1f77bcf86cd799439012",
  name: "Other"
};

const member: User = {
  ...admin,
  id: "507f1f77bcf86cd799439013",
  name: "Ada",
  isAdmin: false,
  accessibleSystems: ["507f1f77bcf86cd799439099"]
};

const deletedMember: User = {
  ...member,
  id: "507f1f77bcf86cd799439014",
  deletedAt: new Date("2026-01-01T00:00:00.000Z")
};

const users = new Map<string, User>([
  [admin.id, admin],
  [otherAdmin.id, otherAdmin],
  [member.id, member],
  [deletedMember.id, deletedMember]
]);

function toProfile(user: User): UserProfile {
  return {
    id: user.id,
    name: user.name,
    accessibleSystems: user.accessibleSystems,
    isAdmin: user.isAdmin
  };
}

function createHarness() {
  const userRepository = {
    getUserById: vi.fn(async (id: string) => users.get(id) ?? null),
    create: vi.fn(async () => toProfile({ ...member, id: "507f1f77bcf86cd799439015", name: "Grace" })),
    listActive: vi.fn(async () => [admin, otherAdmin, member].map(toProfile)),
    updateProfile: vi.fn(async (id: string, data: { name?: string; accessibleSystems?: string[] }) => {
      const current = users.get(id);
      if (!current || current.deletedAt) return null;
      return toProfile({
        ...current,
        name: data.name ?? current.name,
        accessibleSystems: data.accessibleSystems ?? current.accessibleSystems
      });
    }),
    softDelete: vi.fn().mockResolvedValue(true)
  } as unknown as IUserRepository;

  const passwordHasher = {
    hash: vi.fn().mockResolvedValue("hashed-new"),
    compare: vi.fn().mockResolvedValue(true),
    dummyHash: "dummy"
  } as unknown as IPasswordHasher;

  const refreshTokenRepository = {
    revokeAllByUser: vi.fn().mockResolvedValue(undefined)
  } as unknown as IRefreshTokenRepository;

  const userCache = {
    get: vi.fn().mockReturnValue(null),
    set: vi.fn(),
    invalidate: vi.fn()
  } as unknown as IUserCache;

  const userService = new UserService(
    userRepository,
    passwordHasher,
    {} as ITokenService,
    refreshTokenRepository,
    userCache
  );

  return {
    userRepository,
    passwordHasher,
    refreshTokenRepository,
    userCache,
    createUser: new CreateUserUseCase(userService),
    listUsers: new ListUsersUseCase(userService),
    getUserProfile: new GetUserProfileUseCase(userService),
    updateUserProfile: new UpdateUserProfileUseCase(userService),
    softDeleteUser: new SoftDeleteUserUseCase(userService)
  };
}

describe("admin user management", () => {
  it("rejects account creation when the actor is not an admin", async () => {
    const { createUser, userRepository } = createHarness();

    await expect(createUser.execute(member.id, {
      name: "Grace",
      password: "secret123"
    })).rejects.toMatchObject({ statusCode: 403, message: "No tienes permisos de administrador" });

    expect(userRepository.create).not.toHaveBeenCalled();
  });

  it("creates an account without admin privileges", async () => {
    const { createUser, userRepository, passwordHasher } = createHarness();

    const result = await createUser.execute(admin.id, {
      name: "  Grace  ",
      password: "secret123",
      accessibleSystems: member.accessibleSystems
    });

    expect(passwordHasher.hash).toHaveBeenCalledWith("secret123");
    expect(userRepository.create).toHaveBeenCalledWith({
      name: "Grace",
      password: "hashed-new",
      accessibleSystems: member.accessibleSystems
    });
    expect(result.isAdmin).toBe(false);
    expect(result).not.toHaveProperty("password");
  });

  it("lists active profiles for an admin and rejects everyone else", async () => {
    const { listUsers, userRepository } = createHarness();

    await expect(listUsers.execute(admin.id)).resolves.toEqual([admin, otherAdmin, member].map(toProfile));
    await expect(listUsers.execute(member.id)).rejects.toBeInstanceOf(AppError);
    expect(userRepository.listActive).toHaveBeenCalledTimes(1);
  });

  it("returns an active profile and hides deleted accounts", async () => {
    const { getUserProfile } = createHarness();

    await expect(getUserProfile.execute(admin.id, member.id)).resolves.toEqual(toProfile(member));
    await expect(getUserProfile.execute(admin.id, deletedMember.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(getUserProfile.execute(admin.id, "missing")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("updates the name and accessible systems of an active user", async () => {
    const { updateUserProfile, userRepository } = createHarness();

    const updated = await updateUserProfile.execute({
      actorId: admin.id,
      id: member.id,
      name: "  Grace  ",
      accessibleSystems: []
    });

    expect(userRepository.updateProfile).toHaveBeenCalledWith(member.id, {
      name: "Grace",
      accessibleSystems: []
    });
    expect(updated).toMatchObject({ name: "Grace", accessibleSystems: [], isAdmin: false });
  });

  it("propagates a duplicate name as a conflict", async () => {
    const conflict = new AppError("Ya existe un usuario con ese nombre", 409);
    const { updateUserProfile, userRepository } = createHarness();
    vi.mocked(userRepository.updateProfile).mockRejectedValue(conflict);

    await expect(updateUserProfile.execute({
      actorId: admin.id,
      id: member.id,
      name: "Admin"
    })).rejects.toBe(conflict);
  });

  it("refuses to delete the acting admin or another admin", async () => {
    const { softDeleteUser, userRepository, refreshTokenRepository, userCache } = createHarness();

    await expect(softDeleteUser.execute(admin.id, admin.id)).rejects.toMatchObject({
      statusCode: 403,
      message: "No puedes eliminar tu propia cuenta"
    });
    await expect(softDeleteUser.execute(admin.id, otherAdmin.id)).rejects.toMatchObject({
      statusCode: 403,
      message: "No se puede eliminar un administrador"
    });

    expect(userRepository.softDelete).not.toHaveBeenCalled();
    expect(refreshTokenRepository.revokeAllByUser).not.toHaveBeenCalled();
    expect(userCache.invalidate).not.toHaveBeenCalled();
  });

  it("soft-deletes a regular account and ends its session", async () => {
    const { softDeleteUser, userRepository, refreshTokenRepository, userCache } = createHarness();

    await softDeleteUser.execute(admin.id, member.id);

    expect(userRepository.softDelete).toHaveBeenCalledWith(member.id);
    expect(refreshTokenRepository.revokeAllByUser).toHaveBeenCalledWith(member.id);
    expect(userCache.invalidate).toHaveBeenCalledWith(member.id);
  });
});
