import mongoose, { Schema } from "mongoose";
import { ClaseMongo, SubclasesOptionsMongo } from "../../../../domain/types/clases.types";

const claseSchema: Schema = new Schema<ClaseMongo>({
  index: String,
  name: String,
  desc: String,
  hit_die: Number,
  img: String,
  proficiencies: [],
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
    /*spellcasting: {},*/
    subclasses_options: {},
    subclasses: {},/*
    terrain_options: {},
    enemy_options: {},
    */
    ability_score: Boolean,
    /*invocations: Number,
    invocations_change: Number,
    metamagic_new: Number*/
  }],/*
  money: {},
  spellcasting: String*/
}, { collection: 'Clases' });

const ClaseModel = mongoose.model<ClaseMongo>("Clases", claseSchema);
export default ClaseModel;