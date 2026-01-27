# Gandul.ro Scraper Setup Guide

This guide will help you scrape articles from Gandul.ro and store them in Strapi, then access them via GraphQL.

## Prerequisites

- Node.js 20.x (use `nvm use` to switch to the correct version)
- Strapi instance running
- API token from Strapi

## Setup Steps

### 1. Switch to Node 20

```bash
nvm use
```

### 2. Install Dependencies

Dependencies are already installed (cheerio and axios).

### 3. Create Strapi API Token

1. Start your Strapi server:
   ```bash
   npm run develop
   ```

2. Navigate to: http://localhost:1337/admin

3. Go to **Settings** → **API Tokens** → **Create new API Token**

4. Configure the token:
   - **Name**: Scraper Token
   - **Token duration**: Unlimited (or set expiration)
   - **Token type**: Full access (or custom with permissions for Article)

5. Copy the generated token

### 4. Set Environment Variables

Create a `.env` file in the project root or export variables:

```bash
export STRAPI_API_URL="http://localhost:1337/api"
export STRAPI_API_TOKEN="your-api-token-here"
```

Or create a `.env` file:
```
STRAPI_API_URL=http://localhost:1337/api
STRAPI_API_TOKEN=your-api-token-here
```

### 5. Enable GraphQL

GraphQL plugin is already installed. To configure it:

1. Go to **Settings** → **GraphQL** in Strapi admin
2. Enable GraphQL playground (optional, for testing)
3. Configure permissions for Article content type:
   - Go to **Settings** → **Users & Permissions** → **Roles** → **Public**
   - Under **Article**, enable: `find`, `findOne`
   - Save

### 6. Run the Scraper

```bash
node scripts/scrape-gandul.js
```

The scraper will:
- Fetch article links from Gandul.ro homepage
- Scrape each article's content
- Save articles to Strapi (avoiding duplicates)
- Display progress and summary

## Using GraphQL

### Access GraphQL Playground

1. Start Strapi: `npm run develop`
2. Open: http://localhost:1337/graphql

### Example GraphQL Queries

**Get all articles:**
```graphql
query {
  articles {
    data {
      id
      attributes {
        title
        description
        author
        publishedDate
        category
        tags
        featuredImage
        sourceUrl
      }
    }
  }
}
```

**Get single article:**
```graphql
query {
  article(id: 1) {
    data {
      id
      attributes {
        title
        content
        author
        publishedDate
      }
    }
  }
}
```

**Filter articles by category:**
```graphql
query {
  articles(filters: { category: { eq: "Politics" } }) {
    data {
      id
      attributes {
        title
        category
        publishedDate
      }
    }
  }
}
```

**Search articles:**
```graphql
query {
  articles(filters: { title: { contains: "search term" } }) {
    data {
      id
      attributes {
        title
        description
      }
    }
  }
}
```

**Pagination:**
```graphql
query {
  articles(pagination: { page: 1, pageSize: 10 }) {
    data {
      id
      attributes {
        title
      }
    }
    meta {
      pagination {
        page
        pageSize
        total
        pageCount
      }
    }
  }
}
```

**Sorting:**
```graphql
query {
  articles(sort: "publishedDate:desc") {
    data {
      id
      attributes {
        title
        publishedDate
      }
    }
  }
}
```

## Customizing the Scraper

The scraper uses CSS selectors to extract data. If Gandul.ro changes their HTML structure, you may need to update the selectors in `scripts/scrape-gandul.js`:

### Key functions to customize:

1. **`fetchArticleLinks()`** - Modify the selector to find article links
2. **`scrapeArticle()`** - Update selectors for:
   - Title: `h1`, `meta[property="og:title"]`
   - Description: `meta[name="description"]`
   - Content: `article`, `.article-content`
   - Author: `meta[name="author"]`, `.author`
   - Date: `meta[property="article:published_time"]`, `time[datetime]`
   - Category: `meta[property="article:section"]`
   - Image: `meta[property="og:image"]`

## Scheduling Automatic Scraping

### Using Cron (Linux/Mac):

```bash
# Edit crontab
crontab -e

# Add this line to run every hour:
0 * * * * cd /path/to/strapi_article && source ~/.nvm/nvm.sh && nvm use 20 && STRAPI_API_TOKEN="your-token" node scripts/scrape-gandul.js >> logs/scraper.log 2>&1
```

### Using Node Schedule:

Install node-schedule:
```bash
npm install node-schedule
```

Create `scripts/scheduled-scraper.js`:
```javascript
const schedule = require('node-schedule');
const { scrapeGandul } = require('./scrape-gandul');

// Run every hour
schedule.scheduleJob('0 * * * *', async () => {
  console.log('Running scheduled scrape...');
  await scrapeGandul();
});

console.log('Scheduler started. Will scrape every hour.');
```

Run it:
```bash
node scripts/scheduled-scraper.js
```

## Troubleshooting

### Scraper not finding articles
- Check if Gandul.ro changed their HTML structure
- Update CSS selectors in `scrapeArticle()` function
- Use browser DevTools to inspect the page structure

### GraphQL not returning data
- Check permissions in Settings → Users & Permissions
- Ensure articles are published (not drafts)
- Verify GraphQL endpoint is enabled

### API Token errors
- Regenerate token in Strapi admin
- Ensure token has correct permissions
- Check environment variable is set correctly

## API Endpoints

Besides GraphQL, you can also use REST API:

**GET** `/api/articles` - Get all articles
**GET** `/api/articles/:id` - Get single article
**POST** `/api/articles` - Create article (requires auth)
**PUT** `/api/articles/:id` - Update article (requires auth)
**DELETE** `/api/articles/:id` - Delete article (requires auth)

## Next Steps

1. Customize scraper selectors for accurate data extraction
2. Set up scheduled scraping (cron or node-schedule)
3. Build a frontend application that consumes the GraphQL API
4. Add more content types if needed (categories, authors, etc.)
5. Implement webhooks for real-time updates
6. Add media upload for images (instead of just storing URLs)

## Notes

- The scraper includes a 1-second delay between requests to avoid overwhelming the server
- Duplicate articles are prevented using the `sourceUrl` field
- Adjust the article limit in `fetchArticleLinks()` for testing vs production
- Consider adding error handling and retry logic for production use
