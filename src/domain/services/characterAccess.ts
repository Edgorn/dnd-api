/**
 * Determines whether a user may access a character as owner or campaign master.
 */
export function canAccessCharacter(params: {
  ownerId: string | null | undefined;
  campaignMasterId: string | null | undefined;
  userId: string;
}): boolean {
  const { ownerId, campaignMasterId, userId } = params;

  if (ownerId === userId) {
    return true;
  }

  if (campaignMasterId && campaignMasterId === userId) {
    return true;
  }

  return false;
}
