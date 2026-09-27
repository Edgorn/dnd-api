import mongoose, { Schema } from "mongoose";
import { LegacyCreatureMongo } from "../../../../domain/types/npc.types";

const npcSchema: Schema = new Schema<LegacyCreatureMongo>({
  index: String,
  name: String,
  type: String,
  subtype: String,
  alignment: String,
  size: String,
  armor_class: {},
  hit_points: Number,
  hit_dice: String,
  speed: {},
  abilities: {},
  saving: String,
  skills: String,
  senses: {},
  languages: {},
  challenge_rating: String,
  xp: Number,
  damage_vulnerabilities: [],
  damage_immunities: [],
  damage_resistances: [],
  condition_immunities: [],
  special_abilities: [],
  actions: [],
  actions_aditional: [],
  actions_legendary: [],
  reactions: [],
  spell_slots: {}
}, { collection: 'NPCs' });

const NpcModel = mongoose.model<LegacyCreatureMongo>("NPCs", npcSchema);
export default NpcModel;
