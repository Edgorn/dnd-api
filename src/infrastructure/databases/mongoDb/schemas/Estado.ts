import mongoose, { Schema } from "mongoose";
import { EstadoMongo } from "../../../../domain/types/estados.types";

const estadoSchema: Schema = new Schema<EstadoMongo>({
  index: String,
  name: String
}, { collection: 'Estados' });

const EstadoModel = mongoose.model<EstadoMongo>("Estados", estadoSchema);
export default EstadoModel;