import mongoose, { Schema } from "mongoose";
import { CampañaMongo } from "../../../../domain/types/campañas.types";

const campañaSchema: Schema = new Schema<CampañaMongo>({
  name: String,
  description: String,
  master: String,
  status: String,
  players_requesting: [String],
  players: [String],
  characters: [String]
}, { collection: 'Campañas' });

const CampañaModel = mongoose.model<CampañaMongo>("Campañas", campañaSchema);
export default CampañaModel;
