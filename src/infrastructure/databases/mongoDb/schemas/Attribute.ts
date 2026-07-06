import mongoose, { Schema, ObjectId } from "mongoose";
import { AttributeMongo } from "../../../../domain/types/attribute.types";

const attributeSchema: Schema = new Schema<AttributeMongo>({
  ruleset: [String],
  name: String,
  description: String,
  key: String,
  abbreviation: String,
  icon: String
}, { collection: 'attributes' });

attributeSchema.index({ key: 1, ruleset: 1 }, { unique: true });

const AttributeModel = mongoose.model<AttributeMongo>("attributes", attributeSchema);
export default AttributeModel;
