import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const CampaignIdParamsSchema = z.object({
  id: z
    .string()
    .min(1, "ID de campaña requerido")
    .regex(objectIdRegex, "El ID debe ser un ObjectId válido de MongoDB"),
});

export type CampaignIdParams = z.infer<typeof CampaignIdParamsSchema>;
