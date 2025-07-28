import mongoose, { Schema } from "mongoose";
import { ConjuroMongo } from "../../../../domain/types";

const conjuroSchema: Schema = new Schema<ConjuroMongo>({
  index: String,
  name: String,
  level: Number,
  classes: [String],
  school: String,
  casting_time: String,
  range: String,
  components: [String],
  duration: String,
  desc: [String],
  ritual: Boolean
}, { collection: 'Conjuros' });

const ConjuroModel = mongoose.model<ConjuroMongo>("Conjuros", conjuroSchema);
export default ConjuroModel;