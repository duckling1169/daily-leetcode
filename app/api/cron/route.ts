import { timingSafeEqual } from "node:crypto";

import { post, problemEmbed } from "@/lib/discord";
import { dayNumber, problemFor, type Problem } from "@/lib/leetcode";
import { dueOn, markFailed, markPosted, remove } from "@/lib/subscriptions";

// Daily job (vercel.json cron). Groups subscriptions by settings so each group costs one
// LeetCode lookup, posts to every webhook, and drops webhooks Discord has deleted.
// Re-running on the same day only retries channels that haven't been posted yet.

export const maxDuration = 300;

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  return (
    !!secret &&
    header.length === expected.length &&
    timingSafeEqual(Buffer.from(header), Buffer.from(expected))
  );
}

export async function GET(req: Request): Promise<Response> {
  if (!authorized(req)) return new Response("Unauthorized", { status: 401 });

  const day = dayNumber(new Date());
  const due = await dueOn(day);
  const problems = new Map<string, Promise<Problem>>();
  const counts = { posted: 0, removed: 0, failed: 0 };

  for (const sub of due) {
    const group = `${sub.difficulty}:${[...sub.tags].sort().join(",")}`;
    if (!problems.has(group)) {
      problems.set(
        group,
        problemFor(sub.difficulty, sub.tags).then((r) => r.problem),
      );
    }
    try {
      const problem = await problems.get(group)!;
      const result = await post(sub.webhookUrl, {
        embeds: [problemEmbed(problem, "Daily LeetCode")],
      });
      if (result === "ok") {
        await markPosted(sub.id, day);
        counts.posted++;
      } else if (result === "gone") {
        await remove(sub.id);
        counts.removed++;
      } else {
        await markFailed(sub.id, "Discord rejected the post.");
        counts.failed++;
      }
    } catch (error) {
      await markFailed(
        sub.id,
        error instanceof Error ? error.message : "Unknown error.",
      );
      counts.failed++;
    }
  }

  return Response.json({ day, due: due.length, ...counts });
}
