# Eat-o-Food (Bistro Track) — Backend

Plain PHP + MySQL backend for the customer-facing side of the app
(welcome → menu → cart → tracking). The owner dashboard/settings
pages in the frontend are still static mockups with no logic, so
this backend doesn't touch them yet — `api/settings.php` is there
as a head start whenever that's ready.

## 1. Setup on InfinityFree

### Step 1 — Create the database
1. Log in to the InfinityFree client area → **Control Panel**.
2. Under **Databases**, click **MySQL Databases**.
3. Enter a name (e.g. `eatofood`) → **Create Database**. InfinityFree
   will prefix it automatically, e.g. `epiz_12345678_eatofood`.
4. Set/note the database password when prompted.
5. On the same page, copy down these four values — you'll need
   all of them in Step 3:
   - **DB Hostname** (something like `sql123.infinityfree.com` —
     never `localhost` on shared hosting)
   - **DB Name** (the full prefixed name)
   - **DB Username** (also prefixed, usually same prefix as the DB name)
   - **DB Password** (what you set in step 4)

### Step 2 — Import the schema
1. Next to your new database, click **Admin** — this opens
   phpMyAdmin already pointed at your database.
2. Go to the **Import** tab → **Choose File** → select
   **`database/schema_infinityfree.sql`** (not `schema.sql` —
   that one tries to `CREATE DATABASE`, which shared hosting
   accounts aren't allowed to do; InfinityFree already created
   it for you in Step 1) → **Go**.
3. You should see 5 tables appear: `categories`, `menu_items`,
   `promo_codes`, `orders`, `order_items`, `settings` — with the
   menu and promo code already seeded.

### Step 3 — Upload the backend files
1. In the Control Panel, open **File Manager**.
2. Navigate into `htdocs`. If your frontend will live on the same
   site, upload the frontend files here too (recommended — see
   note below on CORS).
3. Upload `backend.zip` into `htdocs`, then right-click it →
   **Extract**. You should end up with `htdocs/backend/...`.
4. Open `htdocs/backend/config/database.php` in the File Manager's
   editor and replace the 4 placeholder values with what you
   copied in Step 1:
   ```php
   $DB_HOST = 'sql123.infinityfree.com';
   $DB_NAME = 'epiz_12345678_eatofood';
   $DB_USER = 'epiz_12345678';
   $DB_PASS = 'the_password_you_set';
   ```
   Save.

### Step 4 — Verify it's working
Visit `https://yoursite.infinityfreeapp.com/backend/` in a real
browser tab (important — see the CORS/anti-bot note below). You
should see the JSON endpoint list. Then check
`https://yoursite.infinityfreeapp.com/backend/api/menu.php` — you
should see the full seeded menu.

Also visit
`https://yoursite.infinityfreeapp.com/backend/api/_diagnostics/check.php`.
It checks your DB connection and, importantly, whether outbound
`curl` requests work on your account at all — **delete this file
once you've confirmed it looks good**, don't leave a diagnostics
endpoint live.

## 2. Two InfinityFree quirks worth knowing about

**Outbound curl to Razorpay may be unreliable.** InfinityFree's
free tier has a long history (visible on their own support forum)
of outbound `curl`/API requests being inconsistent — working fine
for some destination hosts, timing out or failing for others,
sometimes changing without warning. This directly affects
`api/payment/razorpay_order.php`, which calls out to
`api.razorpay.com` to create the order server-side. Run the
diagnostics script above right after uploading — if
`outbound_curl_to_razorpay` shows `reached_server: false`, that's
a hosting limitation, not a bug in the code, and Razorpay's
server-side order creation won't work reliably on this plan. If
that happens, your options are: upgrade to InfinityFree's paid
tier, host just the payment endpoint somewhere else, or fall back
to "Pay at Counter" as the primary flow for now (already supported
by the existing UI, no code changes needed).

