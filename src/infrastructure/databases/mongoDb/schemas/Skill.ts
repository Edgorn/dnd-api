import mongoose, { Schema } from "mongoose";
import { SkillMongo } from "../../../../domain/types/skill.types";

const skillSchema: Schema = new Schema<SkillMongo>({
  ruleset: String,
  name: String,
  description: String,
  key: String,
  bonusFormula: String,
  attributeScore: [String],
  deletedAt: { type: Date, default: null }
}, { collection: 'skills' });

const SkillModel = mongoose.model<SkillMongo>("skills", skillSchema);
export default SkillModel;
