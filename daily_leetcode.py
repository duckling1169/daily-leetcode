# /// script
# requires-python = ">=3.12"
# dependencies = ["requests>=2.34.2"]
# ///
"""Post one LeetCode problem to a Discord channel per day.

Stateless: the free problem pool is ordered by a hash of each slug, and day N posts
the problem at position N mod pool size. Every problem comes up once per cycle with
no stored state. Problems listed in skip.txt are never posted.
"""

import hashlib
import os
import sys
from datetime import UTC, date, datetime
from pathlib import Path

import requests

LEETCODE_GQL = "https://leetcode.com/graphql"
SKIP_PATH = Path(__file__).with_name("skip.txt")
PAGE_SIZE = 100  # LeetCode caps a page at 100; paginate with `skip`.
HEADERS = {
    "Content-Type": "application/json",
    "User-Agent": "daily-leetcode-bot/2.0",
    "Referer": "https://leetcode.com",
}

LIST_QUERY = """
query questionList($skip: Int, $limit: Int, $filters: QuestionListFilterInput) {
  questionList(categorySlug: "", skip: $skip, limit: $limit, filters: $filters) {
    data { titleSlug isPaidOnly topicTags { slug } }
  }
}
"""

PROBLEM_QUERY = """
query question($titleSlug: String!) {
  question(titleSlug: $titleSlug) {
    questionFrontendId title titleSlug difficulty topicTags { name }
  }
}
"""


def graphql(query: str, variables: dict) -> dict:
    r = requests.post(
        LEETCODE_GQL,
        json={"query": query, "variables": variables},
        headers=HEADERS,
        timeout=20,
    )
    r.raise_for_status()
    return r.json()["data"]


def eligible(question: dict, tags: set[str], skip: set[str]) -> bool:
    """Free, not skipped, and matching any of `tags` (all problems when `tags` is empty)."""
    if question["isPaidOnly"] or question["titleSlug"] in skip:
        return False
    return not tags or bool(tags & {t["slug"] for t in question["topicTags"]})


def fetch_pool(difficulty: str, tags: set[str], skip: set[str]) -> list[str]:
    slugs, offset = [], 0
    while page := graphql(
        LIST_QUERY,
        {"skip": offset, "limit": PAGE_SIZE, "filters": {"difficulty": difficulty}},
    )["questionList"]["data"]:
        slugs += [q["titleSlug"] for q in page if eligible(q, tags, skip)]
        offset += len(page)
    return slugs


def pick(pool: list[str], day: date) -> str:
    """The problem for `day`: a stable hash order, so a problem's place only moves
    when problems are added or removed."""
    order = sorted(pool, key=lambda s: hashlib.sha256(s.encode()).hexdigest())
    return order[day.toordinal() % len(order)]


def embed(problem: dict) -> dict:
    return {
        "title": f"#{problem['questionFrontendId']} {problem['title']}",
        "url": f"https://leetcode.com/problems/{problem['titleSlug']}/",
        "color": 0x00B8A3,
        "fields": [
            {"name": "Difficulty", "value": problem["difficulty"], "inline": True},
            {
                "name": "Tags",
                "value": ", ".join(t["name"] for t in problem["topicTags"]) or "None",
                "inline": True,
            },
        ],
        "footer": {"text": "Daily LeetCode"},
    }


def read_list(value: str) -> set[str]:
    """Comma- or newline-separated values; `#` lines are comments."""
    items = (i.strip() for i in value.replace("\n", ",").split(","))
    return {i for i in items if i and not i.startswith("#")}


def main() -> None:
    webhook = os.environ["DISCORD_WEBHOOK_URL"]
    difficulty = os.environ.get("LEETCODE_DIFFICULTY", "EASY").upper()
    tags = read_list(os.environ.get("LEETCODE_TAGS", ""))
    skip = read_list(SKIP_PATH.read_text()) if SKIP_PATH.exists() else set()

    pool = fetch_pool(difficulty, tags, skip)
    if not pool:
        sys.exit(f"No {difficulty} problems match LEETCODE_TAGS={sorted(tags)}.")

    slug = pick(pool, datetime.now(UTC).date())
    problem = graphql(PROBLEM_QUERY, {"titleSlug": slug})["question"]
    requests.post(
        webhook, json={"embeds": [embed(problem)]}, timeout=20
    ).raise_for_status()
    print(f"Posted {problem['title']} ({slug}) from a pool of {len(pool)}.")


if __name__ == "__main__":
    main()
