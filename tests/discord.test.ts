import { describe, expect, it } from "vitest";

import { isWebhookUrl, problemEmbed } from "@/lib/discord";

describe("isWebhookUrl", () => {
  it("accepts Discord webhook URLs only", () => {
    expect(isWebhookUrl("https://discord.com/api/webhooks/123/abc-DEF_9")).toBe(
      true,
    );
    expect(isWebhookUrl("https://ptb.discord.com/api/webhooks/123/abc")).toBe(
      true,
    );
    expect(isWebhookUrl("http://discord.com/api/webhooks/123/abc")).toBe(false);
    expect(
      isWebhookUrl("https://discord.com.evil.io/api/webhooks/123/abc"),
    ).toBe(false);
    expect(isWebhookUrl("https://example.com/api/webhooks/123/abc")).toBe(
      false,
    );
  });
});

describe("problemEmbed", () => {
  it("links the problem and lists its topics", () => {
    const e = problemEmbed(
      {
        questionFrontendId: "1",
        title: "Two Sum",
        titleSlug: "two-sum",
        difficulty: "Easy",
        topicTags: [{ name: "Array" }, { name: "Hash Table" }],
      },
      "Daily LeetCode",
    );
    expect(e.title).toBe("#1 Two Sum");
    expect(e.url).toBe("https://leetcode.com/problems/two-sum/");
    expect(e.fields[1]?.value).toBe("Array, Hash Table");
  });
});
