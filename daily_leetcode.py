import json
import os
import random
import sys
from datetime import date
from pathlib import Path
import requests

LEETCODE_GQL = "https://leetcode.com/graphql"
SEEN_PATH = Path("seen.json")
WEBHOOK_URL = os.environ["DISCORD_WEBHOOK_URL"]

# Comma-separated tag slugs to restrict the pool to. OR semantics — picks problems
# matching *any* listed tag. Empty/unset means no tag filter. See README for the
# full list of valid slugs.
ALLOWED_TAGS = {t.strip() for t in os.environ.get("LEETCODE_TAGS", "").split(",") if t.strip()}

HEADERS = {
    "Content-Type": "application/json",
    "User-Agent": "daily-leetcode-bot/1.0",
    "Referer": "https://leetcode.com",
}

# --- LeetCode fetchers ---

PAGE_SIZE = 100  # LeetCode caps response at 100 regardless of `limit`; must paginate via `skip`.

def fetch_easy_slugs():
    """Get all free easy problem slugs, filtered by ALLOWED_TAGS if set."""
    query = """
    query problemsetQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionListFilterInput) {
      problemsetQuestionList: questionList(
        categorySlug: $categorySlug
        limit: $limit
        skip: $skip
        filters: $filters
      ) {
        questions: data {
          titleSlug
          isPaidOnly
          topicTags { slug }
        }
      }
    }
    """
    slugs = []
    skip = 0
    while True:
        variables = {"categorySlug": "", "skip": skip, "limit": PAGE_SIZE, "filters": {"difficulty": "EASY"}}
        r = requests.post(LEETCODE_GQL, json={"query": query, "variables": variables}, headers=HEADERS, timeout=20)
        r.raise_for_status()
        page = r.json()["data"]["problemsetQuestionList"]["questions"]
        if not page:
            break
        for q in page:
            if q["isPaidOnly"]:
                continue
            if ALLOWED_TAGS and not (ALLOWED_TAGS & {t["slug"] for t in q["topicTags"]}):
                continue
            slugs.append(q["titleSlug"])
        skip += len(page)
    return slugs

def fetch_problem(slug):
    query = """
    query questionData($titleSlug: String!) {
      question(titleSlug: $titleSlug) {
        questionFrontendId
        title
        titleSlug
        difficulty
        content
        topicTags { name }
      }
    }
    """
    r = requests.post(LEETCODE_GQL, json={"query": query, "variables": {"titleSlug": slug}}, headers=HEADERS, timeout=20)
    r.raise_for_status()
    return r.json()["data"]["question"]

# --- State ---

def load_seen():
    if not SEEN_PATH.exists():
        return {}
    return json.loads(SEEN_PATH.read_text())

def save_seen(seen):
    SEEN_PATH.write_text(json.dumps(seen, indent=2, sort_keys=True))

# --- Discord ---

def post_to_discord(problem):
    url = f"https://leetcode.com/problems/{problem['titleSlug']}/"
    tags = ", ".join(t["name"] for t in problem["topicTags"]) or "—"
    embed = {
        "title": f"#{problem['questionFrontendId']} — {problem['title']}",
        "url": url,
        "color": 0x00B8A3,  # leetcode green-ish
        "fields": [
            {"name": "Difficulty", "value": problem["difficulty"], "inline": True},
            {"name": "Tags", "value": tags, "inline": True},
        ],
        "footer": {"text": "Daily Easy"},
    }
    r = requests.post(WEBHOOK_URL, json={"embeds": [embed]}, timeout=20)
    r.raise_for_status()

# --- Main ---

def main():
    seen = load_seen()
    today = date.today().isoformat()

    # Idempotency guard: if any entry was already posted today, exit cleanly so
    # a manual dispatch + delayed scheduled run can't double-post.
    if any(entry.get("posted") == today for entry in seen.values()):
        print(f"Already posted today ({today}). Skipping.")
        return

    all_slugs = fetch_easy_slugs()

    # Misconfigured filter (e.g., typo in LEETCODE_TAGS) would otherwise silently
    # wipe seen.json via the reset branch below. Fail loudly instead.
    if not all_slugs:
        print(f"No problems matched filter (tags={ALLOWED_TAGS or 'none'}). Aborting.", file=sys.stderr)
        sys.exit(1)

    unseen = [s for s in all_slugs if s not in seen]

    if not unseen:
        print("Exhausted all matching problems. Resetting.", file=sys.stderr)
        seen = {}
        unseen = all_slugs

    slug = random.choice(unseen)
    problem = fetch_problem(slug)
    post_to_discord(problem)

    seen[slug] = {"posted": today, "title": problem["title"]}
    save_seen(seen)
    print(f"Posted: {problem['title']} ({slug})")

if __name__ == "__main__":
    main()
