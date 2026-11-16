# spa-website

A spa website with real-time online reservations. Guests choose a treatment, pick a free time, enter their details and are confirmed instantly, with no account. Staff manage bookings, opening hours, time off and the treatment menu at `/admin`.

Built with Next.js, Tailwind CSS and Supabase. Everything runs on free tiers.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. The site needs a `.env.local` file; copy `.env.example` and fill it in.

| Command | What it does |
|---|---|
| `npm run dev` | Start the site locally |
| `npm run build` | Production build |
| `npm test` | Unit tests |
| `npm run test:e2e` | Browser test: books a treatment and cancels it again (uses the connected database) |
| `npm run lint` | Lint |

## Before launch: replace the placeholders

1. **Business details** in `src/content/site.ts`: name, phone, email, address, and `mapQuery` (turns on the map on the Visit page).
2. **Treatments, therapists and opening hours** in the staff admin at `/admin`.
3. **Photos** in `public/images/`. The current ones are free stock photos from Unsplash.
4. **Page wording** in `src/app/(site)/` (home, about, policies).

## Staff admin

Staff sign in at `/admin` with a Supabase account that has been given access:

1. In the Supabase dashboard, open Authentication → Users → Add user, and create the staff member with an email and password.
2. In the SQL editor, run (with their email):

   ```sql
   insert into admins (user_id) select id from auth.users where email = 'staff@example.com';
   ```

Also turn off public sign-ups under Authentication → Sign In / Providers, since guests never need accounts.

## Confirmation emails

Emails are sent through a Gmail account. Turn on 2-step verification for that account, create an app password at https://myaccount.google.com/apppasswords, and put the address and app password in `GMAIL_USER` and `GMAIL_APP_PASSWORD`. While these are blank, bookings still work and emails are skipped.

## Database

The schema is in `supabase/migrations/0001_booking.sql` and sample data in `supabase/seed.sql`. To set up a fresh Supabase project, paste each file into the SQL editor in that order, then put the project URL and publishable key in `.env.local`.

How double-booking is prevented: the `bookings` table has a database constraint that forbids two live bookings for the same therapist from overlapping. If two guests confirm the same time at the same moment, one succeeds and the other is asked to choose another time.

Booking rules (slot length, minimum notice, how far ahead guests can book, cancellation window) are in the single row of the `settings` table. If you change `cancel_window_hours`, change `cancelWindowHours` in `src/content/site.ts` to match, as that is the number shown in the wording.

Supabase pauses free projects after about a week of no activity. `.github/workflows/keepalive.yml` pings the database daily; add `SUPABASE_URL` and `SUPABASE_ANON_KEY` as repository secrets on GitHub to switch it on.

## Deploying (Netlify, free)

1. Push this repository to GitHub.
2. In Netlify: Add new site → Import from Git → pick the repository. The build settings are detected automatically.
3. Under Site configuration → Environment variables, add everything from `.env.local`, with `NEXT_PUBLIC_SITE_URL` set to the site's real address.

## Where things are

- `src/app/(site)/` public pages and the booking flow
- `src/app/admin/` staff admin
- `src/components/booking/` the four booking steps, date and time picker, manage-booking screen
- `src/lib/booking.ts` server actions that create, move and cancel bookings
- `src/lib/admin-actions.ts` staff actions
- `src/app/globals.css` design tokens (colours, fonts, spacing)
