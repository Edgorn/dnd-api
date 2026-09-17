import mongoose, { Schema } from "mongoose";
import { FeatMongo } from "../../../../domain/types/feat.types";

const featSchema: Schema = new Schema<FeatMongo>({
  name: String,
  description: [String],
  summary: [String],
  ruleset: String,
  requirements: {
    attributeMode: { type: String, enum: ["all", "any"], default: "all" },
    attributes: [{
      key: String,
      min: Number,
      _id: false
    }]
  },
  deletedAt: { type: Date, default: null }
}, { collection: "feats" });

const FeatModel = mongoose.model<FeatMongo>("feats", featSchema);
export default FeatModel;
