# Apps Script setup (Restricted sheet OK)

The website loads data through this Web app (**Execute as: Me**), so the Google Sheet can stay **Restricted**. Public “Anyone with the link” is not required.

## Install / update

1. Open your balance Google Sheet (as an account that can edit it, e.g. `mdbappy4605@gmail.com`).
2. **Extensions → Apps Script**.
3. Paste [`Code.gs`](Code.gs) (replace old code).
4. Set `ADMIN_PASSWORD` (same as `ADMIN_PASSWORD` in `script.js`).
5. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Copy the `/exec` URL into `script.js` as `ADMIN_API_URL`.
7. Open that `/exec` URL once → **Allow**.
8. After any later change to `Code.gs`:  
   **Deploy → Manage deployments → ✎ Edit → Version: New version → Deploy**

## Actions

| Action | Password | Purpose |
|--------|----------|---------|
| `list` | No | Read all members (public site) |
| `setPayments`, `addMember`, … | Yes | Admin writes |

## Vercel

Redeploy the site after updating `script.js` / `ADMIN_API_URL`.

## If the site shows Offline / Failed to fetch

That almost always means the `/exec` URL is old or the deployment was never finished:

1. Sheet → **Extensions → Apps Script** → paste latest [`Code.gs`](Code.gs)
2. **Deploy → Manage deployments → ✎ → Version: New version → Deploy**  
   (or **Deploy → New deployment** if none exists)
3. Copy the new `/exec` URL into `ADMIN_API_URL` in `script.js`
4. Open `/exec` in the browser once → **Allow**
5. Redeploy Vercel

Test in browser: open `YOUR_EXEC_URL` — you should see a JSON message (not “doGet not found”).  
Then open `YOUR_EXEC_URL?action=list` — `"ok":true` and `members`.

The website loads data with **POST** `{ "action": "list" }` (no password). Browser GET is only for smoke tests.
