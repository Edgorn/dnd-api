import mongoose, { Schema, ObjectId } from "mongoose";

export interface DamageMongo {
  _id: ObjectId;
  name: string;
  description: string;
  color: string;
  ruleset: string;
  deletedAt?: Date | null;
}

const damageSchema: Schema = new Schema<DamageMongo>({
  ruleset: String,
  name: String,
  description: String,
  color: String,
  deletedAt: { type: Date, default: null }
}, { collection: 'damages' });

damageSchema.index({ name: 1, ruleset: 1 }, { unique: true });

const DamageModel = mongoose.model<DamageMongo>("damages", damageSchema);
export default DamageModel;