**Free hosting has anti-bot protection that can affect testing.**
InfinityFree runs a security layer that can block non-browser
traffic (Postman, `curl` on your own machine) hitting the live
site. Real `fetch()` calls made from JavaScript running in an
actual browser tab — which is exactly how your frontend will call
this API — aren't affected. But if you're testing an endpoint
directly with Postman/curl and get a strange response, try opening
the same URL in a normal browser tab first.

**Recommended layout to sidestep CORS entirely:** put the frontend
files directly in `htdocs/` and this backend in `htdocs/backend/`,
both on the same InfinityFree site. Then the frontend can call
`/backend/api/menu.php` as a same-origin relative path — no CORS,
no cross-domain cookie issues, one less thing to debug. The CORS
headers in `includes/cors.php` are still there and harmless if you
end up hosting the frontend elsewhere instead.

## 3. Testing locally first (optional, recommended)

Before touching InfinityFree, you can test everything with XAMPP/
Laragon locally: swap `config/database.php` values to
`host=localhost, name=eat_o_food, user=root, pass=''`, import
`database/schema.sql` (the version with `CREATE DATABASE`, made
for local use) via your local phpMyAdmin, done. This lets you
confirm all the logic works before dealing with shared-hosting
specifics.


## 4. Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/menu.php` | Full menu, grouped by category |
| GET | `/api/settings.php` | Restaurant name, address, hours, UPI id |
| POST | `/api/promo/validate.php` | Check a promo code before applying it |
| POST | `/api/orders/create.php` | Place an order (computes the bill server-side) |
| GET | `/api/orders/get.php?id=1` | One order + items + live status |
| GET | `/api/orders/list.php?table=12` | Order history for a table |
| POST | `/api/payment/razorpay_order.php` | Create a Razorpay order for an existing order |
| POST | `/api/payment/razorpay_verify.php` | Verify the Razorpay payment signature |

All responses are JSON: `{"success": true, ...}` or
`{"success": false, "error": "..."}`.

### Example: create an order

```
POST /api/orders/create.php
{
  "table_number": "12",
  "items": [
    { "id": 1, "quantity": 2 },
    { "id": 4, "quantity": 3 }
  ],
  "promo_code": "WELCOME20",
  "payment_method": "UPI"
}
```

Note what's **not** in that payload: item names or prices. The
server looks those up from the database itself, so a modified
request from the browser console can't change what anyone gets
charged.

## 5. Connecting the existing frontend

Right now `menu.html`, `cart.html`, and `tracking.html` use
hardcoded HTML and `localStorage` for everything. To make them
live:

- **menu.html** — replace the hardcoded `<div class="food-item">`
  blocks with ones built from `fetch('/backend/api/menu.php')`
  (relative path — works as-is if frontend and backend share the
  same InfinityFree site as suggested above).
- **cart.html** — on "Pay", first `POST /api/orders/create.php`
  to get a real `order_id` and trusted `total`, *then* call
  `/api/payment/razorpay_order.php` with that `order_id` to get a
  `razorpay_order_id` before opening the Razorpay widget. After
  the widget succeeds, call `/api/payment/razorpay_verify.php`
  with the three values Razorpay's handler gives you
  (`razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`)
  — only then is the order actually marked paid.
- **tracking.html** — swap the `persistentStore.getItem('orderHistory')`
  read for `fetch('/api/orders/list.php?table=' + tableNumber)`.

Happy to do this rewiring next if you want — just say the word.

## 6. Razorpay key secret

`config/razorpay.php` has a placeholder for `RAZORPAY_KEY_SECRET`.
Grab your test secret from the Razorpay dashboard (Settings → API
Keys) and paste it in there — never in any `.html` or `.js` file.

## 7. Owner side

Deliberately left out. Once the owner dashboard/menu-manager/settings
screens are finalised, the natural additions are:

- `api/orders/update_status.php` — move an order through
  placed → preparing → ready → completed
- `api/menu/*` — CRUD for menu items (add/edit/disable dishes)
- Some form of login for the owner, since none of the current
  owner mockups have any auth at all
