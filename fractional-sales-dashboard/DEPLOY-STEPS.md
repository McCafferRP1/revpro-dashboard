# How to Deploy the RevPro Dashboard — Step by Step

Follow these steps in order. You’ll create one new Netlify site for the app, then point your main site at it so the app lives at **www.revpro.io/app**.

---

## Part A: Create the dashboard site on Netlify

### Step 1: Log in and start a new site

1. Go to [app.netlify.com](https://app.netlify.com) and log in.
2. Click **“Add new site”** → **“Import an existing project”**.
3. Connect your Git provider (GitHub, GitLab, etc.) if you haven’t already.
4. Choose the **repository** that contains this app (e.g. the repo that has the `fractional-sales-dashboard` folder).

### Step 2: Set the build options

On the “Configure build” screen:

1. **Base directory** (only if your repo has more than this app):
   - If the repo is **only** this app → leave **empty**.
   - If the repo has this app in a folder (e.g. `fractional-sales-dashboard`) → type: **`fractional-sales-dashboard`**.

2. **Build command**  
   - Set to: **`npm run build`**

3. **Publish directory**  
   - Leave as Netlify’s default (often `dist` or empty). Netlify’s Next.js plugin will use the right output.

4. Click **“Deploy site”** (or **“Deploy”**).  
   - The first build might fail until you add env vars in the next step. That’s okay.

### Step 3: Add environment variables

1. In Netlify, open your **new dashboard site** (the one you just created).
2. Go to **Site configuration** → **Environment variables** (or **Site settings** → **Environment variables**).
3. Click **“Add a variable”** or **“New variable”** and add these **one by one**:

| Variable name | What to put |
|---------------|-------------|
| `SESSION_SECRET` | A long random string. See “How to get random secrets” below. |
| `NEXT_PUBLIC_BASE_PATH` | Exactly: **`/app`** |
| `MIRA_API_SECRET` | Another long random string (for Mira API). See below. |

**How to get random secrets**

- On **Mac/Linux**: Open Terminal and run:
  - `openssl rand -hex 32`
  - Copy the output and use it as `SESSION_SECRET`. Run it again and use the second output as `MIRA_API_SECRET`.
- On **Windows** (PowerShell): You can use an online generator and pick a 64-character hex string, or run:
  - `[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])`
  - and use that (or use two different online “random string” generators).

4. **Save** the variables. Then go to **Deploys** and click **“Trigger deploy”** → **“Deploy site”** so the site builds again with the new variables.

### Step 4: Note your dashboard URL

After the deploy finishes:

1. At the top of the Netlify page you’ll see your site URL, e.g. **`https://something.netlify.app`**.
2. Write down or copy that URL (or the “something” part). You’ll need it in Part B.

---

## Part B: Point www.revpro.io/app at the dashboard

Your **main** Netlify site is the one with the domain **www.revpro.io**. You’ll add a rule there that sends all traffic for **/app** to the new dashboard site.

### Step 5: Open your main site’s repo

1. In Netlify, switch to the **site that has the custom domain www.revpro.io** (not the new dashboard site).
2. Find out which **repository** that site is connected to.
3. Open that repository on your computer (clone it if needed).

### Step 6: Add the redirect rule

1. In the **root** of that repository (same folder as where the main site’s files live), find or create a file named **`netlify.toml`**.
2. Open `netlify.toml` in an editor.
3. Add this block (copy it exactly, then change the URL on the `to =` line):

```toml
# Send /app to the RevPro dashboard (second Netlify site)
[[redirects]]
  force = true
  from = "/app/*"
  to = "https://YOUR-DASHBOARD-URL.netlify.app/app/:splat"
  status = 200
```

4. Replace **`YOUR-DASHBOARD-URL`** with the actual URL of your dashboard site from Step 4.  
   - Example: if your dashboard URL is `https://revpro-dashboard.netlify.app`, then the line should be:
   - `to = "https://revpro-dashboard.netlify.app/app/:splat"`

5. Save the file.

### Step 7: Deploy the main site

1. Commit the change: e.g. “Add redirect so /app points to dashboard”.
2. Push to the branch that Netlify deploys (usually `main`).
3. Netlify will automatically redeploy the main site.

### Step 8: Test

1. Open a browser and go to: **https://www.revpro.io/app**
2. You should see the RevPro dashboard (e.g. login or dashboard page).
3. If you see a 404 or wrong page, double-check:
   - The redirect was added in the **main** site’s repo (www.revpro.io), not the dashboard repo.
   - The `to =` URL uses your real dashboard Netlify URL and ends with **`/app/:splat`**.

---

## Quick checklist

- [ ] New Netlify site created from the app’s repo.
- [ ] Base directory set (if repo has multiple projects).
- [ ] Build command: `npm run build`.
- [ ] `SESSION_SECRET` set (long random string).
- [ ] `NEXT_PUBLIC_BASE_PATH` set to `/app`.
- [ ] `MIRA_API_SECRET` set (long random string).
- [ ] Dashboard site deployed successfully.
- [ ] Main site’s repo has `netlify.toml` with the `/app/*` redirect to the dashboard URL.
- [ ] Main site redeployed after the change.
- [ ] https://www.revpro.io/app loads the dashboard.

---

## If something goes wrong

| Problem | What to check |
|--------|----------------|
| Build fails on Netlify | Base directory correct? Build command is `npm run build`? All three env vars set? |
| www.revpro.io/app shows 404 | Redirect is in the **main** site’s `netlify.toml`. `from` is `/app/*`, `to` ends with `/app/:splat`. |
| Page loads but looks broken (no CSS/links) | On the **dashboard** site, set `NEXT_PUBLIC_BASE_PATH` to `/app` and trigger a new deploy. |
| Redirect loop or wrong site | Redirect must be on the **main** site (revpro.io), not on the dashboard site. |

---

*End of steps.*
