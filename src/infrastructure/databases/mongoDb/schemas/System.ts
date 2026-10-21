import mongoose, { Schema } from "mongoose";
import { System } from "../../../../domain/types/system.types";

const system: Schema = new Schema<System>({
  name: String,
  description: String,
  publisher: String,
  isOpen: Boolean,
  isBase: { type: Boolean, default: false },
  kind: { type: String, enum: ["ruleset", "setting", "campaign"], default: "ruleset" },
  parentIds: [{ type: Schema.Types.ObjectId, ref: "systems" }],
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
  abilityScoreProgression: { type: [Number], default: undefined },
  hpInitialFormula: String,
  hpLevelUpFormula: String,
  baseAcFormula: String,
  passiveSkillFormula: String,
  carryingCapacityFormula: String,
  attackBonusFormula: String,
  damageBonusFormula: String,
  meleeAttackAttributes: [String],
  rangedAttackAttributes: [String],
  restRules: {
    type: {
      kinds: [{
        key: String,
        name: String,
        duration: {
          value: Number,
          unit: { type: String, enum: ["minute", "hour"] },
        },
        includes: [String],
        _id: false,
      }],
      endStancesOn: [String],
      hitPointRecovery: [{
        restKey: String,
        hp: { type: String, enum: ["none", "full"] },
        hitDice: { type: String, enum: ["none", "all", "half"] },
        _id: false,
      }],
      spellSlotRecovery: [{
        restKey: String,
        pools: [{ type: String, enum: ["standard", "uniform"] }],
        _id: false,
      }],
    },
    default: undefined,
  },
  deletedAt: { type: Date, default: null }
}, { collection: "systems" });

system.index({ parentIds: 1 });

const SistemasModel = mongoose.model<System>("systems", system);
export default SistemasModel
