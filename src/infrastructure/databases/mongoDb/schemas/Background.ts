import mongoose, { Schema } from "mongoose";
import { BackgroundMongo } from "../../../../domain/types/background.types";

const backgroundSchema: Schema = new Schema<BackgroundMongo>({
  ruleset: { type: String, required: true },
  deletedAt: { type: Date, default: null },
  name: { type: String, required: true },
  description: { type: [String], default: [] },
  img: { type: String, default: "" },
  traits: { type: [String], default: [] },
  traits_options: { type: Schema.Types.Mixed, default: {} },
  skills: { type: [String], default: [] },
  language_choices: { type: Schema.Types.Mixed, default: {} },
  proficiencies: { type: [String], default: [] },
  proficiencies_choices: { type: [], default: [] },
  equipment: { type: [], default: [] },
  equipment_choices: { type: [], default: [] },
  starting_equipment_options: { type: [], default: [] },
  money: {
    quantity: { type: Number, default: 0 },
    unit: { type: String, default: "gp" }
  },
  god: { type: Boolean, default: false },
  personalized_equipment: { type: [String], default: [] },
  options_name: { type: Schema.Types.Mixed, default: {} },
  personality_traits: { type: [String], default: [] },
  ideals: { type: [String], default: [] },
  bonds: { type: [String], default: [] },
  flaws: { type: [String], default: [] },
  variants: { type: [], default: [] }
}, { collection: 'backgrounds', timestamps: true });

const BackgroundModel = mongoose.model<BackgroundMongo>("Background", backgroundSchema);
export default BackgroundModel;
