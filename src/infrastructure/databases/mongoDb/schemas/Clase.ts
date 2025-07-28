import mongoose, { Schema } from "mongoose";
import { ClaseMongo, SubclasesOptionsMongo } from "../../../../domain/types/clases";

const claseSchema: Schema = new Schema<ClaseMongo>({
  index: String,
  name: String,
  desc: String,
  hit_die: Number,
  img: String,
  starting_proficiencies: [],
  saving_throws: [String],
  options: [],
  starting_equipment: [
    {
      index: String,
      quantity: Number
    }
  ],
  starting_equipment_options: [],
  levels: [{
    level: Number,
    traits: [String],
    traits_data: {},
    traits_options: {},
    prof_bonus: Number,
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