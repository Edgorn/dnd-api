import mongoose, { Schema } from "mongoose";
import { LanguageMongo } from "../../../../domain/types/language.types";

const languageSchema: Schema = new Schema<LanguageMongo>({
  index: String,
  name: String,
  type: String,
  description: String,
  script: String,
  ruleset: String,
  deletedAt: { type: Date, default: null }
}, { collection: 'languages' });

const LanguageModel = mongoose.model<LanguageMongo>("Languages", languageSchema);
export default LanguageModel;
