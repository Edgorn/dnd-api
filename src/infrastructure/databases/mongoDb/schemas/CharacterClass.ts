import mongoose, { Schema } from "mongoose";
import { CharacterClassMongo } from "../../../../domain/types/characterClass.types";

const characterClassSchema: Schema = new Schema<CharacterClassMongo>({
  index: String,
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
      index: String,
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
    spellcasting: {},
    subclasses_options: {},
    subclasses: {},
    double_skills: Number,
    ability_score: Boolean,
    invocations: Number,
    invocations_change: Number,
  }],
  spellcasting: String
}, { collection: 'character_classes', timestamps: true });

const CharacterClassModel = mongoose.model<CharacterClassMongo>("character_classes", characterClassSchema);
export default CharacterClassModel;
