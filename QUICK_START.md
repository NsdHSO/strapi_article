# Quick Start Guide - Gandul.ro Scraper

Get up and running in 5 minutes!

## Step 1: Switch to Node 20

```bash
nvm use
```

## Step 2: Start Strapi

```bash
npm run develop
```

Wait for Strapi to start, then open: http://localhost:1337/admin

## Step 3: Create Admin Account (First Time Only)

If this is your first time, create an admin account at http://localhost:1337/admin/auth/register-admin

## Step 4: Create API Token

1. In Strapi Admin, go to **Settings** → **API Tokens**
2. Click **Create new API Token**
3. Fill in:
   - Name: `Scraper Token`
   - Token duration: `Unlimited`
   - Token type: `Full access`
4. Click **Save**
5. **COPY THE TOKEN** (you won't see it again!)

## Step 5: Set Environment Variable

Open a new terminal and set the token:

```bash
export STRAPI_API_TOKEN="paste-your-token-here"
```

Or create a `.env` file:
```
STRAPI_API_TOKEN=your-token-here
```

## Step 6: Enable GraphQL Permissions

1. In Strapi Admin, go to **Settings** → **Users & Permissions** → **Roles**
2. Click on **Public**
3. Scroll down to **Article**
4. Check: `find` and `findOne`
5. Click **Save**

## Step 7: Run the Scraper

```bash
npm run scrape:gandul
```

You should see:
```
🚀 Starting Gandul.ro scraper...
📡 Fetching article links...
Found X article links
[1/X] Scraping: https://...
✓ Saved: Article Title
...
```

## Step 8: Test GraphQL

1. Open: http://localhost:1337/graphql
2. Paste this query:

```graphql
query {
  articles {
    data {
      id
      attributes {
        title
        author
        publishedDate
      }
    }
  }
}
```

3. Click the Play button ▶️

You should see your scraped articles!

## Step 9: View in Strapi Admin

1. Go to http://localhost:1337/admin
2. Click **Content Manager** → **Article**
3. See all your scraped articles

## Next Steps

- Check `SCRAPER_SETUP.md` for detailed documentation
- See `graphql-queries-examples.md` for more GraphQL queries
- Customize the scraper selectors if needed
- Build a frontend app that uses the GraphQL API

## Troubleshooting

**Scraper shows errors:**
- Make sure `STRAPI_API_TOKEN` is set correctly
- Check that Strapi is running on port 1337
- Verify the token has full access permissions

**GraphQL returns empty data:**
- Run the scraper first: `npm run scrape:gandul`
- Check permissions: Settings → Users & Permissions → Public → Article
- Make sure articles are published (not drafts)

**Node version error:**
- Run `nvm use` to switch to Node 20
- If you don't have nvm, install it first

## Commands Cheat Sheet

```bash
# Start Strapi
npm run develop

# Run scraper
npm run scrape:gandul

# Switch Node version
nvm use

# View articles in terminal (requires jq)
curl http://localhost:1337/api/articles | jq
```

## Support

If you encounter issues:
1. Check that Strapi is running
2. Verify API token is set
3. Check permissions for Article content type
4. Look at scraper logs for errors
5. Inspect Gandul.ro page structure (it may have changed)

Happy scraping! 🚀
