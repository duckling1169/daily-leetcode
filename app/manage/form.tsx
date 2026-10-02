"use client";

import { useActionState } from "react";

import { SettingsFields } from "@/app/_components/SettingsFields";
import { unsubscribeAction, updateAction, type FormState } from "@/app/actions";
import type { Settings } from "@/lib/subscriptions";

export function ManageForm({
  manageKey,
  settings,
}: {
  manageKey: string;
  settings: Settings;
}) {
  const [saved, save, saving] = useActionState<FormState, FormData>(
    updateAction,
    {},
  );
  const [stopped, stop, stopping] = useActionState<FormState, FormData>(
    unsubscribeAction,
    {},
  );

  if (stopped.notice) return <p className="notice">{stopped.notice}</p>;

  return (
    <>
      <form action={save}>
        <input type="hidden" name="key" value={manageKey} />
        <SettingsFields initial={settings} />
        {saved.notice && <p className="notice">{saved.notice}</p>}
        {(saved.error ?? stopped.error) && (
          <p className="error">{saved.error ?? stopped.error}</p>
        )}
        <button className="button" disabled={saving}>
          {saving ? "Saving…" : "Save settings"}
        </button>
      </form>
      <form action={stop} style={{ marginTop: 24 }}>
        <input type="hidden" name="key" value={manageKey} />
        <button className="link-button" disabled={stopping}>
          Stop posting to this channel
        </button>
      </form>
    </>
  );
}
