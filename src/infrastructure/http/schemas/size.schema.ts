import { z } from "zod";
import { CREATURE_SIZES, normalizeSize } from "../../../domain/types/size.types";

export const SizeSchema = z.preprocess(normalizeSize, z.enum(CREATURE_SIZES));

export const OptionalSizeSchema = z.preprocess(
  (value) => {
    if (value === undefined || value === null || value === "") return undefined;
    return normalizeSize(value);
  },
  z.enum(CREATURE_SIZES).optional()
);
