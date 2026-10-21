import mongoose, { Schema } from "mongoose";
import { OptionGroupMongo } from "../../../../domain/types/optionGroup.types";

const optionGroupSchema: Schema = new Schema<OptionGroupMongo>({
  ruleset: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: [String], default: [] },
  deletedAt: { type: Date, default: null }
}, { collection: "option_groups", timestamps: true });

const OptionGroupModel = mongoose.model<OptionGroupMongo>("option_groups", optionGroupSchema);
export default OptionGroupModel;
