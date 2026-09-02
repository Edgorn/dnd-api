import mongoose, { Schema, Document } from "mongoose";

export interface PropertyMongo extends Document {
  _id: mongoose.Types.ObjectId;
  ruleset: string;
  name: string;
  description: string;
  attackAttributes?: string[];
  deletedAt?: Date | null;
}

const propertySchema = new Schema<PropertyMongo>({
  ruleset: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  attackAttributes: { type: [String], default: undefined },
  deletedAt: { type: Date, default: null }
}, { 
  collection: 'properties',
  timestamps: true 
});

propertySchema.index({ ruleset: 1, name: 1 });

const PropertyModel = mongoose.model<PropertyMongo>("Property", propertySchema);
export default PropertyModel;
