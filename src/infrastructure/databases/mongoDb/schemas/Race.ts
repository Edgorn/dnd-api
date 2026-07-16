import mongoose, { Schema } from "mongoose";
import { RaceMongo, VarianteMongo } from "../../../../domain/types/race.types";

const varianteSchema = new Schema<VarianteMongo>({
  name: String,
  ability_bonuses: [],
  skill_choices: {},
  ability_bonus_choices: {},
  dotes: Number
});

const raceSchema: Schema = new Schema<RaceMongo>({
  name: String,
  description: [String],
  alignment: String,
  img: String,
  ruleset: String,
  speed: Schema.Types.Mixed,
  size: String,
  size_range: {
    min: Number,
    max: Number
  },
  weight_range: {
    min: Number,
    max: Number
  },
  age: {
    maturity: Number,
    expectancy: Number
  },
  ability_bonuses: [],
  ability_bonus_choices: {},
  traits: [String],
  traits_data: {},
  skill_choices: {},
  languages: {},
  language_choices: {},
  proficiencies_choices: [],
  levels: [{
    level: Number,
    traits_data: {}
  }],
  subraces_name: String,
  parentId: { type: Schema.Types.ObjectId, ref: 'races', default: null },
  variants: [varianteSchema],
  spell_choices: [],
  deletedAt: { type: Date, default: null }
}, { collection: 'races' });

const RaceModel = mongoose.model<RaceMongo>("races", raceSchema);
export default RaceModel;
