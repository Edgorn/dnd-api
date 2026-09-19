import mongoose, { Schema, Document } from "mongoose";
import { ArmorDuration } from "../../../../domain/types/armorType.types";

export interface ArmorTypeMongo extends Document {
  _id: mongoose.Types.ObjectId;
  ruleset: string;
  name: string;
  description: string;
  don: ArmorDuration;
  doff: ArmorDuration;
  deletedAt?: Date | null;
}

const ArmorDurationSchema = new Schema<ArmorDuration>(
  {
    value: { type: Number, required: true },
    unit: { type: String, required: true }
  },
  { _id: false }
);

const armorTypeSchema = new Schema<ArmorTypeMongo>({
  ruleset: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  don: { type: ArmorDurationSchema, required: true },
  doff: { type: ArmorDurationSchema, required: true },
  deletedAt: { type: Date, default: null }
}, {
  collection: "armorTypes",
  timestamps: true
});

armorTypeSchema.index({ ruleset: 1, name: 1 });
armorTypeSchema.index({ ruleset: 1, deletedAt: 1 });

const ArmorTypeModel = mongoose.model<ArmorTypeMongo>("ArmorType", armorTypeSchema);
export default ArmorTypeModel;
