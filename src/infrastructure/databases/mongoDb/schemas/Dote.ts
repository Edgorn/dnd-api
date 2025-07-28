import mongoose, { Schema } from "mongoose";
import { DoteMongo } from "../../../../domain/types";

const datoSchema: Schema = new Schema<DoteMongo>({
  name: String,
  desc: [String],
}, { collection: 'Dotes' });

const DoteModel = mongoose.model<DoteMongo>("Dotes", datoSchema);
export default DoteModel;