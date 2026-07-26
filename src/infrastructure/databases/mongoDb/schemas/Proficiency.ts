import mongoose, { Schema } from "mongoose";
import { ProficiencyMongo } from "../../../../domain/types/proficiencies.types";

const proficiencySchema: Schema = new Schema<ProficiencyMongo>({
  name: { type: String, required: true },
  type: { type: String, required: true },
  parentProficiencyId: { type: String, default: null },
  ruleset: { type: String, required: true },
  deletedAt: { type: Date, default: null }
}, { collection: 'proficiencies' });

const ProficiencyModel = mongoose.model<ProficiencyMongo>("proficiencies", proficiencySchema);
export default ProficiencyModel;
