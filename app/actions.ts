"use server";

import { headers } from "next/headers";

import { isWebhookUrl, post } from "@/lib/discord";
import { DIFFICULTIES, TAGS, type Difficulty } from "@/lib/leetcode";
import {
  subscribe,
  unsubscribe,
  updateSettings,
  type Settings,
} from "@/lib/subscriptions";

export type FormState = {
  error?: string;
  notice?: string;
  manageUrl?: string;
};

function parseSettings(form: FormData): Settings | string {
  const difficulty = String(form.get("difficulty") ?? "");
  if (!DIFFICULTIES.includes(difficulty as Difficulty)) {
    return "Choose a difficulty.";
  }
  const allowed: readonly string[] = TAGS;
  const tags = form
    .getAll("tags")
    .map(String)
    .filter((t) => allowed.includes(t));
  return { difficulty: difficulty as Difficulty, tags };
}

const describe = (s: Settings) =>
  `${s.difficulty.toLowerCase()} problems${s.tags.length ? ` on ${s.tags.join(", ")}` : ""}`;

export async function subscribeAction(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const webhook = String(form.get("webhook") ?? "").trim();
  if (!isWebhookUrl(webhook)) {
    return {
      error:
        "That isn't a Discord webhook URL. Copy it from channel settings → Integrations → Webhooks.",
    };
  }
  const settings = parseSettings(form);
  if (typeof settings === "string") return { error: settings };

  const welcome = await post(webhook, {
    content: `Daily LeetCode is set up here. Expect ${describe(settings)} every day at 13:00 UTC.`,
  });
  if (welcome !== "ok") {
    return {
      error: "Discord didn't accept a test message. Check the webhook URL.",
    };
  }

  try {
    const key = await subscribe(webhook, settings);
    const h = await headers();
    const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
    return { manageUrl: `${origin}/manage?key=${key}` };
  } catch {
    return { error: "Couldn't save that. Try again." };
  }
}

export async function updateAction(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const settings = parseSettings(form);
  if (typeof settings === "string") return { error: settings };
  const ok = await updateSettings(String(form.get("key") ?? ""), settings);
  return ok
    ? { notice: `Saved. You'll get ${describe(settings)}.` }
    : { error: "This manage link no longer works." };
}

export async function unsubscribeAction(
  _prev: FormState,
  form: FormData,
): Promise<FormState> {
  const ok = await unsubscribe(String(form.get("key") ?? ""));
  return ok
    ? { notice: "Posting stopped. You can delete the webhook in Discord too." }
    : { error: "This manage link no longer works." };
}
