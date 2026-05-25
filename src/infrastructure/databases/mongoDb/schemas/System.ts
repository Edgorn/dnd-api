import mongoose, { Schema } from "mongoose";
import { System } from "../../../../domain/types/system.types";

const system: Schema = new Schema<System>({
  name: String,
  description: String,
  publisher: String,
  isOpen: Boolean
}, { collection: 'Sistemas' });

const SistemasModel = mongoose.model<System>("Sistemas", system);
export default SistemasModel