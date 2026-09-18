import mongoose, { Schema } from "mongoose";
import { EntityOverrideMongo } from "../../../../domain/types/entityOverride.types";

const entityOverrideSchema = new Schema<EntityOverrideMongo>({
  ruleset: { type: String, required: true },
  entityType: { type: String, required: true, enum: ["race"] },
  sourceId: { type: String, required: true },
  patch: { type: Schema.Types.Mixed, default: {} },
  deletedAt: { type: Date, default: null }
}, { collection: "entityOverrides" });

entityOverrideSchema.index(
  { ruleset: 1, entityType: 1, sourceId: 1 },
  { unique: true }
);

const EntityOverrideModel = mongoose.model<EntityOverrideMongo>("entityOverrides", entityOverrideSchema);
export default EntityOverrideModel;
