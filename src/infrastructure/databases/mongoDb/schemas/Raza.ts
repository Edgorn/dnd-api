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
  index: String,
  name: String,
  desc: String,
  img: String,
  speed: Number,
  size: String,
  ability_bonuses: [],
  ability_bonus_choices: {},
  traits: [String],
  skill_choices: {},
  languages: [String],
  language_choices: {},
  proficiencies_choices: [],
  subraces: [subrazaSchema],
  variants: [varianteSchema]
}, { collection: 'Razas' });

const RaceModel = mongoose.model<RaceMongo>("Razas", razaSchema);
export default RaceModel;