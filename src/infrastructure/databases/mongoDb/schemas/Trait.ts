import mongoose, { Schema } from "mongoose";
import { TraitMongo } from "../../../../domain/types/traits.types";

const traitSchema: Schema = new Schema<TraitMongo>({
  index: String,
  name: String,
  description: [String],
  summary: [String],
  ruleset: String,
  incompatible_traits: [String],
  hidden: Boolean,
  resistances: [String],
  condition_inmunities: [String],
  conditional_resistances: [String],
  proficiencies: [],
  skills: [],
  speed: { type: Schema.Types.Mixed, default: undefined },
  discard: [String],
  spells: [],
  bonuses: {
    armor_class: Number
  },
  acFormula: String,
  suppressedByArmorTypeIds: { type: [String], default: undefined },
  spellPrivileges: { type: Schema.Types.Mixed, default: undefined },
  companionRoster: { type: Schema.Types.Mixed, default: undefined },
  languages: { type: Schema.Types.Mixed, default: undefined },
  damageChoices: { type: Schema.Types.Mixed, default: undefined },
  damageChoiceRef: { type: Schema.Types.Mixed, default: undefined },
  hitPoints: { type: Schema.Types.Mixed, default: undefined },
  deletedAt: { type: Date, default: null }
}, { collection: 'traits' });

const TraitModel = mongoose.model<TraitMongo>("traits", traitSchema);
export default TraitModel;
