import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";

import { db } from "@/lib/db";
import type { Difficulty } from "@/lib/leetcode";

// A subscription is one Discord channel's webhook plus its settings. The subscriber
// manages it with a random key (in their manage link); only the key's SHA-256 is stored.
// Webhook URLs are AES-256-GCM encrypted with ENCRYPTION_KEY, because the daily job
// must read them without any subscriber present.

export type Settings = { difficulty: Difficulty; tags: string[] };

export type Subscription = Settings & {
  id: string;
  webhookUrl: string;
  lastPostedDay: number | null;
};

const hashKey = (key: string) => createHash("sha256").update(key).digest("hex");

function encryptionKey(): Buffer {
  const value = process.env.ENCRYPTION_KEY;
  const key = value ? Buffer.from(value, "base64") : Buffer.alloc(0);
  if (key.length !== 32) {
    throw new Error("ENCRYPTION_KEY must be 32 bytes, base64-encoded.");
  }
  return key;
}

export function seal(plaintext: string, key = encryptionKey()): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  return [iv, cipher.getAuthTag(), data]
    .map((b) => b.toString("base64url"))
    .join(".");
}

export function unseal(ciphertext: string, key = encryptionKey()): string {
  const [iv, tag, data] = ciphertext
    .split(".")
    .map((p) => Buffer.from(p, "base64url"));
  if (!iv || !tag || !data) throw new Error("Malformed ciphertext.");
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString(
    "utf8",
  );
}

/** Creates a subscription and returns its manage key. */
export async function subscribe(
  webhookUrl: string,
  settings: Settings,
): Promise<string> {
  const key = randomBytes(24).toString("base64url");
  const q = await db();
  await q`insert into subscriptions (key_hash, webhook_ciphertext, difficulty, tags)
    values (${hashKey(key)}, ${seal(webhookUrl)}, ${settings.difficulty}, ${settings.tags})`;
  return key;
}

export async function settingsFor(key: string): Promise<Settings | null> {
  const q = await db();
  const rows = (await q`select difficulty, tags from subscriptions
    where key_hash = ${hashKey(key)}`) as Settings[];
  return rows[0] ?? null;
}

export async function updateSettings(
  key: string,
  settings: Settings,
): Promise<boolean> {
  const q = await db();
  const rows = await q`update subscriptions
    set difficulty = ${settings.difficulty}, tags = ${settings.tags}
    where key_hash = ${hashKey(key)} returning id`;
  return rows.length > 0;
}

export async function unsubscribe(key: string): Promise<boolean> {
  const q = await db();
  const rows =
    await q`delete from subscriptions where key_hash = ${hashKey(key)} returning id`;
  return rows.length > 0;
}

/** Every subscription not yet posted on `day`, for the daily job. */
export async function dueOn(day: number): Promise<Subscription[]> {
  const q = await db();
  const rows =
    (await q`select id, webhook_ciphertext, difficulty, tags, last_posted_day
    from subscriptions
    where last_posted_day is distinct from ${day}`) as {
      id: string;
      webhook_ciphertext: string;
      difficulty: Difficulty;
      tags: string[];
      last_posted_day: number | null;
    }[];
  return rows.map((r) => ({
    id: r.id,
    webhookUrl: unseal(r.webhook_ciphertext),
    difficulty: r.difficulty,
    tags: r.tags,
    lastPostedDay: r.last_posted_day,
  }));
}

export async function markPosted(id: string, day: number) {
  const q = await db();
  await q`update subscriptions set last_posted_day = ${day}, last_error = null
    where id = ${id}`;
}

export async function markFailed(id: string, error: string) {
  const q = await db();
  await q`update subscriptions set last_error = ${error} where id = ${id}`;
}

export async function remove(id: string) {
  const q = await db();
  await q`delete from subscriptions where id = ${id}`;
}
