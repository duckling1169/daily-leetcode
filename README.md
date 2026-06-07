# Daily LeetCode → Discord

[![Daily LeetCode](https://github.com/duckling1169/daily-leetcode/actions/workflows/daily.yml/badge.svg)](https://github.com/duckling1169/daily-leetcode/actions/workflows/daily.yml)

Posts one random LeetCode Easy problem to a Discord channel every day. No bot user, no database — just a Python script, a webhook, and GitHub Actions cron.

## How it works

1. GitHub Actions cron fires daily at 13:00 UTC (9 AM EDT).
2. Script paginates through all Easy problems from LeetCode's public GraphQL endpoint (capped at 100 per request).
3. Filters out Premium-locked problems, anything in `seen.json`, and optionally restricts to a set of topic tags.
4. Picks a random unseen slug, fetches its details, posts an embed via the Discord webhook.
5. Appends the slug to `seen.json` and commits it back to the repo.

When all matching problems have been posted, `seen.json` resets and the cycle repeats. With no tag filter, the pool is ~900 free Easy problems (~2.5 years).

## Setup

1. Fork or clone this repo and push to GitHub.
2. Create a Discord webhook on the target channel (channel settings → Integrations → Webhooks → New Webhook → Copy URL). Requires *Manage Webhooks* on the channel.
3. In the GitHub repo: **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `DISCORD_WEBHOOK_URL`
   - Value: the webhook URL from step 2
4. Trigger the workflow once manually (**Actions** tab → *Daily LeetCode* → *Run workflow*) to verify before relying on the cron.

## Files

- `daily_leetcode.py` — the script
- `requirements.txt` — pinned Python deps (just `requests`)
- `.github/workflows/daily.yml` — cron + commit-back
- `seen.json` — generated on first run; tracks posted slugs. Committed to the repo as auditable, free dedup state.

## Tuning

| What | Where |
|---|---|
| Cron time (UTC) | `.github/workflows/daily.yml`, `cron:` line |
| Topic filter | `.github/workflows/daily.yml`, `LEETCODE_TAGS` env var (see below) |
| Difficulty filter | `daily_leetcode.py`, `fetch_easy_slugs()` → `filters` dict |
| Embed color, footer, fields | `daily_leetcode.py`, `post_to_discord()` |
| Reset behavior on pool exhaustion | `daily_leetcode.py`, `main()` |

### Topic filter (`LEETCODE_TAGS`)

Set the `LEETCODE_TAGS` env var in `.github/workflows/daily.yml` to a comma-separated list of tag slugs to restrict the pool. Empty/unset means no filter. **OR semantics** — a problem qualifies if it has *any* of the listed tags.

```yaml
env:
  LEETCODE_TAGS: "array,string,hash-table"
```

If the filter matches zero problems (e.g., a typo), the job exits non-zero rather than corrupting `seen.json`.

<details>
<summary><strong>Available tag slugs</strong> — counts are free Easy problems per tag (harvested once; they grow over time, slugs are stable)</summary>

| Slug | Display name | Count |
|---|---|---:|
| `array` | Array | 430 |
| `string` | String | 245 |
| `hash-table` | Hash Table | 187 |
| `math` | Math | 168 |
| `sorting` | Sorting | 98 |
| `simulation` | Simulation | 94 |
| `counting` | Counting | 70 |
| `two-pointers` | Two Pointers | 68 |
| `database` | Database | 54 |
| `bit-manipulation` | Bit Manipulation | 53 |
| `greedy` | Greedy | 50 |
| `tree` | Tree | 38 |
| `matrix` | Matrix | 38 |
| `enumeration` | Enumeration | 38 |
| `depth-first-search` | Depth-First Search | 36 |
| `binary-tree` | Binary Tree | 35 |
| `binary-search` | Binary Search | 27 |
| `prefix-sum` | Prefix Sum | 25 |
| `stack` | Stack | 23 |
| `breadth-first-search` | Breadth-First Search | 19 |
| `sliding-window` | Sliding Window | 18 |
| `heap-priority-queue` | Heap (Priority Queue) | 15 |
| `linked-list` | Linked List | 12 |
| `dynamic-programming` | Dynamic Programming | 12 |
| `number-theory` | Number Theory | 12 |
| `recursion` | Recursion | 11 |
| `string-matching` | String Matching | 10 |
| `design` | Design | 10 |
| `binary-search-tree` | Binary Search Tree | 9 |
| `geometry` | Geometry | 9 |
| `queue` | Queue | 6 |
| `divide-and-conquer` | Divide and Conquer | 5 |
| `counting-sort` | Counting Sort | 5 |
| `hash-function` | Hash Function | 4 |
| `trie` | Trie | 3 |
| `memoization` | Memoization | 3 |
| `backtracking` | Backtracking | 3 |
| `brainteaser` | Brainteaser | 3 |
| `game-theory` | Game Theory | 3 |
| `data-stream` | Data Stream | 3 |
| `graph` | Graph Theory | 3 |
| `combinatorics` | Combinatorics | 3 |
| `ordered-set` | Ordered Set | 3 |
| `shell` | Shell | 2 |
| `interactive` | Interactive | 2 |
| `monotonic-stack` | Monotonic Stack | 2 |
| `concurrency` | Concurrency | 1 |
| `union-find` | Union-Find | 1 |
| `rolling-hash` | Rolling Hash | 1 |
| `segment-tree` | Segment Tree | 1 |
| `doubly-linked-list` | Doubly-Linked List | 1 |

</details>

To add Mediums later: drop the `"difficulty"` filter (or call the GraphQL twice and merge), rename `fetch_easy_slugs`, and update the embed footer.

## Cost

GitHub Actions free tier for public repos covers this comfortably (one run/day, ~15s typical, occasionally up to ~90s when LeetCode's GraphQL is laggy — the script paginates ~10 sequential requests). For private repos it counts against your Actions minutes but is still trivial.
