import mongoose, { Schema } from "mongoose";
import { PersonajeMongo } from "../../../../domain/types/personajes.types";


const personajeSchema: Schema = new Schema<PersonajeMongo>({
  name: String,
  user: String,
  img: String,
  background: {},
  appearance: {},
  attributes: [{
    _id: false,
    key: String,
    value: Number
  }],
  systems: [String],
  raceId: String,
  subraceId: String,
  type: String,
  campaign: String,
  race: String,
  traits: [String],
  invocations: [String],
  //disciplines: [String],
  //metamagic: [String],
  traits_data: {},
  //resistances: [String],
  speed: {},
  plusSpeed: Number,
  size: String,
  prof_bonus: Number,
  languages: {},
  skills: [String],
  double_skills: [String],
  proficiency_weapon: [String],
  proficiency_armor: [String],
  proficiencies: [String],
  spells: {},
  saving_throws: [String],
  classes: [{
    class: String,
    level: Number,
    name: String,
    hit_die: String
  }],
  subclasses: [String],
  equipment: [{}],
  money: {},
  HPMax: Number,
  HPActual: Number,
  XP: Number,
  dotes: [],
  forms: [String]
}, { collection: 'Personajes' });

const PersonajeModel = mongoose.model<PersonajeMongo>("Personajes", personajeSchema);
export default PersonajeModel;