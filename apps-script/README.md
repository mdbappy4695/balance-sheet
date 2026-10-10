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
