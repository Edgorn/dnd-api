import { z } from "zod";

const userNameSchema = z.string().trim().min(1, "El nombre es requerido");

const newPasswordSchema = z.string().min(8, "La contraseña debe tener al menos 8 caracteres");

export const createUserSchema = z.object({
  name: userNameSchema,
  password: newPasswordSchema,
  accessibleSystems: z.array(z.string().min(1, "El identificador de sistema no puede estar vacío")).default([])
});

export const updateUserNameSchema = z.object({
  name: userNameSchema
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "La contraseña actual es requerida"),
  newPassword: newPasswordSchema
});

export const updateUserProfileSchema = z.object({
  name: userNameSchema.optional(),
  accessibleSystems: z.array(z.string().min(1, "El identificador de sistema no puede estar vacío")).optional()
}).refine(data => data.name !== undefined || data.accessibleSystems !== undefined, {
  message: "Debe proporcionar al menos un campo para modificar"
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserNameInput = z.infer<typeof updateUserNameSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;
