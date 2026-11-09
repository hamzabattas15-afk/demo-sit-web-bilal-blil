# Bilal Bellil Topics

The site UI is Moroccan Darija written in Arabic script and uses a right-to-left layout. All interface text is centralized in [`lib/strings.ts`](lib/strings.ts).

A responsive fan-participation app for Bilal Bellil. Built with Next.js 14 App Router, strict TypeScript, Tailwind CSS, Supabase Postgres/Auth, `@supabase/ssr`, and Zod. Node.js 20 or newer is required.

## Updating an existing installation

Run the **entire updated [`supabase/schema.sql`](supabase/schema.sql)** again in your project's Supabase SQL Editor. It is safe to rerun: existing accounts, applications, topics, and edited content are preserved. It adds the programme, special-topic fields, clinic team, seed content, and public `topic-images` Storage bucket with admin-only writes. No new environment variables, secret keys, manual bucket creation, or admin claim are needed.

## New admin controls

- **Talabat:** dynamic answers appear below each story. CSV includes full `extra` JSON plus a column per current extra question, preserving answers if a question was later removed.
- **Mawadi3:** edit weekly/special type, weekday, poster, badge, accent colour, sort order, deadline and visibility. Up/down arrows reorder topics atomically. Special topics appear above the weekly programme; weekly topics appear in the regular list.
- The form builder supports short text, long text, and selects with one choice per line. Codes must be unique and stable. The reserved `message` code customizes the existing story question and always requires at least 20 characters. Other answers go in `applications.extra`. Required answers and choices are validated in the browser, server action, and database insert trigger.
- **Lbrnamej:** edit all five days, Arabic titles, descriptions, emojis, colours, and enabled state. Replace the programme poster here. Today's highlight follows `Africa/Casablanca`, including after midnight. Friday links to `/3yada`; other days link to an active topic assigned to their weekday, when available. Clicking the poster opens a full-size lightbox.
- **L'équipe:** create, edit, hide, sort, or delete clinic team members and upload photos. Members without photos receive name-based avatars. Deletions require confirmation.
- **Settings:** the existing WhatsApp template editor and live preview.
- Image editors accept a public path such as `/programme.jpeg` or an HTTPS URL. Uploads accept JPEG, PNG, or WebP up to **3 MB**, checked by MIME, file signature, and Storage restrictions. Upload, then save the content to publish its new reference. Cancelling does not change the published image. Assets are public promotional images; replacing a reference does not delete the old Storage object.
- `/3yada` uses the seeded clinic topic ID, so renaming it does not break the page. The story question asks the love problem, and the required select asks relationship status. Deactivating the topic closes registration. This is an entertainment programme, not medical care.
- L'M7KAMA asks the opponent's name and a detailed conflict story. The official JPEGs are unchanged; their initially reversed filenames were corrected. The Sardi logo is unchanged.

## Setup

1. Open your Supabase project, go to **SQL Editor**, and run the entire [`supabase/schema.sql`](supabase/schema.sql). It is safe to run again; existing data is preserved. It creates the tables, security policies, first-admin claim, three example topics, and WhatsApp template.
2. In **Authentication → Providers → Email**, turn **Confirm email OFF** so sign-up logs you in immediately. If you keep confirmation on, configure your site URL and allow `http://localhost:3000/auth/callback` (and your production `/auth/callback` URL) under Authentication URL Configuration. The app also supports that confirmation flow.
3. In this folder, run:

   ```sh
   npm install
   npm run dev
   ```

   Open **http://localhost:3000**. On Windows, use Command Prompt, or use `npm.cmd install` and `npm.cmd run dev` if PowerShell blocks the `npm.ps1` launcher. No execution-policy changes are required. The supplied `.env.local` already contains the requested project URL and publishable key. It is ignored by Git; `.env.local.example` contains empty values.

4. Open **http://localhost:3000/admin/login**, choose **صايب حساب**, sign up with your email/password, then click **أنا المدير اللول**. Only the first successful claim works. Sign up and claim before sharing the site publicly. Later non-admin accounts cannot access the dashboard or claim admin access.
5. To replace the logo, put your image in `public/` and change the single `LOGO_PATH` line in [`lib/config.ts`](lib/config.ts), for example to `/my-logo.png`. Every logo instance and the favicon use this constant. Add an optional `public/banner.png` for the hero background; the CSS night sky is the automatic fallback. Restart the dev server or redeploy after adding assets.
6. Deploy this folder to **Vercel**, choose the Next.js preset, and add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from `.env.local`. Set the production site URL in Supabase Authentication settings. Deploy. Never add a service-role or secret key.

## Daily use

- Manage topics, weekly programme days and poster, clinic team members, and WhatsApp settings from their dashboard tabs. Upload a topic/team image or paste its URL. Deleting a topic requires confirmation and also deletes its applications. Dates are entered in the administrator's local timezone, stored as UTC, and displayed in Morocco time. Expired topics disappear publicly.
- Review applications under **Les participations**. Filter by topic/status, search by name, and use Accept, Reject, or Undo. Status changes are optimistic and roll back on failure. Counts cover the full database; the list is paginated.
- Accepted applications expose **Seft 3la WhatsApp**. This opens a `wa.me` link with the message; you manually send it from WhatsApp. There is no WhatsApp API or automatic sending.
- Edit the message under **WhatsApp**, keeping `{name}` and `{topic}`. The preview updates as you type.
- Select a topic to enable **Export CSV**. Export includes all applications for that topic, across every page and status. It includes a UTF-8 BOM for Arabic/Excel, quotes multiline fields, and neutralizes spreadsheet formulas.
- All interface text and validation messages are centralized in [`lib/strings.ts`](lib/strings.ts).

## Validation

```sh
npm test
npm run typecheck
npm run build
npm start
```

Tests cover Moroccan phone normalization, schema boundaries, template interpolation, WhatsApp URL encoding, CSV encoding, and spreadsheet formula protection. Google fonts are fetched during the first production build by `next/font`; the build requires network access. Fonts are then served locally by Next.js.

## Security and operation

- The publishable key is intentionally public. RLS and grants protect the data. Anonymous users cannot select applications, and authenticated non-admins cannot read them or change statuses. Only admins can manage content or read the WhatsApp template. The `programme_image` setting alone is publicly readable. The first-admin function uses a table lock to prevent two simultaneous claims.
- Public inserts can only create pending applications for an active, unexpired topic. Database checks enforce ages, normalized mobile numbers, field lengths, and one number per topic.
- A hidden honeypot and a bounded, per-process server-action limiter allow at most five attempts per IP and three per phone within 15 minutes. A database trigger additionally limits a phone to three successful submissions across topics in 15 minutes, including direct REST requests. Per-IP limits reset on process restarts and are not shared between server instances; they are basic abuse protection. Deploy behind a trusted proxy that overwrites forwarding headers, as Vercel does.
- Middleware refreshes admin sessions and checks authorization. Protected pages, every admin action, the export endpoint, and Postgres policies check access again. Application inserts never request the inserted private row back.
- If Supabase is unavailable or the schema has not been run, the site shows a Darija connection/configuration message. It never displays fabricated applications or live topic data.

The only manual backend setup is running the SQL, configuring email confirmation, and signing up to claim the first admin. Optional production URL configuration is needed when deploying or using email confirmation.
#   d e m o - s i t - w e b - b i l a l - b l i l  
 