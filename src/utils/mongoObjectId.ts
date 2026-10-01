const MONGO_OBJECT_ID = /^[0-9a-fA-F]{24}$/;

export function isMongoObjectId(value: string): boolean {
  return MONGO_OBJECT_ID.test(value);
}
