import mongoose, { Schema } from "mongoose";
import { CreatureTypeMongo } from "../../../../domain/types/creatureType.types";

const creatureTypeSchema = new Schema<CreatureTypeMongo>({
  name: { type: String, required: true },
  description: { type: String },
  ruleset: { type: String, required: true },
  deletedAt: { type: Date, default: null }
}, { collection: "creatureTypes" });

creatureTypeSchema.index({ ruleset: 1, deletedAt: 1 });

const CreatureTypeModel = mongoose.model<CreatureTypeMongo>("CreatureType", creatureTypeSchema);
export default CreatureTypeModel;
