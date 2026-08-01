# Table Order & Kitchen Tracking System

A Swiggy/Zomato-style **table ordering system** for a single restaurant/cafe:

- Customer scans/opens a link → enters **table number** → sees the **menu** →
  adds to **cart** → pays via **Razorpay (online)** or **Pay at Counter** →
  tracks live order status: `Placed → Accepted → Preparing → Served`.
- Owner/admin app: manage **tables**, **categories**, **menu items** (with camera/gallery
  image upload, seasonal items, time-windowed availability), accept/update orders,
  print a **58mm thermal bill**, manage counter payments, edit **shop name/address/timings**,
  change the **site's theme color**, and run **promo codes** (first N customers,
  first-time-only, % or flat discount).

---

## ⚠️ Read this before you deploy

**1. InfinityFree cannot run this Node.js server.**
InfinityFree's free plan only hosts static files and PHP — it does not run persistent
Node.js processes, WebSockets, or `npm` apps. You must host the `server/` folder
somewhere that runs Node, for example:
- [Render](https://render.com) (free web service tier)
- [Railway](https://railway.app)
- [Fly.io](https://fly.io)
- A cheap VPS

You can still keep your **database** on InfinityFree (see below), and you can host the
static `client/` folder (customer + admin pages) on InfinityFree if you like, since
those are plain HTML/CSS/JS.

**2. InfinityFree's free MySQL usually blocks remote connections by default.**
Since your Node backend will run on a *different* server than InfinityFree, it needs
to connect to MySQL remotely. In your InfinityFree control panel look for
**"MySQL Databases" → "Remote MySQL"** and add the IP address of wherever you deploy
the Node app. If your free plan doesn't allow remote MySQL at all (some don't), use a
free Node-friendly MySQL host instead, e.g. **Railway MySQL**, **Aiven**, or
**Clever Cloud** — the schema in `server/db/schema.sql` works identically on any of them.
Just swap the values in `.env`.

**3. Fill in the blanks in `.env`.**
You gave me:
```
DB_USER=if0_42310932
DB_PASSWORD=Velocity6097
```
I don't have your **DB host** or **database name** — find these in phpMyAdmin /
InfinityFree's "MySQL Databases" page (host usually looks like `sqlXXX.infinityfree.com`,
db name usually looks like `if0_42310932_yourdbname`). Fill them into `server/.env`.
A real `.env` file (with the values above pre-filled) is already included for your
convenience — **do not commit it to a public GitHub repo**, it's in `.gitignore`.

---

## Folder structure

```
restaurant-app/
├── server/                 # Node.js + Express + Socket.io API
│   ├── src/
│   │   ├── config/         # db.js, razorpay.js
│   │   ├── middleware/     # auth.js (admin JWT), upload.js (multer)
│   │   ├── utils/          # order numbers, counter codes, promo engine
│   │   ├── controllers/    # business logic per resource
│   │   ├── routes/         # index.js — all API routes
│   │   ├── sockets/        # real-time order status events
│   │   └── app.js / server.js
│   ├── db/
│   │   ├── schema.sql      # import this in phpMyAdmin first
│   │   └── seed.sql        # default admin login + sample data
│   ├── uploads/menu/       # uploaded menu photos
│   ├── package.json
│   └── .env / .env.example
└── client/
    ├── customer/           # table entry → menu → cart → checkout → track
    └── admin/              # login → dashboard/kitchen board → tables/menu/
                             # categories/settings/billing
```

## Setup

```bash
cd server
npm install
cp .env.example .env      # fill in DB + Razorpay keys (or edit the pre-filled .env)
```

Import the schema:
1. Open phpMyAdmin on InfinityFree (or your chosen MySQL host).
2. Create the database (or use the one InfinityFree gave you).
3. Import `server/db/schema.sql`, then `server/db/seed.sql`.
   - Seed creates an admin login: **username `admin` / password `admin123`** — change
     this immediately from the admin Settings page (or directly in the DB) after first login.

Run the server:
```bash
npm run dev      # nodemon, local development
npm start         # production
```

**That's it — one command runs everything.** The Node server now serves the API *and*
both static client apps itself, so you never need a second terminal or a separate
static file server:
- Customer app: `http://<host>:4000/`
- Admin app: `http://<host>:4000/admin/login.html`

On your phone (same WiFi as your PC), replace `<host>` with your computer's LAN IP,
e.g. `http://192.168.0.104:4000/`. No `window.API_BASE` editing needed anymore either —
it defaults to "whatever address loaded this page," so it works identically from
`localhost`, your LAN IP, or a real deployed domain.

Only set `window.API_BASE` (top of `client/customer/js/api.js` and
`client/admin/js/api.js`) if you ever host the client files on a *different* server
than the API — e.g. client on Netlify, API on Render.

## Razorpay

1. Sign up at [razorpay.com](https://razorpay.com), grab your **Key ID** and **Key Secret**
   from Dashboard → Settings → API Keys (use **Test Mode** keys while developing).
2. Put them in `server/.env` as `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`.
3. The customer checkout page loads Razorpay's Checkout.js and calls your backend to
   create an order + verify the payment signature — no card details ever touch your server.
4. "Pay at Counter" skips Razorpay entirely: the customer gets a code like
   `CNTR-215869`; the counter/admin billing screen looks it up and marks it
   Paid / Declined / switches the method (e.g. to cash).

## Thermal (58mm) bill printing

`client/admin/receipt.html?order=123` renders a receipt sized for 58mm thermal
printers using an `@page { size: 58mm auto; }` print stylesheet. Click **Print Bill**
in the order board or billing screen — it opens this page and calls `window.print()`.
Most 58mm thermal printers register as a normal system printer, so the browser
print dialog works directly; just select the thermal printer there.

## What's implemented vs. what to extend

**Implemented:** table validation, full menu CRUD w/ image upload (camera + gallery),
categories CRUD, cart→order flow, live order status via Socket.io, Razorpay online
payment + verification, pay-at-counter flow with counter codes, promo code engine
(first-N-customers, first-time-only via phone number, % / flat, min order amount,
expiry, usage limits), shop settings (name/address/timings/theme color, applied live
via a CSS variable), thermal receipt print view, JWT-protected admin API, single-command
startup (Node serves the API and both client apps together), customer bottom nav
(Menu / Orders / Cart), sticky search + category quick-jump chips on the menu, a
tap-to-switch table chip, an Orders tab with session order history, and a downloadable
customer-facing digital invoice (separate from the kitchen's 58mm receipt). The admin
app uses a slide-out drawer for navigation on mobile instead of a cramped bottom bar.

**Streamlined kitchen flow:** Accept jumps straight from "New Orders" to "Preparing"
(no separate Accepted step). Marking an order Served auto-completes it immediately if
payment is already collected — and marking payment paid on an already-Served order
does the same in reverse — so there's no manual "Complete & Bill" click needed for the
normal paid case. The Served column only ever holds orders still awaiting payment.

**All icons are Lucide** (via the CDN script + `data-lucide` attributes), no emoji
anywhere in the UI.

**Realtime sync beyond orders:** the server broadcasts over Socket.io whenever the menu,
shop settings, tables, categories, or promo codes change, so every open customer tab and
every admin device picks it up within moments — no page refresh needed. For example, if
you mark a dish unavailable, a customer already viewing the menu sees it disappear live.

**Good next additions:** multi-admin roles (waiter vs owner), order history/analytics
dashboard, SMS/WhatsApp notifications on status change, multi-branch support, offline
queueing if wifi drops mid-order.
