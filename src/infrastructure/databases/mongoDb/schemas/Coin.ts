import mongoose, { Schema } from "mongoose";
import { CoinMongo } from "../../../../domain/types/coin.types";

const coinSchema: Schema = new Schema<CoinMongo>({
  ruleset: { type: String, required: true },
  name: { type: String, required: true },
  abbreviation: { type: String, required: true },
  isBase: { type: Boolean, default: false },
  multiplier: { type: Number, required: true },
  weight: { type: Number, required: true },
  color: { type: String, default: '#000000' },
  deletedAt: { type: Date, default: null }
}, { collection: 'coins', timestamps: true });

coinSchema.index({ name: 1, ruleset: 1 });
coinSchema.index({ abbreviation: 1, ruleset: 1 });

const CoinModel = mongoose.model<CoinMongo>("Coin", coinSchema);
export default CoinModel;
