import { DIFFICULTIES, TAGS } from "@/lib/leetcode";
import type { Settings } from "@/lib/subscriptions";

/** Difficulty and topic choices, shared by /setup and /manage. */
export function SettingsFields({ initial }: { initial?: Settings }) {
  const difficulty = initial?.difficulty ?? "EASY";
  const tags = new Set(initial?.tags ?? []);
  return (
    <>
      <fieldset className="field">
        <legend>Difficulty</legend>
        <div className="choices">
          {DIFFICULTIES.map((d) => (
            <label key={d} className="choice">
              <input
                type="radio"
                name="difficulty"
                value={d}
                defaultChecked={d === difficulty}
              />
              <span>{d.toLowerCase()}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="field">
        <legend>Topics</legend>
        <small>
          Problems matching any selected topic. None selected means all.
        </small>
        <div className="choices">
          {TAGS.map((t) => (
            <label key={t} className="choice">
              <input
                type="checkbox"
                name="tags"
                value={t}
                defaultChecked={tags.has(t)}
              />
              <span>{t}</span>
            </label>
          ))}
        </div>
      </fieldset>
    </>
  );
}
