# Daily LeetCode → Discord

[![Daily LeetCode](https://github.com/duckling1169/daily-leetcode/actions/workflows/daily.yml/badge.svg)](https://github.com/duckling1169/daily-leetcode/actions/workflows/daily.yml)

Posts one random LeetCode Easy problem to a Discord channel every day. No bot user, no database — just a Python script, a webhook, and GitHub Actions cron.

## How it works

1. GitHub Actions cron fires daily at 14:00 UTC.
2. Script fetches all Easy problem slugs from LeetCode's public GraphQL endpoint.
3. Filters out Premium-locked problems and anything in `seen.json`.
4. Picks a random unseen slug, fetches its details, posts an embed via the Discord webhook.
5. Appends the slug to `seen.json` and commits it back to the repo.

When all easy problems have been posted (~870 problems, ~2.4 years), `seen.json` resets and the cycle repeats.

## Setup

1. Fork or clone this repo and push to GitHub.
2. Create a Discord webhook on the target channel (channel settings → Integrations → Webhooks → New Webhook → Copy URL). Requires *Manage Webhooks* on the channel.
3. In the GitHub repo: **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `DISCORD_WEBHOOK_URL`
   - Value: the webhook URL from step 2
4. Trigger the workflow once manually (**Actions** tab → *Daily LeetCode* → *Run workflow*) to verify before relying on the cron.

## Files

- `daily_leetcode.py` — the script
- `.github/workflows/daily.yml` — cron + commit-back
- `seen.json` — generated on first run; tracks posted slugs. Committed to the repo as auditable, free dedup state.

## Tuning

| What | Where |
|---|---|
| Cron time (UTC) | `.github/workflows/daily.yml`, `cron:` line |
| Difficulty filter | `daily_leetcode.py`, `fetch_easy_slugs()` → `filters` dict |
| Embed color, footer, fields | `daily_leetcode.py`, `post_to_discord()` |
| Reset behavior on pool exhaustion | `daily_leetcode.py`, `main()` |

To add Mediums later: drop the `"difficulty"` filter (or call the GraphQL twice and merge), rename `fetch_easy_slugs`, and update the embed footer.

## Cost

GitHub Actions free tier for public repos covers this comfortably (one run/day, <30s). For private repos it counts against your Actions minutes but is still trivial.
