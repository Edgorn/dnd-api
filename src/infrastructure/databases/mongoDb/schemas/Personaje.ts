import mongoose, { Schema } from "mongoose";
import { TransfondoMongo } from "../../../../domain/types/transfondos.types";
import { PersonajeMongo } from "../../../../domain/types/personajes.types";


const personajeSchema: Schema = new Schema<PersonajeMongo>({
  name: String,
  user: String,
  img: String,
  background: {},
  appearance: {},
  abilities: {},
  raceId: String,
  subraceId: String,
  type: String,
  campaign: String,
  race: String,
  traits: [String],
  //invocations: [String],
  //disciplines: [String],
  //metamagic: [String],
  traits_data: {},
  //resistances: [String],
  speed: Number,
  plusSpeed: Number,
  size: String,
  prof_bonus: Number,
  languages: [String],
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
  //CA: Number,
  HPMax: Number,
  HPActual: Number,
  XP: Number,
  dotes: []
}, { collection: 'Personajes' });

const PersonajeModel = mongoose.model<PersonajeMongo>("Personajes", personajeSchema);
export default PersonajeModel;