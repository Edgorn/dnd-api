import mongoose, { Schema } from "mongoose";
import { RasgoMongo } from "../../../../domain/types/rasgos.types";

const rasgoSchema: Schema = new Schema<RasgoMongo>({
  index: String,
  name: String,
  desc: [String],
  description: [String],
  summary: [String],
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
  }
  /*type: String,
  languages: [String],
  
  proficiencies: [],*/
  /*
  tables?: [{
    title: String,
    data: {
      titles: [String],
      rows: [[String]]
    }
  }]*/
}, { collection: 'Rasgos' });

const RasgoModel = mongoose.model<RasgoMongo>("Rasgos", rasgoSchema);
export default RasgoModel;