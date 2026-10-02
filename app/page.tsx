import {
  DIFFICULTIES,
  problemFor,
  TAGS,
  type Difficulty,
  type Problem,
} from "@/lib/leetcode";

export const revalidate = 3600;

const REPO = "https://github.com/duckling1169/daily-leetcode";
const BAND: Record<Difficulty, string> = {
  EASY: "easy",
  MEDIUM: "medium",
  HARD: "hard",
};

const dayOfYear = (d: Date) =>
  Math.floor(
    (Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) -
      Date.UTC(d.getUTCFullYear(), 0, 0)) /
      86_400_000,
  );

async function todays(): Promise<Partial<Record<Difficulty, Problem>>> {
  const entries = await Promise.all(
    DIFFICULTIES.map(async (d) => {
      try {
        return [d, (await problemFor(d, [])).problem] as const;
      } catch {
        return [d, undefined] as const;
      }
    }),
  );
  return Object.fromEntries(entries);
}

export default async function Home() {
  const now = new Date();
  const problems = await todays();
  const exercise = `${now.getUTCFullYear()}.${String(dayOfYear(now)).padStart(3, "0")}`;

  return (
    <main>
      <section className="hero">
        <div className="panes" aria-hidden="true">
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i} />
          ))}
        </div>
        <div className="wrap">
          <nav className="nav" aria-label="Main">
            <span>Daily LeetCode</span>
            <span className="nav-links">
              <a href={REPO}>GitHub</a>
              <a className="button" href="/setup">
                Add to Discord
              </a>
            </span>
          </nav>
          <div className="hero-body">
            <h1>One problem a day, posted to your Discord</h1>
            <div className="hero-meta">
              <p>
                A daily data structures and algorithms exercise for study groups
                and servers. Free, and no bot to install.
              </p>
              <span className="mono">Exercise {exercise}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="topics wrap" aria-label="Topics you can choose">
        <p className="caption">Choose from {TAGS.length} topics</p>
        <div className="topic-grid">
          {TAGS.map((t) => (
            <span key={t}>{t}</span>
          ))}
        </div>
      </section>

      <p className="statement wrap">
        → Every morning your channel gets one{" "}
        <mark className="k-peach">free problem</mark>, matched to your{" "}
        <mark className="k-sky">difficulty</mark> and{" "}
        <mark className="k-lavender">topics</mark>, so the whole server{" "}
        <mark className="k-pink">practices together</mark>. No accounts, no
        streaks to keep.
      </p>

      <section className="section" aria-labelledby="today">
        <div className="wrap">
          <h2 id="today">Today&apos;s problems</h2>
          <div className="bands">
            {DIFFICULTIES.map((d, i) => {
              const p = problems[d];
              return (
                <details key={d} className={`band ${BAND[d]}`} open={i === 0}>
                  <summary>
                    {String(i + 1).padStart(2, "0")} → {d.toLowerCase()}
                  </summary>
                  <div className="band-body">
                    {p ? (
                      <>
                        <div>
                          <h3>
                            #{p.questionFrontendId} {p.title}
                          </h3>
                          <p>
                            {p.topicTags.map((t) => t.name).join(", ") ||
                              "No topics listed"}
                          </p>
                        </div>
                        <a
                          className="arrow"
                          href={`https://leetcode.com/problems/${p.titleSlug}/`}
                          aria-label={`Open ${p.title} on LeetCode`}
                        >
                          →
                        </a>
                      </>
                    ) : (
                      <p>LeetCode didn&apos;t answer. Check back soon.</p>
                    )}
                  </div>
                </details>
              );
            })}
          </div>
          <p className="formula">
            Problems are picked by <code>p = order[d mod n]</code>: a fixed
            shuffle of the pool, one step per day, so every problem comes up
            once per cycle and every channel with the same settings gets the
            same one.
          </p>
        </div>
      </section>

      <section
        className="section"
        aria-labelledby="setup"
        style={{ paddingTop: 0 }}
      >
        <div className="wrap">
          <h2 id="setup">Add it to your server</h2>
          <ol className="steps">
            <li>
              <h3>Create a webhook</h3>
              <p>
                In Discord, open the channel&apos;s settings → Integrations →
                Webhooks → New Webhook, then copy its URL.
              </p>
            </li>
            <li>
              <h3>Paste it here</h3>
              <p>Choose a difficulty and any topics you want to focus on.</p>
            </li>
            <li>
              <h3>Practice daily</h3>
              <p>
                A problem arrives at 13:00 UTC. Your manage link changes it or
                turns it off.
              </p>
            </li>
          </ol>
          <div className="cta">
            <span className="mono">Free · open source · self-hostable</span>
            <a className="button" href="/setup">
              Add to Discord →
            </a>
          </div>
        </div>
      </section>

      <footer className="footer wrap">
        <span>Not affiliated with LeetCode or Discord.</span>
        <a href={REPO}>MIT licensed on GitHub</a>
      </footer>
    </main>
  );
}
