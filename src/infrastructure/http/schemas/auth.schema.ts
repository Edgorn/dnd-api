import { z } from "zod";

const extraFields = { error: "No se permiten campos adicionales" } as const;

export const loginSchema = z.strictObject({
  user: z.string().min(1, "El nombre de usuario es requerido"),
  password: z.string().min(1, "La contraseña es requerida")
}, extraFields);

export const refreshTokenSchema = z.strictObject({
  refreshToken: z.string().min(1, "Refresh token no proporcionado")
}, extraFields);

export const logoutSchema = z.strictObject({
  refreshToken: z.string().min(1, "Refresh token no proporcionado")
}, extraFields);

export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
