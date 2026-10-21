import mongoose, { Schema } from "mongoose";
import { PersonajeMongo } from "../../../../domain/types/personajes.types";


const personajeSchema: Schema = new Schema<PersonajeMongo>({
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
  traits_data: {},
  traitChoices: { type: Schema.Types.Mixed, default: undefined },
  skillProficiencyOverlays: { type: [Schema.Types.Mixed], default: undefined },
  extraSpells: { type: Schema.Types.Mixed, default: undefined },
  //resistances: [String],
  speed: {},
  size: String,
  prof_bonus: Number,
  languages: {},
  skills: [String],
  proficiency_weapon: [String],
  proficiency_armor: [String],
  proficiencies: [String],
  spells: {},
  saving_throws: [String],
  classes: [{
    class: String,
    level: Number,
    name: String,
    hit_die: String
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
  HPMax: Number,
  HPActual: Number,
  XP: Number,
  feats: [],
  dotes: [],
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
  activeTraitIds: { type: [String], default: [] }
}, { collection: 'Personajes' });

const PersonajeModel = mongoose.model<PersonajeMongo>("Personajes", personajeSchema);
export default PersonajeModel;