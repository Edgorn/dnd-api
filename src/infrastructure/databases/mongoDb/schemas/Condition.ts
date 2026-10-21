import mongoose, { Schema } from "mongoose";
import { ConditionMongo } from "../../../../domain/types/condition.types";

const conditionLevelSchema = new Schema({
  level: { type: Number, required: true },
  description: { type: String, required: true }
}, { _id: false });

const conditionRecoverySchema = new Schema({
  restKey: { type: String, required: true },
  delta: { type: Number, required: true }
}, { _id: false });

const conditionSchema = new Schema<ConditionMongo>({
  name: { type: String, required: true },
  description: { type: String },
  ruleset: { type: String, required: true },
  levels: { type: [conditionLevelSchema] },
  cumulative: { type: Boolean },
  recovery: { type: [conditionRecoverySchema] },
  deletedAt: { type: Date, default: null }
}, { collection: "conditions" });

conditionSchema.index({ ruleset: 1, deletedAt: 1 });

const ConditionModel = mongoose.model<ConditionMongo>("conditions", conditionSchema);
export default ConditionModel;
