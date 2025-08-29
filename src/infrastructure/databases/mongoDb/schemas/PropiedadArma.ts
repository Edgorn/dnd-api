import mongoose, { Schema } from "mongoose";
import { PropiedadesArma } from "../../../../domain/types";

const propiedadArmaSchema: Schema = new Schema<PropiedadesArma>({
  index: String,
  name: String,
  desc: [String]
}, { collection: 'PropiedadesArmas' });

const PropiedadesArmasModel = mongoose.model<PropiedadesArma>("PropiedadesArmas", propiedadArmaSchema);
export default PropiedadesArmasModel