import mongoose, { Schema } from "mongoose";
import { CriaturaMongo } from "../../../../domain/types/criaturas.types";

const npcSchema: Schema = new Schema<CriaturaMongo>({
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
  languages: String,
  challenge_rating: String,
  xp: Number,
  damage_vulnerabilities: [],
  damage_immunities: [],
  damage_resistances: [],
  condition_immunities: [],
  special_abilities: [],
  actions: [],
  reactions: [] 
}, { collection: 'NPCs' });

module.exports = mongoose.model('NPCs', npcSchema);

const NpcModel = mongoose.model<CriaturaMongo>("NPCs", npcSchema);
export default NpcModel;

/**
 * import mongoose, { Schema } from "mongoose";
import { CriaturaMongo } from "../../../../domain/types/criaturas.types";

const criaturaSchema: Schema = new Schema<CriaturaMongo>({
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
  languages: String,
  challenge_rating: String,
  xp: Number,
  damage_vulnerabilities: [],
  damage_immunities: [],
  damage_resistances: [],
  condition_immunities: [],
  special_abilities: [],
  actions: [],
  reactions: [] 
}, { collection: 'Criaturas' });

const CriaturaModel = mongoose.model<CriaturaMongo>("Criaturas", criaturaSchema);
export default CriaturaModel;
 */