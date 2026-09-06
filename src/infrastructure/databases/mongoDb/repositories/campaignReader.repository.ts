import { CampaignSummary, ICampaignReader } from "../../../../domain/ports/ICampaignReader";
import Campaña from "../schemas/Campaña";

export default class CampaignReaderRepository implements ICampaignReader {
  async getById(id: string): Promise<CampaignSummary | null> {
    if (!id) {
      return null;
    }

    const campaign = await Campaña.findById(id).lean();
    if (!campaign) {
      return null;
    }

    return {
      id: campaign._id.toString(),
      name: campaign.name ?? "",
      master: campaign.master ?? "",
    };
  }

  async getNamesByIds(ids: string[]): Promise<Map<string, string>> {
    const uniqueIds = [...new Set(ids.filter(Boolean))];
    const namesById = new Map<string, string>();

    if (uniqueIds.length === 0) {
      return namesById;
    }

    const campaigns = await Campaña.find()
      .where("_id")
      .in(uniqueIds)
      .select({ name: 1 })
      .lean();

    for (const campaign of campaigns) {
      namesById.set(campaign._id.toString(), campaign.name ?? "");
    }

    return namesById;
  }
}
