import mongoose, { Schema } from "mongoose";
import { CompetenciaApi, DañoApi } from "../../../../domain/types";

const competenciaSchema: Schema = new Schema<CompetenciaApi>({
  index: String,
  name: String,
  type: String,
  desc: [String]
}, { collection: 'Competencias' });

const CompetenciaModel = mongoose.model<CompetenciaApi>("Competencias", competenciaSchema);
export default CompetenciaModel;