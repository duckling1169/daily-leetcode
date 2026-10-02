# Daily LeetCode

[![CI](https://github.com/duckling1169/daily-leetcode/actions/workflows/ci.yml/badge.svg)](https://github.com/duckling1169/daily-leetcode/actions/workflows/ci.yml)

One LeetCode problem a day, posted to your Discord channel. Paste a channel webhook, pick
a difficulty and topics, and a problem arrives every day at 13:00 UTC. No bot, no account.

## How it works

- **Setup** (`/setup`) checks the webhook by posting a welcome message, then saves it with
  your settings and gives you a private manage link (`/manage?key=…`) to change topics or
  stop posting. Only a hash of that key is stored.
- **The daily job** (`/api/cron`, run by Vercel Cron) posts to every channel. The pick is
  stateless: the pool of free problems for a difficulty and topic set is ordered by a hash
  of each slug, and day `d` posts `order[d mod n]`. Every problem comes up once per cycle,
  and channels with the same settings share one LeetCode lookup. If Discord reports a
  webhook as deleted, that channel is removed.
- Webhook URLs can post to their channel, so they're stored AES-256-GCM encrypted.

## Self-host

1. Deploy to Vercel and add a Neon Postgres database from the Vercel Marketplace (sets
   `DATABASE_URL`). The table is created on first use.
2. Set the variables in `.env.example`.

## Develop

```bash
pnpm install --frozen-lockfile
pnpm dev
pnpm verify   # format, typecheck, test
```

Code: `lib/leetcode.ts` (LeetCode client and daily pick), `lib/discord.ts` (webhooks),
`lib/subscriptions.ts` (storage), `app/api/cron/route.ts` (daily job).

## License

[MIT](LICENSE)
