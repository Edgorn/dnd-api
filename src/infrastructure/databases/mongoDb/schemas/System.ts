import mongoose, { Schema } from "mongoose";
import { System } from "../../../../domain/types/system.types";

const system: Schema = new Schema<System>({
  name: String,
  description: String,
  publisher: String,
  isOpen: Boolean,
  globalModifierFormula: String,
  defaultMinAttributeValue: Number,
  defaultMaxAttributeValue: Number,
  creationMinAttributeValue: Number,
  creationMaxAttributeValue: Number
}, { collection: 'Sistemas' });

const SistemasModel = mongoose.model<System>("Sistemas", system);
export default SistemasModel