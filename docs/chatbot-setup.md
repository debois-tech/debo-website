# Debo chatbot setup

## Environment
Copy the Debo section of `.env.example` into `.env.local`. All variables are server-only.

- `GEMINI_API_KEY`: from Google AI Studio. Without it Debo answers from the offline knowledge base.
- `CHATBOT_MODEL`: Gemini model id (default `gemini-2.5-flash`).
- `LEAD_WEBHOOK_URL`: optional. When empty, enquiries are emailed through FormSubmit to adityabankar@deboistech.in and harshadgangurde@deboistech.in (override with `ENQUIRY_NOTIFY_EMAILS`, comma separated; the first address is the main recipient, the rest are CC). FormSubmit asks the inbox owner to confirm the address once, on the first submission.

## Google Sheets storage
1. Create a Google Sheet. Debo creates an `Enquiries` tab and its header row on first write.
2. Extensions > Apps Script. Paste `docs/google_sheets_apps_script.gs` over the default file.
3. Project Settings > Script properties > add `SECRET` with a long random value.
4. Run `testCreate` once and approve the permissions. A test row should appear.
5. Deploy > New deployment > type Web app. Execute as: **Me**. Who has access: **Anyone**. (A domain-restricted deployment blocks the server.)
6. Copy the Web app URL into `GOOGLE_SHEETS_WEBHOOK_URL` and the same secret into `GOOGLE_SHEETS_SECRET`.
7. Open the URL in a browser: it should return `{"ok":true,...}`.

After editing the script, use Deploy > Manage deployments > Edit > New version so the URL keeps serving the latest code.

## Without Sheets
With either Sheets variable missing, enquiries are appended to `.data/enquiries.json` (gitignored). That is for development; on serverless hosts the file system is not durable.

## Updating what Debo knows
All company facts live in `src/lib/chatbot/live-site.ts`. The system prompt and the offline replies read from it.
