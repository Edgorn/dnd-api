import { describe, it, expect } from "vitest";
import { canAccessCharacter } from "./characterAccess";

describe("canAccessCharacter", () => {
  it("allows the character owner", () => {
    expect(
      canAccessCharacter({
        ownerId: "user-1",
        campaignMasterId: "master-1",
        userId: "user-1",
      })
    ).toBe(true);
  });

  it("allows the campaign master", () => {
    expect(
      canAccessCharacter({
        ownerId: "user-1",
        campaignMasterId: "master-1",
        userId: "master-1",
      })
    ).toBe(true);
  });

  it("denies unrelated users", () => {
    expect(
      canAccessCharacter({
        ownerId: "user-1",
        campaignMasterId: "master-1",
        userId: "other-user",
      })
    ).toBe(false);
  });

  it("denies when there is no campaign master and user is not owner", () => {
    expect(
      canAccessCharacter({
        ownerId: "user-1",
        campaignMasterId: null,
        userId: "other-user",
      })
    ).toBe(false);
  });

  it("denies when owner and master are missing", () => {
    expect(
      canAccessCharacter({
        ownerId: null,
        campaignMasterId: undefined,
        userId: "user-1",
      })
    ).toBe(false);
  });
});
