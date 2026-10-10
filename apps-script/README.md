# Admin API setup (Google Apps Script)

**Required** — without this URL, Admin Save cannot update the Google Sheet.

1. Open your balance Google Sheet.
2. **Extensions → Apps Script**.
3. Replace the default code with [`Code.gs`](Code.gs).
4. Set `ADMIN_PASSWORD` (same value as `ADMIN_PASSWORD` in `script.js`).
5. **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
6. Copy the `/exec` URL into `script.js` as `ADMIN_API_URL`.
7. Open the site → **Admin** → password → save payments (writes to the sheet + toast).

The public page loads live data on open and auto-updates about every 5 seconds while the tab is visible.
