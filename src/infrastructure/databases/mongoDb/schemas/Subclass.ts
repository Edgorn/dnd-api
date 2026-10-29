import mongoose, { Schema } from "mongoose";
import { SubclassMongo } from "../../../../domain/types/subclass.types";

const subclassSchema: Schema = new Schema<SubclassMongo>({
  ruleset: { type: String, required: true },
  classId: { type: String, required: true },
  name: { type: String, required: true },
  description: { type: [String], default: [] },
  img: { type: String, default: "" },
  proficiencies: { type: [String], default: [] },
  proficiencies_choices: { type: [], default: [] },
  levels: [{
    level: { type: Number, required: true },
    traits: { type: [String], default: [] },
    traits_data: { type: Schema.Types.Mixed, default: {} },
    skill_choices: { type: Schema.Types.Mixed, default: undefined },
    skillProficiencyChoices: { type: Schema.Types.Mixed, default: undefined },
    spell_choices: { type: Schema.Types.Mixed, default: undefined },
    optionChoices: { type: Schema.Types.Mixed, default: undefined }
  }],
  expandedSpells: { type: [String], default: undefined },
  alwaysPreparedSpells: { type: Schema.Types.Mixed, default: undefined },
  optionReplacements: { type: Schema.Types.Mixed, default: undefined },
  deletedAt: { type: Date, default: null }
}, { collection: "subclasses", timestamps: true });

subclassSchema.index({ classId: 1, ruleset: 1, deletedAt: 1 });

const SubclassModel = mongoose.model<SubclassMongo>("subclasses", subclassSchema);
export default SubclassModel;
