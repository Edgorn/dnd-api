import mongoose, { Schema } from "mongoose";
import { DoteMongo } from "../../../../domain/types/dotes.types";

const doteSchema: Schema = new Schema<DoteMongo>({
  name: String,
  desc: [String],
}, { collection: 'Dotes' });

const DoteModel = mongoose.model<DoteMongo>("Dotes", doteSchema);
export default DoteModel;