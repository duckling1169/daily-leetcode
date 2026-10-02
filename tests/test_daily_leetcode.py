from datetime import date, timedelta

import daily_leetcode as d


def q(slug, paid=False, tags=()):
    return {
        "titleSlug": slug,
        "isPaidOnly": paid,
        "topicTags": [{"slug": t} for t in tags],
    }


def test_eligible_filters_paid_skipped_and_tags():
    assert d.eligible(q("a", tags=["array"]), {"array"}, set())
    assert not d.eligible(q("a", paid=True), set(), set())
    assert not d.eligible(q("a"), set(), {"a"})
    assert not d.eligible(q("a", tags=["math"]), {"array"}, set())
    assert d.eligible(q("a", tags=["math"]), set(), set())


def test_pick_covers_the_pool_once_per_cycle():
    pool = [f"p{i}" for i in range(30)]
    start = date(2026, 10, 1)
    picks = [d.pick(pool, start + timedelta(days=i)) for i in range(len(pool))]
    assert sorted(picks) == sorted(pool)


def test_pick_ignores_pool_order():
    pool = [f"p{i}" for i in range(10)]
    day = date(2026, 10, 1)
    assert d.pick(pool, day) == d.pick(list(reversed(pool)), day)


def test_read_list_handles_commas_newlines_and_comments():
    assert d.read_list("# solved\na, b\n\nc,") == {"a", "b", "c"}


def test_embed():
    e = d.embed(
        {
            "questionFrontendId": "1",
            "title": "Two Sum",
            "titleSlug": "two-sum",
            "difficulty": "Easy",
            "topicTags": [{"name": "Array"}],
        }
    )
    assert e["title"] == "#1 Two Sum"
    assert e["url"] == "https://leetcode.com/problems/two-sum/"
    assert e["fields"][1]["value"] == "Array"
