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

HEADERS = {
    "Content-Type": "application/json",
    "User-Agent": "daily-leetcode-bot/1.0",
    "Referer": "https://leetcode.com",
}

# --- LeetCode fetchers ---

def fetch_easy_slugs():
    """Get all easy problem slugs. ~870 problems, one call."""
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
        }
      }
    }
    """
    variables = {
        "categorySlug": "",
        "skip": 0,
        "limit": 2000,
        "filters": {"difficulty": "EASY"},
    }
    r = requests.post(LEETCODE_GQL, json={"query": query, "variables": variables}, headers=HEADERS, timeout=20)
    r.raise_for_status()
    questions = r.json()["data"]["problemsetQuestionList"]["questions"]
    # skip premium-locked problems — users can't open them
    return [q["titleSlug"] for q in questions if not q["isPaidOnly"]]

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
    all_slugs = fetch_easy_slugs()
    unseen = [s for s in all_slugs if s not in seen]

    if not unseen:
        print("Exhausted all easy problems. Resetting.", file=sys.stderr)
        seen = {}
        unseen = all_slugs

    slug = random.choice(unseen)
    problem = fetch_problem(slug)
    post_to_discord(problem)

    seen[slug] = {"posted": date.today().isoformat(), "title": problem["title"]}
    save_seen(seen)
    print(f"Posted: {problem['title']} ({slug})")

if __name__ == "__main__":
    main()
