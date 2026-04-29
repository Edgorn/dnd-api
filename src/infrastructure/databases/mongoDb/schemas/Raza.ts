import mongoose, { Schema } from "mongoose";
import { RaceMongo, SubraceMongo, TypeMongo, VarianteMongo } from "../../../../domain/types/razas.types";

const varianteSchema = new Schema<VarianteMongo>({
  name: String,
  ability_bonuses: [],
  skill_choices: {},
  ability_bonus_choices: {},
  dotes: Number
});

const tipoSchema = new Schema<TypeMongo>({
  name: String,
  desc: String,
  img: String
});

const subrazaSchema = new Schema<SubraceMongo>({
  index: String,
  name: String,
  img: String,
  ability_bonuses: [],
  traits: [String],
  traits_data: {},
  language_choices: {},
  spell_choices: [],
  types: [tipoSchema],
  desc: String
});

const razaSchema: Schema = new Schema<RaceMongo>({
  index: String,    //ELIMINABLE
  name: String,
  description: [String],
  desc: String,    //ELIMINABLE
  alignment: String,
  img: String,
  ruleset: String,
  speed: Schema.Types.Mixed,
  size: String,
  size_range: {
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
  skill_choices: {},
  languages: [String],
  language_choices: {},
  proficiencies_choices: [],
  levels: [{
    level: Number,
    traits_data: {}
  }],
  subraces: [subrazaSchema],
  variants: [varianteSchema]
}, { collection: 'Razas' });

const RaceModel = mongoose.model<RaceMongo>("Razas", razaSchema);
export default RaceModel;