# Deploy the RevPro Dashboard — Simple Version

Your app is already on Netlify. To get the **new code** live, do these 3 things.

---

## Step 1: Add one new secret in Netlify

1. Go to **https://app.netlify.com** and open your **dashboard site** (the one for this app).
2. Click **Site configuration** → **Environment variables**.
3. Click **Add a variable** or **New variable**.
4. Name: **`MIRA_API_SECRET`**
5. Value: any long random string. To get one:
   - Open PowerShell and run:  
     `[System.Convert]::ToHexString((1..32 | ForEach-Object { [byte](Get-Random -Maximum 256) }))`
   - Copy the result and paste it as the value.
6. Click **Save** or **Create**.

---

## Step 2: Push your code to Git

1. Open a terminal in your project folder (e.g. `Matt-Projects` or `fractional-sales-dashboard`).
2. Run:

```bash
git add .
git commit -m "Update dashboard"
git push
```

(Use your usual branch name if needed, e.g. `git push origin main`.)

---

## Step 3: Let Netlify deploy

- If Netlify is set to deploy on push, it will deploy automatically after Step 2.
- If not: in Netlify go to **Deploys** → **Trigger deploy** → **Deploy site**.

Wait for the deploy to finish. Your new code is live.

---

## Optional: Use www.revpro.io/app instead of the Netlify URL

Only do this if you have a **second** Netlify site for **www.revpro.io** and you want people to open the dashboard at **https://www.revpro.io/app**.

1. In the **root** of your repo there is a file **`netlify.toml`**.
2. Open it and find the line:  
   `to = "https://YOUR-DASHBOARD-SITE-NAME.netlify.app/app/:splat"`
3. Replace **`YOUR-DASHBOARD-SITE-NAME`** with the first part of your dashboard’s Netlify URL.  
   Example: if your dashboard URL is `https://revpro-dashboard.netlify.app`, change it to:  
   `to = "https://revpro-dashboard.netlify.app/app/:splat"`
4. Save, then run:  
   `git add netlify.toml`  
   `git commit -m "Point revpro.io/app to dashboard"`  
   `git push`

That’s it. Most people only need Steps 1–3.
