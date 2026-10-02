import { SetupForm } from "./form";

export const metadata = { title: "Add to Discord · Daily LeetCode" };

export default function SetupPage() {
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
          <h1>Add to Discord</h1>
          <p>
            In the channel&apos;s settings, open Integrations → Webhooks → New
            Webhook, copy its URL, and paste it below.
          </p>
          <SetupForm />
        </section>
      </div>
    </main>
  );
}
