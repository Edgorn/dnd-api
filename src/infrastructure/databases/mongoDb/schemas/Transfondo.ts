import mongoose, { Schema } from "mongoose";
import { TransfondoMongo } from "../../../../domain/types/transfondos";

const transfondoSchema: Schema = new Schema<TransfondoMongo>({
  index: String,
  name: String,
  desc: [String],
  img: String,
  traits: [String],
  starting_proficiencies: [],
  options: [],
  starting_equipment: [],
  starting_equipment_options: [],
  money: {
    quantity: Number,
    unit: String
  },
  god: Boolean,
  personalized_equipment: [String],
  options_name: {
    name: String,
    options: [String],
    choose: Number
  },
  personality_traits: [String],
  ideals: [String],
  bonds: [String],
  flaws: [String],
  traits_options: {},
  variants: [{}]
}, { collection: 'Transfondos' });

const TransfondoModel = mongoose.model<TransfondoMongo>("Transfondo", transfondoSchema);
export default TransfondoModel;
//module.exports = mongoose.model('Transfondos', transfondoSchema);