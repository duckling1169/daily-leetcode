import { createHash } from "node:crypto";

// LeetCode's public GraphQL API, and the stateless daily pick: the pool is ordered by a
// hash of each slug, and day d posts order[d mod n]. Every problem comes up once per
// cycle, and everyone with the same settings gets the same problem, with nothing stored.

const ENDPOINT = "https://leetcode.com/graphql";
const PAGE_SIZE = 100; // LeetCode caps a page at 100.
const HEADERS = {
  "Content-Type": "application/json",
  "User-Agent": "daily-leetcode/3.0",
  Referer: "https://leetcode.com",
};

export const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

/** Topic tags offered on the setup page: the core data-structures and algorithms set. */
export const TAGS = [
  "array",
  "string",
  "hash-table",
  "two-pointers",
  "sliding-window",
  "binary-search",
  "stack",
  "linked-list",
  "tree",
  "binary-tree",
  "binary-search-tree",
  "heap-priority-queue",
  "graph",
  "breadth-first-search",
  "depth-first-search",
  "dynamic-programming",
  "greedy",
  "backtracking",
  "recursion",
  "sorting",
  "bit-manipulation",
  "prefix-sum",
  "divide-and-conquer",
  "math",
] as const;

export type Question = {
  titleSlug: string;
  isPaidOnly: boolean;
  topicTags: { slug: string }[];
};

export type Problem = {
  questionFrontendId: string;
  title: string;
  titleSlug: string;
  difficulty: string;
  topicTags: { name: string }[];
};

async function graphql<T>(
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ query, variables }),
    // Problem lists change slowly; cache for an hour (the landing page reads these).
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`LeetCode returned HTTP ${res.status}.`);
  const body = (await res.json()) as { data: T };
  return body.data;
}

/** Free problems of one difficulty matching any of `tags` (all when empty). */
export function eligible(q: Question, tags: readonly string[]): boolean {
  if (q.isPaidOnly) return false;
  return tags.length === 0 || q.topicTags.some((t) => tags.includes(t.slug));
}

export async function fetchPool(
  difficulty: Difficulty,
  tags: readonly string[],
): Promise<string[]> {
  const slugs: string[] = [];
  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { questionList } = await graphql<{
      questionList: { data: Question[] };
    }>(
      `
        query ($skip: Int, $limit: Int, $filters: QuestionListFilterInput) {
          questionList(
            categorySlug: ""
            skip: $skip
            limit: $limit
            filters: $filters
          ) {
            data {
              titleSlug
              isPaidOnly
              topicTags {
                slug
              }
            }
          }
        }
      `,
      { skip: offset, limit: PAGE_SIZE, filters: { difficulty } },
    );
    if (questionList.data.length === 0) return slugs;
    slugs.push(
      ...questionList.data
        .filter((q) => eligible(q, tags))
        .map((q) => q.titleSlug),
    );
  }
}

export async function fetchProblem(slug: string): Promise<Problem> {
  const { question } = await graphql<{ question: Problem }>(
    `
      query ($titleSlug: String!) {
        question(titleSlug: $titleSlug) {
          questionFrontendId
          title
          titleSlug
          difficulty
          topicTags {
            name
          }
        }
      }
    `,
    { titleSlug: slug },
  );
  return question;
}

const hash = (s: string) => createHash("sha256").update(s).digest("hex");

/** Days since 1970-01-01 (UTC) for `date`. */
export const dayNumber = (date: Date) =>
  Math.floor(date.getTime() / 86_400_000);

/** The problem for day `day`: order[day mod n] in a stable hash order. */
export function pick(pool: readonly string[], day: number): string {
  if (pool.length === 0) throw new Error("Empty problem pool.");
  const order = [...pool].sort((a, b) => (hash(a) < hash(b) ? -1 : 1));
  return order[day % order.length]!;
}

/** Today's problem for a difficulty and tag set. */
export async function problemFor(
  difficulty: Difficulty,
  tags: readonly string[],
  date = new Date(),
): Promise<{ problem: Problem; poolSize: number }> {
  const pool = await fetchPool(difficulty, tags);
  if (pool.length === 0) {
    throw new Error(`No free ${difficulty} problems match those tags.`);
  }
  return {
    problem: await fetchProblem(pick(pool, dayNumber(date))),
    poolSize: pool.length,
  };
}
