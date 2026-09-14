import mongoose, { Schema } from "mongoose";
import { CampaignMongo } from "../../../../domain/types/campaign.types";

const campaignSchema: Schema = new Schema<CampaignMongo>({
  name: String,
  description: String,
  master: String,
  status: String,
  players_requesting: [String],
  players: [String],
  characters: [String],
  system: String,
  initialLevel: Number,
  maxPlayers: Number,
  language: String,
  locations: [String],
  initialMapId: String,
  deletedAt: { type: Date, default: null }
}, { collection: 'campaigns' });

const CampaignModel = mongoose.model<CampaignMongo>("campaigns", campaignSchema);
export default CampaignModel;
