import { describe, expect, it } from "vitest";

import { dayNumber, eligible, pick, type Question } from "@/lib/leetcode";

const q = (
  titleSlug: string,
  isPaidOnly = false,
  tags: string[] = [],
): Question => ({
  titleSlug,
  isPaidOnly,
  topicTags: tags.map((slug) => ({ slug })),
});

describe("eligible", () => {
  it("keeps free problems matching any tag, or all when no tags", () => {
    expect(eligible(q("a", false, ["array"]), ["array", "graph"])).toBe(true);
    expect(eligible(q("a", false, ["math"]), ["array"])).toBe(false);
    expect(eligible(q("a", false, ["math"]), [])).toBe(true);
    expect(eligible(q("a", true), [])).toBe(false);
  });
});

describe("pick", () => {
  const pool = Array.from({ length: 30 }, (_, i) => `p${i}`);

  it("visits every problem once per cycle", () => {
    const picks = pool.map((_, d) => pick(pool, 20_000 + d));
    expect(new Set(picks).size).toBe(pool.length);
  });

  it("doesn't depend on the order LeetCode returns problems in", () => {
    expect(pick(pool, 20_123)).toBe(pick([...pool].reverse(), 20_123));
  });

  it("counts days in UTC", () => {
    expect(dayNumber(new Date("2026-10-02T23:59:00Z"))).toBe(
      dayNumber(new Date("2026-10-02T00:00:00Z")),
    );
  });
});
