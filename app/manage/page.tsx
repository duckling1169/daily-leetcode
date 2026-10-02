import { settingsFor } from "@/lib/subscriptions";

import { ManageForm } from "./form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Manage · Daily LeetCode" };

export default async function ManagePage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const { key } = await searchParams;
  const settings = key ? await settingsFor(key) : null;

  return (
    <main className="hero form-page">
      <div className="panes" aria-hidden="true">
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} />
        ))}
      </div>
      <div className="wrap">
        <nav className="nav" aria-label="Main">
          <a href="/">Daily LeetCode</a>
        </nav>
        <section className="panel">
          <h1>Your channel</h1>
          {settings && key ? (
            <ManageForm manageKey={key} settings={settings} />
          ) : (
            <p>
              This manage link doesn&apos;t match a channel. It may have been
              turned off. <a href="/setup">Set up again</a>.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
