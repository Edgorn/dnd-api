import mongoose, { Schema } from "mongoose";
import { SpellMongo } from "../../../../domain/types/spell.types";

const creatureFormPoolSchema = new Schema({
  mode: { type: String, enum: ["ids", "filter"], required: true },
  creatureIds: [String],
  creatureTypeIds: [String],
  maxCR: Number,
  sizes: [String],
  tags: [String]
}, { _id: false });

const creatureFormSchema = new Schema({
  purpose: { type: String, enum: ["companion", "self", "target"], required: true },
  choose: { type: Number, default: 1 },
  replaceOnRecast: { type: Boolean, default: true },
  pool: { type: creatureFormPoolSchema, required: true }
}, { _id: false });

const damageComponentSchemaDef = {
  diceCount: Number,
  diceType: String,
  bonus: { type: Number, default: 0 },
  type: { type: Schema.Types.ObjectId, ref: 'damages' },
  choice: String
};

const spellSchema: Schema = new Schema<SpellMongo>({
  ruleset: { type: String, required: true },
  name: { type: String, required: true },
  type: String,
  level: { type: Number, required: true },
  classes: [{ type: String, ref: 'character_classes' }],
  typeName: String,
  school: { type: Schema.Types.ObjectId, ref: 'magic_schools' },
  castingTimes: [{
    value: Number,
    unit: String,
    condition: String
  }],
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
  creatureForm: { type: creatureFormSchema, default: undefined },
  damage: {
    choices: [{
      key: String,
      choose: Number,
      options: [{ type: Schema.Types.ObjectId, ref: "damages" }]
    }],
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
  tables: [{
    _id: false,
    title: String,
    headers: [String],
    rows: [[String]]
  }],
  ritual: { type: Boolean, default: false },
  deletedAt: { type: Date, default: null }
}, { collection: 'spells', timestamps: true });

spellSchema.index({ name: 1, ruleset: 1 }, { unique: true });

const SpellModel = mongoose.model<SpellMongo>("spells", spellSchema);
export default SpellModel;
