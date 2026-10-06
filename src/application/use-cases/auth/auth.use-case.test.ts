import { describe, it, expect, vi } from "vitest";
import LoginUseCase from "./login.use-case";
import RefreshTokenUseCase from "./refreshToken.use-case";
import LogoutUseCase from "./logout.use-case";
import ValidateTokenUseCase from "./validateToken.use-case";
import AuthService from "../../../domain/services/auth.service";
import { LoginResult } from "../../../domain/types/auth.types";

const loginResult: LoginResult = {
  token: "access-token",
  refreshToken: "refresh-token",
  user: { id: "user-1", name: "Ada" }
};

describe("auth use cases", () => {
  it("delegates login to the auth service", async () => {
    const authService = {
      login: vi.fn().mockResolvedValue(loginResult)
    } as unknown as AuthService;
    const useCase = new LoginUseCase(authService);

    await expect(useCase.execute({ user: "Ada", password: "secret123" })).resolves.toEqual(loginResult);
    expect(authService.login).toHaveBeenCalledWith({ user: "Ada", password: "secret123" });
  });

  it("delegates refresh to the auth service", async () => {
    const authService = {
      refreshToken: vi.fn().mockResolvedValue(loginResult)
    } as unknown as AuthService;
    const useCase = new RefreshTokenUseCase(authService);

    await expect(useCase.execute("old-refresh")).resolves.toEqual(loginResult);
    expect(authService.refreshToken).toHaveBeenCalledWith("old-refresh");
  });

  it("delegates logout to the auth service", async () => {
    const authService = {
      logout: vi.fn().mockResolvedValue(true)
    } as unknown as AuthService;
    const useCase = new LogoutUseCase(authService);

    await expect(useCase.execute("refresh-token")).resolves.toBe(true);
    expect(authService.logout).toHaveBeenCalledWith("refresh-token");
  });

  it("delegates token validation to the auth service", async () => {
    const authService = {
      validateToken: vi.fn().mockResolvedValue("user-1")
    } as unknown as AuthService;
    const useCase = new ValidateTokenUseCase(authService);

    await expect(useCase.execute("access-token")).resolves.toBe("user-1");
    expect(authService.validateToken).toHaveBeenCalledWith("access-token");
  });
});
