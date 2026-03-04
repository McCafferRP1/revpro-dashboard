# Is the deploy working? — Quick checklist

Use the URL where you use the app (e.g. **https://www.revpro.io/app** or **https://your-site.netlify.app/app**).

---

## 1. App loads

- [ ] Open the app URL in your browser.
- [ ] You see either the **login page** or (if already logged in) the **dashboard** (portfolio with clients).
- [ ] No blank page, no 404, no “something went wrong.”

**If it fails:** Check Netlify → Deploys. Last deploy should be “Published.” If build failed, fix the build and redeploy.

---

## 2. Login and main dashboard

- [ ] Log in with your credentials.
- [ ] You land on the **dashboard** (portfolio): list of clients, maybe an account manager filter.
- [ ] Click a **client** → you go to that client’s funnel (or overview).
- [ ] Top nav works: **Dashboard**, **Report**, **Settings** (or similar).

**If it fails:** Check that `SESSION_SECRET` is set in Netlify and you redeployed after adding it.

---

## 3. Funnel and date presets

- [ ] Open a **client** → **Funnel** (or the funnel tab).
- [ ] You see **“This month”** and **“Last month”** preset links (or a date filter).
- [ ] Click **“Last month”** → URL and data (or empty state) update for last month.
- [ ] Click **“This month”** → you’re back to the current month.

**If you don’t have GHL connected for that client:** You should see a clear message like “Connect Go High Level” or “Field Mappings Required” with a link to Settings, not a broken page.

---

## 4. Settings and GHL status

- [ ] Go to **Settings** (global or client-level, depending on your app).
- [ ] For **GHL Integration** you see a status:
  - **Connected** (green), or  
  - **Partially configured** (yellow), or  
  - **Not connected** (red).
- [ ] If you’re an **admin**: you can see (and edit) API key and field mappings.
- [ ] If you’re **not** an admin: you can see status and pipelines but not the key or mapping fields.

**If status is wrong:** Check that the key (and mappings, if required) are saved and that you’ve opened the correct client/settings.

---

## 5. Rep view (if you use reps)

- [ ] From dashboard or client, open a **rep** (closer or setter).
- [ ] Rep page loads with their metrics.
- [ ] For a **setter**, you see a **“Sourced vs Confirmed”** section (or similar) with deals sourced and deals confirmed.

**If it fails:** Confirm you’re on the latest deploy and that the rep has the right role (setter) if that section is role-based.

---

## 6. Mira API (if you use it)

- [ ] You have **MIRA_API_SECRET** set in Netlify (same value you use in Mira).
- [ ] A call to your app with the Mira key works, for example:
  - **GET** `https://your-app-url/app/api/mira/status/CLIENT_ID`  
  - Header: **`X-Mira-Key`** = your `MIRA_API_SECRET`  
  - You get **200** and JSON (e.g. clientId, ghlKeyConfigured, stages), not 401.

**If you get 401:** The request doesn’t have the right `X-Mira-Key` or `MIRA_API_SECRET` in Netlify doesn’t match.

---

## Summary

| Check              | What “working” looks like                          |
|--------------------|----------------------------------------------------|
| App loads          | Login or dashboard, no crash/404                   |
| Login + nav        | Can log in, move between Dashboard / Report / Settings |
| Funnel + presets   | This month / Last month change the view            |
| Settings / GHL     | Status (green/yellow/red), admin vs non-admin correct |
| Rep view           | Rep page loads; setters see Sourced vs Confirmed    |
| Mira API           | Status (or other) endpoint returns 200 with key    |

If all the boxes that apply to you are checked, the deploy is working as intended.
