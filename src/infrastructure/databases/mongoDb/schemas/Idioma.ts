import mongoose, { Schema } from "mongoose";
import { IdiomaMongo } from "../../../../domain/types/idiomas.types";

const idiomaSchema: Schema = new Schema<IdiomaMongo>({
  index: String,
  name: String,
  type: String,
  typical_speakers: [String],
  script: String
}, { collection: 'Idiomas' });

const IdiomaModel = mongoose.model<IdiomaMongo>("Idiomas", idiomaSchema);
export default IdiomaModel
