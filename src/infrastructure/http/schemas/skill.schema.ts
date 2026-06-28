import { z } from "zod";

export const CreateSkillSchema = z.object({
  ruleset: z.string().min(1, "El sistema no puede estar vacío"),
  name: z.string().min(1, "El nombre no puede estar vacío"),
  description: z.string().min(1, "La descripción no puede estar vacía"),
  key: z.string().min(1, "La clave no puede estar vacía"),
  bonusFormula: z.string().min(1, "La fórmula de bono no puede estar vacía"),
  attributeScore: z.array(z.string()).min(1, "Debe tener al menos un atributo asociado")
});

export const UpdateSkillSchema = z.object({
  name: z.string().optional(),
  description: z.string().optional(),
  key: z.string().optional(),
  bonusFormula: z.string().optional(),
  attributeScore: z.array(z.string()).optional()
}).refine(data => Object.keys(data).length > 0, {
  message: "Debe proporcionar al menos un campo para modificar"
});

export const AddSystemSchema = z.object({
  systemId: z.string().min(1, "El sistema no puede estar vacío")
});
