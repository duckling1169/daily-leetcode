import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";

import { seal, unseal } from "@/lib/subscriptions";

describe("seal", () => {
  it("round-trips only with the same key", () => {
    const key = randomBytes(32);
    const url = "https://discord.com/api/webhooks/1/secret";
    const ct = seal(url, key);
    expect(ct).not.toContain("secret");
    expect(unseal(ct, key)).toBe(url);
    expect(() => unseal(ct, randomBytes(32))).toThrow();
  });
});
