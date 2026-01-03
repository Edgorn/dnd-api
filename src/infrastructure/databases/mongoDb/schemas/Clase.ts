import mongoose, { Schema } from "mongoose";
import { ClaseMongo } from "../../../../domain/types/clases.types";

const claseSchema: Schema = new Schema<ClaseMongo>({
  index: String,
  name: String,
  desc: String,
  hit_die: Number,
  img: String,
  proficiencies: [],
  proficiencies_choices: [],
  skill_choices: {},
  saving_throws: [String],
  equipment: [
    {
      index: String,
      quantity: Number
    }
  ],
  equipment_choices: [],
  levels: [{
    level: Number,
    proficiencies: [],
    traits: [String],
    traits_data: {},
    traits_options: {},
    spell_choices: [],
    mixed_spell_choices: {},
    spell_changes: {},
    spellcasting: {},
    subclasses_options: {},
    subclasses: {},
    double_skills: Number,/*
    terrain_options: {},
    enemy_options: {},
    */
    ability_score: Boolean,
    invocations: Number,
    invocations_change: Number,/*
    metamagic_new: Number*/
  }],/*
  money: {},*/
  spellcasting: String
}, { collection: 'Clases' });

const ClaseModel = mongoose.model<ClaseMongo>("Clases", claseSchema);
export default ClaseModel;