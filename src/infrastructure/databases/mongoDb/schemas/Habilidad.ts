import mongoose, { Schema } from "mongoose";
import { HabilidadMongo } from "../../../../domain/types/habilidades.types";

const habilidadSchema: Schema = new Schema<HabilidadMongo>({
  index: String,
  name: String,
  ability_score: String
}, { collection: 'Habilidades' });

const HabilidadModel = mongoose.model<HabilidadMongo>("Habilidades", habilidadSchema);
export default HabilidadModel