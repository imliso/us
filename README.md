# Our Little Corner — Lisa & Rani

A static site with a shared photo gallery powered by Supabase. Host the site for free on Netlify, Cloudflare Pages, or GitHub Pages. Supabase stores the friends' accounts, photos, and gallery posts.

## Set up the shared backend

1. Create a project on [Supabase](https://supabase.com).
2. Paste `supabase-schema.sql` into **SQL Editor** in Supabase and click **Run**. This creates the shared gallery table, private photo bucket, access rules, and live updates.
3. In **Project Settings → API**, copy the **Project URL** and **anon/public key** into `config.js`, replacing the sample values.
4. Make sure email sign-ups are enabled in **Authentication → Providers → Email**.
5. In **Authentication → URL Configuration**, set the site URL to your deployed address and add it to the redirect URLs.
6. Deploy this folder to Netlify, Cloudflare Pages, or GitHub Pages. Open the site and choose **New here? Create an account**. All four friends can sign up with their own name and email, then log in to share the gallery. The setup supports more than four accounts too.

The browser uses the anon/public key, which is designed for client-side use. Never put the `service_role` key in this site. Photos live in a private bucket, and every signed-in account can view the shared gallery. Each account can delete only its own posts. **Anyone who can reach the site can create an account and see the gallery**, so only share the site address with people you trust. Email confirmation can stay enabled in Supabase Auth. If you ran an earlier version of `supabase-schema.sql`, run the updated file again to remove the Lisa/Rani-only name limit.

## Preview locally

Open `index.html` for demo mode. For a local server, run `python -m http.server 8000` in this folder and visit `http://localhost:8000`. To use Supabase locally, set the site URL to `http://localhost:8000` and add that address to **Authentication → URL Configuration → Redirect URLs**.

Without Supabase details in `config.js`, the demo still works and keeps new photos in the current browser only. Demo photos are examples and are not added to the shared gallery.
