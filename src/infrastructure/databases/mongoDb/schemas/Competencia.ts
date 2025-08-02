import mongoose, { Schema } from "mongoose";
import { CompetenciaMongo } from "../../../../domain/types/competencias.types";

const competenciaSchema: Schema = new Schema<CompetenciaMongo>({
  index: String,
  name: String,
  type: String,
  desc: [String]
}, { collection: 'Competencias' });

const CompetenciaModel = mongoose.model<CompetenciaMongo>("Competencias", competenciaSchema);
export default CompetenciaModel;