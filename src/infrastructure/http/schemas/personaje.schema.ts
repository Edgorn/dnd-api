import { z } from "zod";

export const ToggleFavoriteEquipmentSchema = z.object({
  id: z.string().min(1, "ID de personaje requerido"),
  equip: z.string().min(1, "ID de equipamiento requerido"),
  isMagic: z.boolean(),
  isBond: z.boolean(),
  isFavorite: z.boolean(),
});
