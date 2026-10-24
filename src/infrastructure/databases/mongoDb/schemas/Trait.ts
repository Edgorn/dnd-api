import mongoose, { Schema } from "mongoose";
import { TraitMongo } from "../../../../domain/types/traits.types";

const traitSchema: Schema = new Schema<TraitMongo>({
  name: String,
  description: [String],
  summary: [String],
  ruleset: String,
  incompatible_traits: [String],
  hidden: Boolean,
  resistances: [String],
  condition_inmunities: [String],
  conditional_resistances: [String],
  conditionalConditionImmunities: [String],
  proficiencies: [],
  skills: [],
  speed: { type: Schema.Types.Mixed, default: undefined },
  discard: [String],
  spells: [],
  bonuses: {
    armor_class: Number
  },
  acFormula: String,
  suppressedByArmorTypeIds: { type: [String], default: undefined },
  ignoresArmorSpeedPenaltyForTypeIds: { type: [String], default: undefined },
  equipmentRestriction: { type: Schema.Types.Mixed, default: undefined },
  spellPrivileges: { type: Schema.Types.Mixed, default: undefined },
  companionRoster: { type: Schema.Types.Mixed, default: undefined },
  languages: { type: Schema.Types.Mixed, default: undefined },
  damageChoices: { type: Schema.Types.Mixed, default: undefined },
  catalogChoices: { type: Schema.Types.Mixed, default: undefined },
  damageChoiceRef: { type: Schema.Types.Mixed, default: undefined },
  hitPoints: { type: Schema.Types.Mixed, default: undefined },
  action: { type: Schema.Types.Mixed, default: undefined },
  weaponDamageBonus: { type: Schema.Types.Mixed, default: undefined },
  weaponBond: { type: Schema.Types.Mixed, default: undefined },
  uniqueEquipmentGrant: { type: Schema.Types.Mixed, default: undefined },
  spellRepository: { type: Schema.Types.Mixed, default: undefined },
  innateSpells: { type: Schema.Types.Mixed, default: undefined },
  grantedSpells: {
    type: [{
      _id: false,
      spellId: { type: String, required: true },
      ritualOnly: { type: Boolean, default: false }
    }],
    default: undefined
  },
  creatureFormExtensions: { type: Schema.Types.Mixed, default: undefined },
  abilityScores: { type: Schema.Types.Mixed, default: undefined },
  skillProficiencies: { type: Schema.Types.Mixed, default: undefined },
  stackGroup: { type: Schema.Types.Mixed, default: undefined },
  conditionalResistanceGroup: { type: String, default: undefined },
  deletedAt: { type: Date, default: null }
}, { collection: 'traits' });

const TraitModel = mongoose.model<TraitMongo>("traits", traitSchema);
export default TraitModel;
