import type { Problem } from "@/lib/leetcode";

// Discord incoming webhooks. A webhook URL lets anyone post to its channel, so it's
// treated as a credential: validated here, encrypted at rest (lib/subscriptions.ts).

const WEBHOOK_PATTERN =
  /^https:\/\/(?:canary\.|ptb\.)?discord(?:app)?\.com\/api\/webhooks\/\d+\/[\w-]+$/;

export function isWebhookUrl(url: string): boolean {
  return WEBHOOK_PATTERN.test(url);
}

export function problemEmbed(problem: Problem, footer: string) {
  return {
    title: `#${problem.questionFrontendId} ${problem.title}`,
    url: `https://leetcode.com/problems/${problem.titleSlug}/`,
    color: 0x2e6b4f,
    fields: [
      { name: "Difficulty", value: problem.difficulty, inline: true },
      {
        name: "Topics",
        value: problem.topicTags.map((t) => t.name).join(", ") || "None",
        inline: true,
      },
    ],
    footer: { text: footer },
  };
}

export type PostResult = "ok" | "gone" | "failed";

/** Posts a message. "gone" means Discord deleted the webhook (404 or 401). */
export async function post(
  webhookUrl: string,
  body: Record<string, unknown>,
): Promise<PostResult> {
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) return "ok";
    return res.status === 404 || res.status === 401 ? "gone" : "failed";
  } catch {
    return "failed";
  }
}
