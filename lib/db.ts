import { neon } from "@neondatabase/serverless";

// Neon Postgres over HTTP. The schema is applied on first use, so a fresh deployment
// needs no migration step.

const SCHEMA = [
  `create table if not exists subscriptions (
    id                  uuid primary key default gen_random_uuid(),
    key_hash            text not null unique,
    webhook_ciphertext  text not null,
    difficulty          text not null,
    tags                text[] not null default '{}',
    created_at          timestamptz not null default now(),
    last_posted_day     integer,
    last_error          text
  )`,
];

let ready: Promise<void> | undefined;

export function sql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set.");
  return neon(url);
}

/** The query function, after making sure the schema exists. */
export async function db() {
  const q = sql();
  ready ??= (async () => {
    for (const statement of SCHEMA) await q.query(statement);
  })().catch((error) => {
    ready = undefined;
    throw error;
  });
  await ready;
  return q;
}
