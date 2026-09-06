import mongoose, { Schema } from "mongoose";
import { CharacterClassMongo } from "../../../../domain/types/characterClass.types";

const characterClassSchema: Schema = new Schema<CharacterClassMongo>({
  ruleset: { type: String, required: true },
  deletedAt: { type: Date, default: null },
  name: { type: String, required: true },
  description: [String],
  hit_die: { type: Number, default: 8 },
  img: { type: String, default: "" },
  proficiencies: { type: [String], default: [] },
  proficiencies_choices: { type: [], default: [] },
  skill_choices: { type: Schema.Types.Mixed, default: {} },
  saving_throws: { type: [String], default: [] },
  equipment: [
    {
      id: String,
      quantity: Number
    }
  ],
  equipment_choices: { type: [], default: [] },
  levels: [{
    level: Number,
    proficiencies: [],
    traits: [String],
    traits_data: {},
    traits_options: {},
    spell_choices: [],
    mixed_spell_choices: {},
    spell_group: {},
    spell_changes: {},
    spellcasting: { type: Schema.Types.Mixed, default: undefined },
    subclasses_options: {},
    subclasses: {},
    double_skills: Number,
    ability_score: Boolean,
    invocations: Number,
    invocations_change: Number,
  }],
  spellcasting: { type: Schema.Types.ObjectId, ref: "attributes", default: null },
  spellSaveDcFormula: { type: String, default: undefined },
  spellAttackBonusFormula: { type: String, default: undefined }
}, { collection: 'character_classes', timestamps: true });

const CharacterClassModel = mongoose.model<CharacterClassMongo>("character_classes", characterClassSchema);
export default CharacterClassModel;
