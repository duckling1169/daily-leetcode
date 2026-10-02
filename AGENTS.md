# Project instructions

See `README.md` for purpose and architecture.

## Commands

- Setup: Node.js 24 and pnpm 12; `pnpm install --frozen-lockfile`
- Check: `pnpm verify` (format, typecheck, test); `pnpm build` before deploying

## Rules

- Webhook URLs and manage keys are credentials: never log them or return them in errors.
- Calling `/api/cron` or a subscription's webhook posts to a real Discord channel; tests
  must not.
- Keep the daily pick stateless (`lib/leetcode.ts`); store only subscriptions.
- Plain CSS only.
