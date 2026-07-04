export interface IUserCache {
  get(userId: string): boolean | null;
  set(userId: string, exists: boolean): void;
  invalidate(userId: string): void;
}
