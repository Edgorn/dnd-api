import mongoose, { Schema } from "mongoose";
import { InvocacionMongo } from "../../../../domain/types/invocaciones.types";

const invocacionSchema: Schema = new Schema<InvocacionMongo>({
  index: String,
  name: String,
  desc: [String],
  spells: [String],
  skills: [String],
  requirements: {}
}, { collection: 'Invocaciones' });

const InvocacionModel = mongoose.model<InvocacionMongo>("Invocaciones", invocacionSchema);
export default InvocacionModel;