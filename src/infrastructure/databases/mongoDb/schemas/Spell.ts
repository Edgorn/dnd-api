import mongoose, { Schema } from "mongoose";
import { SpellMongo } from "../../../../domain/types/spell.types";

const damageComponentSchemaDef = {
  diceCount: Number,
  diceType: String,
  type: { type: Schema.Types.ObjectId, ref: 'damages' }
};

const spellSchema: Schema = new Schema<SpellMongo>({
  ruleset: { type: String, required: true },
  name: { type: String, required: true },
  type: String,
  level: { type: Number, required: true },
  classes: [{ type: String, ref: 'character_classes' }],
  typeName: String,
  school: { type: Schema.Types.ObjectId, ref: 'magic_schools' },
  castingTime: {
    value: Number,
    unit: String,
    condition: String
  },
  range: {
    type: { type: String },
    value: Number,
    unit: String,
    area: {
      shape: String,
      value: Number,
      unit: String
    }
  },
  components: {
    verbal: Boolean,
    somatic: Boolean,
    material: Boolean,
    materialsDescription: String
  },
  duration: {
    type: { type: String },
    value: Number,
    unit: String,
    concentration: Boolean
  },
  damage: {
    base: [damageComponentSchemaDef],
    scaling: {
      mode: { type: String, enum: ["per_slot_level", "character_level"] },
      steps: [{
        level: Number,
        type: { type: String, enum: ["add", "override"] },
        components: [damageComponentSchemaDef]
      }]
    }
  },
  description: [String],
  ritual: Boolean,
  deletedAt: { type: Date, default: null }
}, { collection: 'spells', timestamps: true });

spellSchema.index({ name: 1, ruleset: 1 }, { unique: true });

const SpellModel = mongoose.model<SpellMongo>("spells", spellSchema);
export default SpellModel;
