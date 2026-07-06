import { z } from "zod";

export const CreateAttributeSchema = z.object({
  ruleset: z.string().min(1, "El sistema no puede estar vacío"),
  name: z.string().min(1, "El nombre no puede estar vacío"),
  description: z.string().min(1, "La descripción no puede estar vacía"),
  key: z.string().min(1, "La clave no puede estar vacía"),
  abbreviation: z.string().min(1, "La abreviatura no puede estar vacía"),
  icon: z.string().optional()
});

export const UpdateAttributeSchema = z.object({
  name: z.string().min(1, "El nombre no puede estar vacío").optional(),
  description: z.string().min(1, "La descripción no puede estar vacía").optional(),
  key: z.string().min(1, "La clave no puede estar vacía").optional(),
  abbreviation: z.string().min(1, "La abreviatura no puede estar vacía").optional(),
  icon: z.string().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: "Debe proporcionar al menos un campo para modificar"
});

export const AddSystemSchema = z.object({
  systemId: z.string().min(1, "El sistema no puede estar vacío")
});
