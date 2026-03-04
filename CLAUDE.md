# CloserMetrix Landing Page

## Dev Server

Always run the Vite dev server on **port 3000**:

```bash
npm run dev
```

The server runs at http://localhost:3000

## Demo Booking Link

All CTAs use "Book a Demo" linking to: https://calendar.app.google/42Lw245o4mHrd35j9

Do NOT use "Join Waitlist" — always use "Book a Demo" with the link above.

## Lead Capture Popup

All "Book a Demo" buttons open a modal popup (DemoModal.jsx) that collects:
- Name (required)
- Email and/or Phone (at least one required)

On submit:
1. Sends email notification via EmailJS to closermetrix@jtylerray.com
2. n8n webhook for sheet logging (TODO: needs Google Sheets OAuth in n8n)
3. Redirects to Google Calendar booking page

Credentials are in `.env` (gitignored). Restart dev server after changing `.env`.

## Logo

Use the `logo_wide_3-removebg-preview.png` (transparent background version). It's deployed as `public/logo.png` and `public/logo-full.png`.
