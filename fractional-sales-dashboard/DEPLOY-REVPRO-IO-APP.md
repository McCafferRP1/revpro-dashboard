# Put the dashboard at www.revpro.io/app

Your main site is at **www.revpro.io** (Squarespace domain, hosted on Netlify). This app is set up to run at **www.revpro.io/app**.

---

## Step 1: Deploy the dashboard as a second Netlify site

1. In Netlify: **Add new site** → **Import an existing project** → connect your Git and pick the repo that contains this app.
2. **Build settings**
   - **Base directory:**  
     - Repo is only this app → leave empty.  
     - Repo is e.g. Matt-Projects with this folder inside → set to `fractional-sales-dashboard`.
   - **Build command:** `npm run build`
   - **Publish directory:** leave default (Netlify handles Next.js).
3. **Environment variables**
   - Add `SESSION_SECRET` (long random string, e.g. `openssl rand -hex 32`).
   - Add `NEXT_PUBLIC_BASE_PATH` = `/app` (so redirects and cookie path use `/app`).
4. Deploy. Note the site URL Netlify gives you, e.g. `https://revpro-dashboard.netlify.app`.

---

## Step 2: Proxy /app on your main site (www.revpro.io)

Your **main** Netlify site (the one that has the custom domain www.revpro.io) must send all `/app` traffic to the dashboard site.

1. Open the **main** site in Netlify (the one with domain www.revpro.io).
2. In the repo for that site, add or edit **netlify.toml** (in the root of whatever that repo is).

Add this (replace the URL with your dashboard site’s Netlify URL):

```toml
# Send /app/* to the dashboard app (second Netlify site)
[[redirects]]
  force = true
  from = "/app/*"
  to = "https://YOUR-DASHBOARD-SITE-NAME.netlify.app/app/:splat"
  status = 200
```

4. Commit and push. Netlify will redeploy the main site.
5. Visit **https://www.revpro.io/app** — you should see the dashboard.

---

### If it doesn't work

- **404 or wrong page:** Check that **From** is exactly `/app/*` and **To** ends with `/app/:splat` and uses the correct dashboard URL.
- **Redirect loop or wrong site:** Make sure you added the redirect on the **main** site (www.revpro.io), not on the revpro-dashboard site.
- **Dashboard shows but assets/links break:** On the **revpro-dashboard** site, ensure `NEXT_PUBLIC_BASE_PATH` is set to `/app` and you've redeployed that site.

---

## Step 3: Optional – hide the dashboard’s default Netlify URL

If you don’t want people to use the `*.netlify.app` URL:

1. On the **dashboard** site in Netlify: **Site configuration** → **Domain management**.
2. You can leave the Netlify URL as-is (only people who know it can use it), or set **Netlify subdomain** to something like `revpro-app` so the URL is `revpro-app.netlify.app`.

You don’t need to attach www.revpro.io to the dashboard site; the main site proxy is enough for **www.revpro.io/app**.

---

## Summary

| What | Where |
|------|--------|
| Main site | www.revpro.io (existing Netlify site) |
| Dashboard app | Second Netlify site (e.g. revpro-dashboard.netlify.app) |
| User-facing URL | **www.revpro.io/app** (via redirect on main site) |

The app is built with `basePath: "/app"`, so all its routes are under `/app` (e.g. `/app/login`, `/app/dashboard`).
