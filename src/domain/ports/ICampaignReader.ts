export type CampaignSummary = {
  id: string;
  name: string;
  master: string;
};

export interface ICampaignReader {
  getById(id: string): Promise<CampaignSummary | null>;
  getNamesByIds(ids: string[]): Promise<Map<string, string>>;
}
