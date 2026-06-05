import mongoose, { Schema } from "mongoose";
import { CaracteristicaMongo } from "../../../../domain/types/caracteristica.types";

const caracteristicaSchema: Schema = new Schema<CaracteristicaMongo>({
  ruleset: [String],
  name: String,
  description: String,
  key: String,
  abbreviation: String
}, { collection: 'Caracteristicas' });

const CaracteristicaModel = mongoose.model<CaracteristicaMongo>("Caracteristicas", caracteristicaSchema);
export default CaracteristicaModel;
