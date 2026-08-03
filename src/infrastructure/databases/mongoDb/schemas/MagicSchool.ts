import mongoose, { Schema } from "mongoose";
import { MagicSchoolMongo } from "../../../../domain/types/magicSchool.types";

const magicSchoolSchema: Schema = new Schema<MagicSchoolMongo>({
  ruleset: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  color: { type: String, required: true },
  deletedAt: { type: Date, default: null }
}, { collection: 'magic_schools' });

magicSchoolSchema.index({ name: 1, ruleset: 1 }, { unique: true });

const MagicSchoolModel = mongoose.model<MagicSchoolMongo>("magic_schools", magicSchoolSchema);
export default MagicSchoolModel;
