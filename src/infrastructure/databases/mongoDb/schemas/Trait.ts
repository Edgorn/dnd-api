import mongoose, { Schema } from "mongoose";
import { TraitMongo } from "../../../../domain/types/traits.types";

const traitSchema: Schema = new Schema<TraitMongo>({
  index: String,
  name: String,
  description: [String],
  summary: [String],
  ruleset: String,
  incompatible_traits: [String],

  desc: [String],
  hidden: Boolean,
  resistances: [String],
  condition_inmunities: [String],
  conditional_resistances: [String],
  proficiencies_weapon: [],
  proficiencies_armor: [],
  proficiencies: [],
  skills: [],
  speed: Number,
  discard: [String],
  spells: [],
  bonuses: {
    armor_class: Number
  },
  deletedAt: { type: Date, default: null }
}, { collection: 'traits' });

const TraitModel = mongoose.model<TraitMongo>("traits", traitSchema);
export default TraitModel;
