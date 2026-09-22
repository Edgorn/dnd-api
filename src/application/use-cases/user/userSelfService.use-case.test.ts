import { describe, it, expect, vi } from "vitest";
import CreateUserUseCase from "./createUser.use-case";
import GetCurrentUserUseCase from "./getCurrentUser.use-case";
import UpdateUserNameUseCase from "./updateUserName.use-case";
import ChangePasswordUseCase from "./changePassword.use-case";
import UserService from "../../../domain/services/user.service";
import { UserProfile } from "../../../domain/types/user.types";

const profile: UserProfile = {
  id: "507f1f77bcf86cd799439011",
  name: "Ada",
  accessibleSystems: ["507f1f77bcf86cd799439099"],
  isAdmin: false
};

describe("CreateUserUseCase", () => {
  it("delegates account creation to the user service", async () => {
    const userService = {
      createUser: vi.fn().mockResolvedValue(profile)
    } as unknown as UserService;
    const useCase = new CreateUserUseCase(userService);
    const input = { name: "Ada", password: "secret123", accessibleSystems: profile.accessibleSystems };

    await expect(useCase.execute(profile.id, input)).resolves.toEqual(profile);
    expect(userService.createUser).toHaveBeenCalledWith(profile.id, input);
  });
});

describe("GetCurrentUserUseCase", () => {
  it("delegates the profile lookup to the user service", async () => {
    const userService = {
      getCurrentUser: vi.fn().mockResolvedValue(profile)
    } as unknown as UserService;
    const useCase = new GetCurrentUserUseCase(userService);

    await expect(useCase.execute(profile.id)).resolves.toEqual(profile);
    expect(userService.getCurrentUser).toHaveBeenCalledWith(profile.id);
  });
});

describe("UpdateUserNameUseCase", () => {
  it("delegates the rename to the user service", async () => {
    const renamed = { ...profile, name: "Grace" };
    const userService = {
      updateUserName: vi.fn().mockResolvedValue(renamed)
    } as unknown as UserService;
    const useCase = new UpdateUserNameUseCase(userService);
    const input = { id: profile.id, name: "Grace" };

    await expect(useCase.execute(input)).resolves.toEqual(renamed);
    expect(userService.updateUserName).toHaveBeenCalledWith(input);
  });
});

describe("ChangePasswordUseCase", () => {
  it("delegates the password change to the user service", async () => {
    const userService = {
      changePassword: vi.fn().mockResolvedValue(undefined)
    } as unknown as UserService;
    const useCase = new ChangePasswordUseCase(userService);
    const input = { id: profile.id, currentPassword: "secret123", newPassword: "newsecret1" };

    await expect(useCase.execute(input)).resolves.toBeUndefined();
    expect(userService.changePassword).toHaveBeenCalledWith(input);
  });
});
