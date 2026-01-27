# Scraping Articles by Category

The Gandul.ro scraper now supports scraping articles from specific categories!

## Available Categories

Based on the navigation menu from Gandul.ro:

- **politica** - Politică (Politics)
- **actualitate** - Actualitate (Current Affairs)
- **externe** / **international** - Știri externe / International
- **economic** / **financiar** - Economic / Financiar
- **cultura** - Cultură (Culture)
- **sport** - Sport
- **video** - Video
- **comunicate** / **comunicate-de-presa** - Comunicate de Presă
- **evenimente** - Evenimente (Events)

## Quick Start

### Using npm scripts (easiest):

```bash
# Scrape from ALL categories (5 articles per category)
npm run scrape:all

# Scrape from Politică (10 articles)
npm run scrape:politica

# Scrape from Sport (10 articles)
npm run scrape:sport

# Scrape from Actualitate (10 articles)
npm run scrape:actualitate
```

### Using command line options (advanced):

```bash
# Scrape from homepage (default behavior)
npm run scrape:gandul

# Scrape from specific categories
node scripts/scrape-gandul.js --categories politica,sport

# Scrape from all categories with 5 articles each
node scripts/scrape-gandul.js --categories all --limit 5

# Scrape 15 articles from Actualitate
node scripts/scrape-gandul.js --categories actualitate --limit 15

# Scrape from multiple categories with custom limit
node scripts/scrape-gandul.js --categories politica,sport,cultura --limit 20
```

## Options

### `--categories <categories>`

Specify which categories to scrape from:
- Single category: `--categories politica`
- Multiple categories (comma-separated): `--categories politica,sport,cultura`
- All categories: `--categories all`

### `--limit <number>`

Number of articles to scrape per category:
- Default: `10` articles per category
- Example: `--limit 5` to scrape 5 articles from each category

### `--help` or `-h`

Show help message with all available options

## Examples

### 1. Scrape Latest News from Politics and International

```bash
node scripts/scrape-gandul.js --categories politica,international --limit 20
```

### 2. Quick Sample from All Categories

```bash
npm run scrape:all
# or
node scripts/scrape-gandul.js --categories all --limit 3
```

### 3. Deep Dive into Sports

```bash
node scripts/scrape-gandul.js --categories sport --limit 50
```

### 4. Multiple Categories for News App

```bash
node scripts/scrape-gandul.js --categories actualitate,politica,international,sport --limit 15
```

## What Happens During Scraping

1. **Category Pages**: Scraper visits each category page (e.g., `/politica`)
2. **Article Detection**: Finds article links on the category page
3. **Content Extraction**: Scrapes each article using improved selectors:
   - Title from `.single__title h1`
   - Content from `.single__text`
   - Author from `.single__meta a[href*="/autor/"]`
   - Category from `.single__breadcrumbs a`
   - Featured image from `.single__media img`
4. **Validation**: Ensures articles have title and substantial content
5. **Duplicate Check**: Skips articles already in your database
6. **Save to Strapi**: Stores valid articles via API

## Improvements Made

### ✅ Fixed CSS Selectors

The scraper now uses the correct selectors for Gandul.ro:
- `.single__title h1` for article title
- `.single__text` for article content
- `.single__meta` for author information
- `.single__breadcrumbs` for category

### ✅ Category-Based Scraping

You can now target specific categories instead of just the homepage

### ✅ Better Validation

Articles are validated before saving:
- Must have a title (min 5 characters)
- Must have substantial content (min 50 characters)
- Fields are truncated to prevent database errors

### ✅ Duplicate Prevention

Articles with the same `sourceUrl` are automatically skipped

### ✅ Better Reporting

The scraper now shows:
- Successfully saved articles
- Skipped duplicates
- Errors/failures

## Scheduling Regular Scraping

### Option 1: Cron Job (Linux/Mac)

```bash
# Edit crontab
crontab -e

# Add this line to scrape all categories every 6 hours
0 */6 * * * cd /path/to/strapi_article && source ~/.nvm/nvm.sh && nvm use 20 && STRAPI_API_TOKEN="your-token" npm run scrape:all >> logs/scraper.log 2>&1
```

### Option 2: Node Schedule

Install node-schedule:
```bash
npm install node-schedule
```

Create `scripts/scheduled-scraper.js`:
```javascript
const schedule = require('node-schedule');
const { scrapeGandul } = require('./scrape-gandul');

// Scrape every 6 hours
schedule.scheduleJob('0 */6 * * *', async () => {
  console.log('Running scheduled scrape...');
  await scrapeGandul({
    categories: ['politica', 'actualitate', 'international', 'sport'],
    articlesPerCategory: 10
  });
});

console.log('Scheduler started. Will scrape every 6 hours.');
```

Run it:
```bash
node scripts/scheduled-scraper.js
```

## Querying by Category in GraphQL

Once articles are scraped, query them by category:

```graphql
query GetPoliticsArticles {
  articles(
    filters: { category: { containsi: "politic" } }
    sort: "publishedDate:desc"
    pagination: { limit: 10 }
  ) {
    data {
      id
      attributes {
        title
        description
        author
        publishedDate
        category
        featuredImage
      }
    }
  }
}
```

## Troubleshooting

### No articles found in category

- Check that the category slug is correct
- Some category pages might have different structures
- Try with `--limit 20` to find more articles

### Articles not saving

- Ensure `STRAPI_API_TOKEN` is set
- Check Strapi is running (`npm run develop`)
- Verify API token has full access permissions

### Too many duplicates

- Articles are only saved once (based on `sourceUrl`)
- This is expected behavior to prevent duplicates

### Low success rate

- The scraper validates articles before saving
- Only articles with substantial content are saved
- Category/navigation pages are automatically skipped

## Next Steps

1. Set up scheduled scraping for continuous updates
2. Create a frontend that displays articles by category
3. Add search functionality using GraphQL
4. Implement pagination for large category results
5. Add webhooks to notify when new articles are added

## Support

Run `node scripts/scrape-gandul.js --help` for quick reference of all options.

Check the main documentation:
- `QUICK_START.md` - Initial setup
- `SCRAPER_SETUP.md` - Detailed scraper documentation
- `graphql-queries-examples.md` - GraphQL query examples
