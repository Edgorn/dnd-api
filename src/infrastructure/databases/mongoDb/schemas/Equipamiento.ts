import mongoose, { Schema } from "mongoose";
import { EquipamientoMongo } from "../../../../domain/types/equipamientos.types";

const equipamientoSchema: Schema = new Schema<EquipamientoMongo>({
  index: String,
  name: String,
  category: String,
  description: [String],
  cost: {
    quantity: Number,
    unit: String
  },
  weapon: {},
  armor: {},
  weight: Number,
  content: [{ index: String, quantity: Number }]
}, { collection: 'Equipamientos' });

const EquipamientoModel = mongoose.model<EquipamientoMongo>("Equipamientos", equipamientoSchema);
export default EquipamientoModel;