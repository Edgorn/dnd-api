import { z } from "zod";

const hexColorRegex = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/;

export const CreateMagicSchoolSchema = z.object({
  ruleset: z.string().min(1, "El sistema no puede estar vacío"),
  name: z.string().min(1, "El nombre no puede estar vacío"),
  description: z.string().min(1, "La descripción no puede estar vacía"),
  color: z.string().regex(hexColorRegex, "El color debe ser un código hexadecimal válido (ej. #FF0000 o #FFF)")
});

export const UpdateMagicSchoolSchema = z.object({
  name: z.string().min(1, "El nombre no puede estar vacío").optional(),
  description: z.string().min(1, "La descripción no puede estar vacía").optional(),
  color: z.string().regex(hexColorRegex, "El color debe ser un código hexadecimal válido (ej. #FF0000 o #FFF)").optional()
}).refine(data => Object.keys(data).length > 0, {
  message: "Debe proporcionar al menos un campo para modificar"
});
