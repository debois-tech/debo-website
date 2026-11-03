# Security audit: 3 November 2026

Scope: the whole `app/` project on branch `feat/restore-chatbot` (public site, API routes, chatbot, dashboard, Firebase rules, dependencies, headers).
Method: code review of every API route and every place that renders stored or visitor text; secret scan of the tree and full git history; dependency audit; probing the running production build with hostile requests; a browser crawl of all pages under the new CSP.

## Fixed in this change

| # | Severity | Finding | Fix |
|---|---|---|---|
| 1 | High | **The chatbot could be talked into flooding the team inbox.** Each chat reply could call the enquiry tool up to 4 times, and chat allowed 30 requests per 10 minutes, so one visitor could trigger ~120 enquiry emails per 10 minutes. | One enquiry per reply, and the same per-IP budget as the form endpoint (5 per 10 minutes) (`lib/chatbot/tools.ts`). |
| 2 | High | **No Content-Security-Policy.** Nothing limited what a page could load or where it could post. | Strict CSP in `next.config.ts` (self only; Firebase only for the dashboard; no framing, plugins, `<base>` or form hijacking). Checked on all 20 routes, chat, forms and a failed dashboard sign-in: no violations. |
| 3 | Medium | **Rate limit trusted the first `X-Forwarded-For` value**, which a client can set, letting one visitor use unlimited "different" addresses. | `lib/request.ts`: prefers platform headers, else the last forwarded entry. |
| 4 | Medium | **A malformed or `null` `Origin` header crashed every POST route with a 500** (uncaught `new URL()`), instead of being refused. | `sameOrigin()`: refuses `null`, malformed and cross-site requests with 403. Also checks `Sec-Fetch-Site`. |
| 5 | Medium | **No site-wide cap on chat requests**, so many addresses together could run up the AI bill. | Global ceiling (600 per 10 minutes per instance) on `/api/chat`. |
| 6 | Medium | **Chat body was read in full before its size was checked.** | `Content-Length` checked first (413 before reading). |
| 7 | Medium | **The chat transcript, including the visitor's name, email and phone, was kept in `localStorage` for 24 hours**, readable by the next person on a shared computer. | Moved to `sessionStorage` (cleared when the tab closes; a refresh in the same tab still keeps the chat). |
| 8 | Low | **Links saved in the dashboard (apply links, LinkedIn, repo, demo, video) went into `href` unchecked.** React 19 already blocks `javascript:` links; this adds a second guard. | `safeUrl()` in `lib/content.ts`: only `http(s)` links and site paths reach pages. |
| 9 | Low | Images served from the database could in theory carry active content. | `Content-Security-Policy: default-src 'none'; sandbox` on `/api/img/*` (SVG was already excluded). |
| 10 | Low | Missing hardening headers. | Added `Cross-Origin-Opener-Policy`, wider `Permissions-Policy`. |

New tests: `src/lib/request.test.ts`, `src/lib/chatbot/tools.guard.test.ts`.

## Checked and found sound

- **Secrets:** none in the tree or in git history. The only key present is the Firebase *web* key in `lib/firebase-config.ts`, which is public by design. `.env*` and `.data/` are git-ignored. The Gemini key is server-only and sent in a header, never a URL.
- **Firebase rules:** root read/write denied; content nodes are public-read, admin-write; `admins` cannot be written from a browser; `drafts` are admin-only; images cannot be listed, only fetched by their unguessable id.
- **Dashboard access** is enforced by the rules, not just by the page.
- **Output encoding:** no `innerHTML`/`eval`; the only `dangerouslySetInnerHTML` are JSON-LD with `<` escaped. Blog bodies and chat replies render as React text; chat links are limited to `/`, `http(s)` and `mailto`.
- **Email:** plain-text only, subject and reply-to stripped of line breaks (no header injection).
- **Google Sheets:** the Apps Script already neutralises leading `= + - @` (formula injection).
- **Image route:** id allow-list (no path traversal), MIME allow-list, `nosniff`.
- **Chatbot:** system prompt tells the model to treat visitor text and tool results as untrusted; navigation is limited to an allow-list of routes; tool results are data, never executed.
- No `X-Powered-By`, no stack traces on error pages.

## Needs you (consoles; cannot be done from code)

1. **Rotate the Gemini API key.** It was pasted into a chat session. Create a new one in Google AI Studio and set it in Vercel (`GEMINI_API_KEY`).
2. **Restrict the Firebase web API key** (Google Cloud Console, APIs and Services, Credentials): HTTP-referrer restriction to `deboistech.in`, `www.deboistech.in` and your preview domain.
3. **Firebase Authentication:** turn off public email/password sign-up (create admin users in the console only), turn on email-enumeration protection, and use strong passwords. Keep `/admins` to the people who need it.
4. **Publish `database.rules.json`** (adds the `community` node).
5. **Strict rate limits** need a shared store (for example Upstash). The built-in limiter is per server instance, so it blunts bursts but is not a hard cap.
6. Set `GOOGLE_SHEETS_SECRET` to a long random value and rotate it now and then.

## Known and accepted

- **`npm audit`: 4 high advisories** (`@grpc/grpc-js`, reached through `firebase` to Firestore). The site never imports Firestore (only Auth and Realtime Database), so that code is not in the shipped app, and the fix needs a breaking `--force` change. Re-check when Firebase publishes a patched release.
- **CSP `script-src` includes `'unsafe-inline'`** because Next.js writes small inline scripts into every page. Moving to nonces means rendering every page per request. All other directives are strict.
- **Enquiry notifications use FormSubmit** (a third-party relay) unless `LEAD_WEBHOOK_URL` is set. Consider sending them through Resend, as the contact form does.
- No bot protection beyond a honeypot, rate limits and same-origin checks. If spam appears, add Vercel BotID or a CAPTCHA.
