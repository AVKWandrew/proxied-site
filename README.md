# Proxied website

Landing page + public event calendar + private admin (`/admin`) for adding/editing events.
Plain HTML/CSS/JS — **no build step, no Node needed**. Free to host.

## What's here
```
index.html            public landing page + calendar
admin/index.html      private event manager (sign-in required)
js/config.js          ← shop details + Supabase keys (edit this)
supabase/schema.sql   ← run once to create the database + security rules
assets/ css/ js/      logo, fonts, styles, code
```

## Try it now (demo mode)
With `config.js` Supabase fields empty the site runs on sample events stored in your browser.
Open `index.html` in a browser, or run `python3 -m http.server 8099` in this folder → http://localhost:8099 and http://localhost:8099/admin/

## Go live — one-time setup (~30 min)
1. **Supabase** (database + logins, free): supabase.com → New project (choose a US region).
   - SQL Editor → paste `supabase/schema.sql` → Run.
   - Authentication → Users → **Add user** (boss's email + strong password, tick "auto confirm").
   - Authentication → Sign In / Providers → **turn OFF "Allow new users to sign up"** (important: otherwise anyone could make an admin account).
   - Project Settings → API → copy **Project URL** and **anon public key** into `js/config.js`.
2. **GitHub**: create a repo and upload this folder (or push with git).
3. **Hosting** — recommended: **Cloudflare Pages** (free, unlimited bandwidth, domain + DNS in one place). Vercel or Netlify also work.
   - Connect the GitHub repo, framework = None, build command = empty, output directory = `/`.
4. **Domain**: buy at Cloudflare Registrar (at-cost, cheapest) or GoDaddy, then Pages → Custom domains → add it. HTTPS is automatic.
5. Fill in address, hours, phone, socials in `js/config.js`, push → site updates in seconds.

## Using the admin
Go to `yourdomain.com/admin`, sign in, then add / edit / unpublish / delete events, upload flyers, and tick
"Repeats every week" for things like Wednesday Riftbound (edits apply to the whole series).
All times are Arizona time (no daylight saving).

## Notes
- The anon key in `config.js` is meant to be public; the database rules (RLS) only let the public read published events, and only signed-in admins write.
- Free Supabase projects pause after ~1 week of zero activity; any visits keep it awake.
- Fonts: Tango Sans (body/headings), Accidental Presidency (subtitles). Colors: purple `#531E89`, cyan `#2EB6AB`.
- Future ideas: ticket/registration (Stripe or Eventbrite link field), email list, product/inventory page.
