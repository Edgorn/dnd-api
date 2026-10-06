import { describe, it, expect } from "vitest";
import { loginSchema, logoutSchema, refreshTokenSchema } from "./auth.schema";

describe("auth schemas", () => {
  it("keeps login passwords of any existing length", () => {
    expect(loginSchema.safeParse({ user: "Ada", password: "x" }).success).toBe(true);
  });

  it("rejects extra fields on login, refresh and logout", () => {
    const login = loginSchema.safeParse({ user: "Ada", password: "x", extra: true });
    expect(login.success).toBe(false);
    if (!login.success) {
      expect(login.error.issues.some((issue) => issue.message === "No se permiten campos adicionales")).toBe(true);
    }

    expect(refreshTokenSchema.safeParse({ refreshToken: "token", extra: true }).success).toBe(false);
    expect(logoutSchema.safeParse({ refreshToken: "token", extra: true }).success).toBe(false);
  });

  it("requires a refresh token for refresh and logout", () => {
    expect(refreshTokenSchema.safeParse({}).success).toBe(false);
    expect(logoutSchema.safeParse({}).success).toBe(false);
    expect(refreshTokenSchema.safeParse({ refreshToken: "token" }).success).toBe(true);
    expect(logoutSchema.safeParse({ refreshToken: "token" }).success).toBe(true);
  });
});
