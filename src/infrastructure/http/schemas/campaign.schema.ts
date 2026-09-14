import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

const objectIdSchema = (requiredMessage: string) =>
  z
    .string()
    .min(1, requiredMessage)
    .regex(objectIdRegex, "El ID debe ser un ObjectId válido de MongoDB");

export const CampaignIdParamsSchema = z.object({
  id: objectIdSchema("ID de campaña requerido"),
});

export const CampaignJoinParamsSchema = z.object({
  id: objectIdSchema("ID de campaña requerido"),
  userId: objectIdSchema("ID de usuario requerido"),
});

export const CreateCampaignSchema = z
  .object({
    name: z.string().min(1, "El nombre es requerido"),
    description: z.string(),
    system: objectIdSchema("ID de sistema requerido"),
    initialLevel: z.number().int().min(1, "El nivel inicial debe ser al menos 1"),
    maxPlayers: z.number().int().min(1, "El máximo de jugadores debe ser al menos 1"),
    language: z.string().min(1, "El idioma es requerido"),
  })
  .strip();

export type CampaignIdParams = z.infer<typeof CampaignIdParamsSchema>;
export type CampaignJoinParams = z.infer<typeof CampaignJoinParamsSchema>;
export type CreateCampaignBody = z.infer<typeof CreateCampaignSchema>;
