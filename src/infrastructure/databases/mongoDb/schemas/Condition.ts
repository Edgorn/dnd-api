import mongoose, { Schema } from "mongoose";
import { ConditionMongo } from "../../../../domain/types/condition.types";

const conditionSchema = new Schema<ConditionMongo>({
  name: { type: String, required: true },
  description: { type: String },
  ruleset: { type: String, required: true },
  deletedAt: { type: Date, default: null }
}, { collection: "conditions" });

conditionSchema.index({ ruleset: 1, deletedAt: 1 });

const ConditionModel = mongoose.model<ConditionMongo>("conditions", conditionSchema);
export default ConditionModel;
