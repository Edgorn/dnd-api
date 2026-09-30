import mongoose, { Schema } from "mongoose";
import { CreatureMongo } from "../../../../domain/types/creature.types";

const creatureSchema = new Schema<CreatureMongo>({
  name: { type: String, required: true },
  ruleset: { type: String, required: true },
  img: String,
  description: { type: [String], default: [] },
  creatureTypeId: { type: String, required: true },
  race: String,
  size: { type: String, required: true },
  alignment: { type: String, required: true },
  armor_class: Schema.Types.Mixed,
  HPMax: { type: Number, required: true },
  hit_dice: String,
  speed: { type: Schema.Types.Mixed, required: true },
  attributes: { type: Schema.Types.Mixed, default: [] },
  saving_throws: { type: [String], default: [] },
  skill_bonuses: { type: Schema.Types.Mixed, default: [] },
  senses: Schema.Types.Mixed,
  languages: { type: Schema.Types.Mixed, default: () => ({ speaks: [], understands: [] }) },
  language_choices: Schema.Types.Mixed,
  challenge_rating: { type: Number, required: true },
  xp: { type: Number, required: true },
  prof_bonus: { type: Number, required: true },
  damage_vulnerabilities: { type: [String], default: [] },
  damage_immunities: { type: [String], default: [] },
  damage_resistances: { type: [String], default: [] },
  condition_immunities: { type: [String], default: [] },
  traits: { type: Schema.Types.Mixed, default: [] },
  spellcasting: { type: Schema.Types.Mixed, default: null },
  innateSpellcasting: { type: Schema.Types.Mixed, default: null },
  actions: { type: Schema.Types.Mixed, default: [] },
  bonus_actions: { type: Schema.Types.Mixed, default: [] },
  reactions: { type: Schema.Types.Mixed, default: [] },
  legendary_actions: Schema.Types.Mixed,
  equipment: { type: Schema.Types.Mixed, default: [] },
  deletedAt: { type: Date, default: null }
}, { collection: "creatures" });

creatureSchema.index({ ruleset: 1, deletedAt: 1 });
creatureSchema.index({ creatureTypeId: 1, deletedAt: 1 });

const CreatureModel = mongoose.model<CreatureMongo>("Creature", creatureSchema);
export default CreatureModel;
