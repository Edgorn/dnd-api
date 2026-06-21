import mongoose, { Schema, ObjectId } from "mongoose";

export interface AttributeMongo {
  _id: ObjectId;
  ruleset: string[];
  name: string;
  description: string;
  key: string;
  abbreviation: string;
  icon?: string;
}

const attributeSchema: Schema = new Schema<AttributeMongo>({
  ruleset: [String],
  name: String,
  description: String,
  key: String,
  abbreviation: String,
  icon: String
}, { collection: 'Attributes' });

const AttributeModel = mongoose.model<AttributeMongo>("Attributes", attributeSchema);
export default AttributeModel;
