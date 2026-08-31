import mongoose, { Schema } from "mongoose";
import { System } from "../../../../domain/types/system.types";

const system: Schema = new Schema<System>({
  name: String,
  description: String,
  publisher: String,
  isOpen: Boolean,
  isBase: { type: Boolean, default: false },
  parentId: { type: Schema.Types.ObjectId, ref: 'systems' },
  globalModifierFormula: String,
  initiativeBonusFormula: String,
  defaultMinAttributeValue: Number,
  defaultMaxAttributeValue: Number,
  creationMinAttributeValue: Number,
  creationMaxAttributeValue: Number,
  maxLevel: Number,
  maxSpellLevel: Number,
  xpProgression: [Number],
  proficiencyProgression: [Number],
  hpInitialFormula: String,
  hpLevelUpFormula: String,
  baseAcFormula: String,
  passiveSkillFormula: String,
  carryingCapacityFormula: String,
  deletedAt: { type: Date, default: null }
}, { collection: 'systems' });

const SistemasModel = mongoose.model<System>("systems", system);
export default SistemasModel