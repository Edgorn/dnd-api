import mongoose, { Schema } from "mongoose";
import { GroupOptionMongo } from "../../../../domain/types/optionGroup.types";

const groupOptionSchema: Schema = new Schema<GroupOptionMongo>({
  ruleset: { type: String, required: true },
  groupId: { type: String, required: true },
  traitId: { type: String, required: true },
  prerequisites: { type: Schema.Types.Mixed, default: undefined },
  repeatable: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null }
}, { collection: "group_options", timestamps: true });

groupOptionSchema.index({ groupId: 1, ruleset: 1, deletedAt: 1 });

const GroupOptionModel = mongoose.model<GroupOptionMongo>("group_options", groupOptionSchema);
export default GroupOptionModel;
