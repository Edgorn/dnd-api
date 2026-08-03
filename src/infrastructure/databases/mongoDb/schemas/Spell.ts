import mongoose, { Schema } from "mongoose";
import { SpellMongo } from "../../../../domain/types/spell.types";

const spellSchema: Schema = new Schema<SpellMongo>({
  ruleset: { type: String, required: true },
  name: { type: String, required: true },
  type: String,
  level: { type: Number, required: true },
  classes: [String],
  typeName: String,
  school: { type: Schema.Types.ObjectId, ref: 'magic_schools' },
  castingTime: {
    value: Number,
    unit: String,
    condition: String
  },
  range: {
    type: { type: String },
    value: Number,
    unit: String,
    area: {
      shape: String,
      value: Number,
      unit: String
    }
  },
  components: {
    verbal: Boolean,
    somatic: Boolean,
    material: Boolean,
    materialsDescription: String
  },
  duration: {
    type: { type: String },
    value: Number,
    unit: String,
    concentration: Boolean
  },
  description: [String],
  ritual: Boolean,
  deletedAt: { type: Date, default: null }
}, { collection: 'spells', timestamps: true });

const SpellModel = mongoose.model<SpellMongo>("spells", spellSchema);
export default SpellModel;
