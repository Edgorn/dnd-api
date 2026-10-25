import mongoose, { Schema } from "mongoose";
import { CharacterMongo } from "../../../../domain/types/character.types";


const characterSchema: Schema = new Schema<CharacterMongo>({
  name: String,
  user: String,
  img: String,
  background: {},
  appearance: {},
  attributes: [{
    _id: false,
    key: String,
    value: Number
  }],
  systems: [String],
  raceId: String,
  campaign: String,
  race: String,
  traits: [String],
  optionSelections: { type: [Schema.Types.Mixed], default: undefined },
  traitsData: {},
  traitChoices: { type: Schema.Types.Mixed, default: undefined },
  skillProficiencyOverlays: { type: [Schema.Types.Mixed], default: undefined },
  extraSpells: { type: Schema.Types.Mixed, default: undefined },
  //resistances: [String],
  speed: {},
  size: String,
  proficiencyBonus: Number,
  languages: {},
  skills: [String],
  weaponProficiencies: [String],
  armorProficiencies: [String],
  proficiencies: [String],
  spells: {},
  savingThrows: [String],
  classes: [{
    class: String,
    level: Number,
    name: String,
    hitDie: Number
  }],
  subclasses: [String],
  equipment: {
    type: [{
      _id: false,
      instanceId: { type: String, required: true },
      equipmentId: { type: String, required: true },
      quantity: { type: Number, required: true, min: 1 },
      equipped: { type: Boolean, required: true, default: false },
      isMagic: { type: Boolean, required: true, default: false },
      isBond: { type: Boolean, required: true, default: false },
      bondOrigin: { type: String, enum: ["summoned", "bound"], default: undefined },
      bondStored: { type: Boolean, default: undefined },
      uniqueGranted: { type: Boolean, default: undefined },
      isFavorite: { type: Boolean, required: true, default: false },
      customization: { type: Schema.Types.Mixed, default: undefined }
    }],
    default: []
  },
  money: {
    type: [{
      _id: false,
      quantity: { type: Number, required: true },
      unit: { type: String, required: true }
    }],
    default: []
  },
  ac: Number,
  hpMax: Number,
  hpCurrent: Number,
  xp: Number,
  forms: {
    type: [{
      _id: false,
      id: { type: String, required: true },
      creatureId: { type: String, required: true },
      spellId: String,
      purpose: { type: String, enum: ["companion", "self", "target"] }
    }],
    default: []
  },
  activeFormId: { type: String, default: null },
  preparedSpells: { type: Schema.Types.Mixed, default: {} },
  spellPrivileges: { type: [Schema.Types.Mixed], default: [] },
  companions: {
    type: [{
      _id: false,
      id: { type: String, required: true },
      name: { type: String, required: true },
      role: String,
      notes: String,
      sourceTraitId: String
    }],
    default: []
  },
  traitResources: {
    type: [{
      _id: false,
      traitId: { type: String, required: true },
      spent: { type: Number, required: true, min: 0 }
    }],
    default: []
  },
  activeTraitIds: { type: [String], default: [] },
  hitDiceSpent: {
    type: [{
      _id: false,
      classId: { type: String, required: true },
      spent: { type: Number, required: true, min: 0 }
    }],
    default: []
  },
  spellSlotsSpent: {
    type: [{
      _id: false,
      classId: { type: String },
      pool: { type: String, enum: ["standard", "fixedLevel"], required: true },
      level: { type: Number, required: true, min: 1, max: 9 },
      spent: { type: Number, required: true, min: 0 }
    }],
    default: []
  },
  activeConditions: {
    type: [{
      _id: false,
      conditionId: { type: String, required: true },
      level: { type: Number, min: 1 }
    }],
    default: []
  }
}, { collection: 'characters' });

characterSchema.index({ user: 1 });

const CharacterModel = mongoose.model<CharacterMongo>("characters", characterSchema);
export default CharacterModel;