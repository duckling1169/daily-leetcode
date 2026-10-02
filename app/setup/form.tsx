"use client";

import { useActionState, useState } from "react";

import { SettingsFields } from "@/app/_components/SettingsFields";
import { subscribeAction, type FormState } from "@/app/actions";

export function SetupForm() {
  const [state, run, pending] = useActionState<FormState, FormData>(
    subscribeAction,
    {},
  );
  const [copied, setCopied] = useState(false);

  if (state.manageUrl) {
    return (
      <>
        <p className="notice">
          You&apos;re set up. A welcome message just arrived in your channel.
        </p>
        <div className="field">
          <label htmlFor="manage">Your manage link</label>
          <input
            id="manage"
            className="url"
            readOnly
            value={state.manageUrl}
            onFocus={(e) => e.currentTarget.select()}
          />
          <small>
            It&apos;s shown once. Bookmark it to change topics or stop posting.
          </small>
        </div>
        <button
          type="button"
          className="button"
          onClick={async () => {
            await navigator.clipboard.writeText(state.manageUrl!);
            setCopied(true);
          }}
        >
          {copied ? "Copied" : "Copy link"}
        </button>
      </>
    );
  }

  return (
    <form action={run}>
      <div className="field">
        <label htmlFor="webhook">Channel webhook URL</label>
        <input
          id="webhook"
          name="webhook"
          type="url"
          required
          placeholder="https://discord.com/api/webhooks/…"
          autoComplete="off"
        />
      </div>
      <SettingsFields />
      {state.error && <p className="error">{state.error}</p>}
      <button className="button" disabled={pending}>
        {pending ? "Checking…" : "Start posting"}
      </button>
    </form>
  );
}
