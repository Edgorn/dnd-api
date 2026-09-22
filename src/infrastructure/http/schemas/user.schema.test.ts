import { describe, it, expect } from "vitest";
import { loginSchema } from "./login.schema";
import { changePasswordSchema, createUserSchema, updateUserNameSchema, updateUserProfileSchema } from "./user.schema";

describe("user schemas", () => {
  it("requires at least 8 characters for a new password and defaults accessible systems", () => {
    const tooShort = createUserSchema.safeParse({ name: "Ada", password: "short" });
    expect(tooShort.success).toBe(false);

    const created = createUserSchema.safeParse({ name: "  Ada  ", password: "secret123" });
    expect(created.success).toBe(true);
    if (created.success) {
      expect(created.data).toEqual({
        name: "Ada",
        password: "secret123",
        accessibleSystems: []
      });
    }
  });

  it("keeps login passwords of any existing length", () => {
    expect(loginSchema.safeParse({ user: "Ada", password: "x" }).success).toBe(true);
  });

  it("requires a name when renaming", () => {
    expect(updateUserNameSchema.safeParse({}).success).toBe(false);
    expect(updateUserNameSchema.safeParse({ name: "Grace" }).success).toBe(true);
  });

  it("requires the current password and a new password of 8 characters", () => {
    expect(changePasswordSchema.safeParse({
      currentPassword: "",
      newPassword: "short"
    }).success).toBe(false);

    expect(changePasswordSchema.safeParse({
      currentPassword: "secret123",
      newPassword: "newsecret1"
    }).success).toBe(true);
  });

  it("requires a name or accessible systems when an admin edits a profile", () => {
    expect(updateUserProfileSchema.safeParse({}).success).toBe(false);
    expect(updateUserProfileSchema.safeParse({ name: "Grace" }).success).toBe(true);
    expect(updateUserProfileSchema.safeParse({ accessibleSystems: [] }).success).toBe(true);
  });
});
