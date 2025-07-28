import mongoose, { Schema } from "mongoose";
import { DañoApi } from "../../../../domain/types";

const dañoSchema: Schema = new Schema<DañoApi>({
  index: String,
  name: String,
  desc: String,
}, { collection: 'Daños' });

const DañoModel = mongoose.model<DañoApi>("Daños", dañoSchema);
export default DañoModel;