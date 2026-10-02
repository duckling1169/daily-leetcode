# Daily LeetCode

[![Daily LeetCode](https://github.com/duckling1169/daily-leetcode/actions/workflows/daily.yml/badge.svg)](https://github.com/duckling1169/daily-leetcode/actions/workflows/daily.yml)
[![CI](https://github.com/duckling1169/daily-leetcode/actions/workflows/ci.yml/badge.svg)](https://github.com/duckling1169/daily-leetcode/actions/workflows/ci.yml)

Posts one LeetCode problem to a Discord channel every day. One Python script, a Discord
webhook and a GitHub Actions cron job: no bot account, no database, no stored state.

## How it works

1. The workflow runs daily at 06:07 UTC.
2. The script pages through LeetCode's public GraphQL API for free problems of one
   difficulty, keeps those with any of the configured topic tags, and drops anything in
   `skip.txt`.
3. It sorts that pool by a hash of each problem's slug and posts the problem at position
   `day number mod pool size`. Every problem comes up once per cycle, in an order that
   looks random, without remembering what was posted. New LeetCode problems slot in
   without resetting the cycle.

## Set up

1. Fork this repo.
2. Create a webhook in your Discord channel (channel settings → Integrations → Webhooks).
3. Add it as the repository secret `DISCORD_WEBHOOK_URL` (Settings → Secrets and
   variables → Actions).
4. Run the workflow once from the Actions tab to check it posts.

## Configure

| Setting | Where |
| --- | --- |
| Time of day | `cron:` in `.github/workflows/daily.yml` |
| Topic tags | `LEETCODE_TAGS` in the workflow: comma-separated slugs as in `leetcode.com/tag/<slug>/`; empty means all |
| Difficulty | `LEETCODE_DIFFICULTY`: `EASY` (default), `MEDIUM` or `HARD` |
| Problems to never post | `skip.txt`, one slug per line |

## Develop

```bash
uv run --with pytest --with requests python -m pytest
uvx ruff check && uvx ruff format --check
```

The script declares its own dependencies ([PEP 723](https://peps.python.org/pep-0723/)),
so `uv run daily_leetcode.py` needs no setup. Running it posts to the webhook in
`DISCORD_WEBHOOK_URL`.

## License

[MIT](LICENSE)
