const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scraper for Gandul.ro news website
 * Fetches articles and stores them in Strapi
 */

const GANDUL_BASE_URL = 'https://www.gandul.ro';
const STRAPI_API_URL = process.env.STRAPI_API_URL || 'http://localhost:1337/api';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

/**
 * Clean HTML and extract text content
 * Converts HTML to clean, structured text with paragraphs
 */
function cleanHtmlContent($, contentElement) {
  // Remove unwanted elements
  contentElement.find('.strawberry-ads-manager-container').remove();
  contentElement.find('.single__inline-gallery').remove();
  contentElement.find('.articles').remove();
  contentElement.find('[data-id]').remove();
  contentElement.find('script').remove();
  contentElement.find('style').remove();
  contentElement.find('hr').remove();
  contentElement.find('.article').remove();
  contentElement.find('[id^="div-gpt"]').remove();

  // Extract paragraphs with IDs (p-0, p-1, etc.)
  const paragraphs = [];
  contentElement.find('p[id^="p-"]').each((i, el) => {
    const text = $(el).text().trim();
    if (text && text.length > 10) {
      paragraphs.push(text);
    }
  });

  // If no paragraphs with IDs found, get all paragraphs
  if (paragraphs.length === 0) {
    contentElement.find('p').each((i, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 10) {
        paragraphs.push(text);
      }
    });
  }

  // Join paragraphs with double newlines for structure
  return paragraphs.join('\n\n');
}

/**
 * Check if a URL looks like an actual article (not a category page)
 */
function isArticleUrl(url) {
  // Category/navigation pages to exclude
  const excludePatterns = [
    /^https:\/\/www\.gandul\.ro\/(politica|stiri|international|financiar|cultura|sport|video|evenimente|ultima-ora)$/,
    /^https:\/\/www\.gandul\.ro\/comunicate-de-presa$/,
    /^https:\/\/www\.gandul\.ro\/emisiuni\/[^/]+$/,
    /^https:\/\/www\.gandul\.ro\/[^/]+$/,  // Single-level paths (usually categories)
  ];

  // Check if URL matches any exclude pattern
  if (excludePatterns.some(pattern => pattern.test(url))) {
    return false;
  }

  // Article URLs typically have multi-level paths or IDs at the end
  // Example: /actualitate/some-article-20784386 or /social/article-title
  const articlePattern = /gandul\.ro\/[^/]+\/[^/]+-\d+$|gandul\.ro\/[^/]+\/[^/]+\/[^/]+/;
  return articlePattern.test(url);
}

/**
 * Fetch and parse the homepage to get article links
 */
async function fetchArticleLinks(url = GANDUL_BASE_URL) {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const $ = cheerio.load(data);
    const articleLinks = new Set();

    // Find article links - adjust selectors based on actual HTML structure
    $('a[href*="/"]').each((i, el) => {
      const href = $(el).attr('href');
      if (href && !href.includes('#') && !href.includes('javascript:')) {
        const fullUrl = href.startsWith('http') ? href : `${GANDUL_BASE_URL}${href}`;

        // Only add if it looks like an actual article
        if (fullUrl.includes('gandul.ro') && isArticleUrl(fullUrl)) {
          articleLinks.add(fullUrl);
        }
      }
    });

    return Array.from(articleLinks).slice(0, 20); // Limit to 20 articles for testing
  } catch (error) {
    console.error('Error fetching article links:', error.message);
    return [];
  }
}

/**
 * Scrape a single article page
 */
async function scrapeArticle(url) {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const $ = cheerio.load(data);

    // Extract article data using Gandul.ro specific selectors
    const title = $('.single__title h1').text().trim() ||
                  $('h1').first().text().trim() ||
                  $('meta[property="og:title"]').attr('content') ||
                  $('title').text().trim();

    const description = $('meta[name="description"]').attr('content') ||
                       $('meta[property="og:description"]').attr('content') || '';

    // Get article content from .single__text and clean it
    const contentElement = $('.single__text');
    let content = '';

    if (contentElement.length > 0) {
      content = cleanHtmlContent($, contentElement);
    } else {
      // Fallback to other selectors
      const fallbackElement = $('article').length ? $('article') : $('.article-content');
      if (fallbackElement.length > 0) {
        content = cleanHtmlContent($, fallbackElement);
      }
    }

    // Get author from link in .single__meta
    const author = $('.single__meta a[href*="/autor/"]').text().trim() ||
                  $('meta[name="author"]').attr('content') ||
                  $('.author').first().text().trim() || '';

    // Get published date from JSON-LD or meta tags
    let publishedDate = $('meta[property="article:published_time"]').attr('content');
    if (!publishedDate) {
      const jsonLdScript = $('script[type="application/ld+json"]').html();
      if (jsonLdScript) {
        try {
          const jsonLd = JSON.parse(jsonLdScript);
          publishedDate = jsonLd.datePublished || jsonLd.dateModified;
        } catch (e) {
          // Ignore JSON parse errors
        }
      }
    }
    publishedDate = publishedDate || $('time').attr('datetime') || new Date().toISOString();

    // Get category from breadcrumbs
    const category = $('.single__breadcrumbs a').last().text().trim() ||
                    $('meta[property="article:section"]').attr('content') ||
                    $('.category').first().text().trim() || '';

    // Get featured image
    const featuredImage = $('.single__media img').attr('src') ||
                         $('meta[property="og:image"]').attr('content') ||
                         $('article img').first().attr('src') || '';

    const tags = [];
    $('meta[property="article:tag"]').each((i, el) => {
      const tag = $(el).attr('content');
      if (tag) tags.push(tag);
    });

    // Validate that we have minimum required data
    if (!title || title.length < 5) {
      console.log(`⚠️  Skipping - Invalid or missing title`);
      return null;
    }

    if (!content || content.length < 50) {
      console.log(`⚠️  Skipping - No substantial content found`);
      return null;
    }

    return {
      title: title.substring(0, 500),  // Limit to 500 chars for safety
      description: description ? description.substring(0, 1000) : '',
      content,
      author: author ? author.substring(0, 255) : '',
      publishedDate,
      category: category ? category.substring(0, 100) : '',
      tags,
      featuredImage: featuredImage ? featuredImage.substring(0, 1000) : '',
      sourceUrl: url,
    };
  } catch (error) {
    console.error(`Error scraping article ${url}:`, error.message);
    return null;
  }
}

/**
 * Fetch article links from a category page
 */
async function fetchArticlesFromCategory(categorySlug, limit = 20) {
  const categoryUrl = `${GANDUL_BASE_URL}/${categorySlug}`;
  console.log(`📂 Fetching articles from category: ${categorySlug}`);

  try {
    const { data } = await axios.get(categoryUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const $ = cheerio.load(data);
    const articleLinks = new Set();

    // Find article links on category page
    $('a[href]').each((i, el) => {
      const href = $(el).attr('href');
      if (href && !href.includes('#') && !href.includes('javascript:')) {
        const fullUrl = href.startsWith('http') ? href : `${GANDUL_BASE_URL}${href}`;

        // Only add if it's an actual article URL
        if (fullUrl.includes('gandul.ro') && isArticleUrl(fullUrl)) {
          articleLinks.add(fullUrl);
        }
      }
    });

    const links = Array.from(articleLinks).slice(0, limit);
    console.log(`  Found ${links.length} articles in ${categorySlug}\n`);
    return links;
  } catch (error) {
    console.error(`Error fetching category ${categorySlug}:`, error.message);
    return [];
  }
}

/**
 * Save article to Strapi
 */
async function saveToStrapi(article) {
  try {
    if (!STRAPI_API_TOKEN) {
      console.error('STRAPI_API_TOKEN not set. Please set it as an environment variable.');
      return false;
    }

    // Check if article already exists
    const checkResponse = await axios.get(
      `${STRAPI_API_URL}/articles?filters[sourceUrl][$eq]=${encodeURIComponent(article.sourceUrl)}`,
      {
        headers: {
          Authorization: `Bearer ${STRAPI_API_TOKEN}`,
        },
      }
    );

    if (checkResponse.data.data.length > 0) {
      console.log(`Article already exists: ${article.title}`);
      return false;
    }

    // Create new article
    const response = await axios.post(
      `${STRAPI_API_URL}/articles`,
      { data: article },
      {
        headers: {
          Authorization: `Bearer ${STRAPI_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`✓ Saved: ${article.title}`);
    return true;
  } catch (error) {
    console.error(`Error saving article to Strapi: ${error.message}`);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

/**
 * Main scraper function
 */
async function scrapeGandul(options = {}) {
  const {
    categories = null, // Array of category slugs or null for homepage
    articlesPerCategory = 10
  } = options;

  console.log('🚀 Starting Gandul.ro scraper...\n');

  let articleLinks = [];

  // If categories are specified, fetch from each category
  if (categories && categories.length > 0) {
    console.log(`📂 Scraping from ${categories.length} categories...\n`);

    for (const category of categories) {
      const links = await fetchArticlesFromCategory(category, articlesPerCategory);
      articleLinks.push(...links);
    }
  } else {
    // Otherwise fetch from homepage
    console.log('📡 Fetching article links from homepage...');
    articleLinks = await fetchArticleLinks();
  }

  console.log(`\n📝 Total articles to scrape: ${articleLinks.length}\n`);

  let savedCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  // Scrape each article
  for (const [index, link] of articleLinks.entries()) {
    console.log(`[${index + 1}/${articleLinks.length}] Scraping: ${link}`);

    const article = await scrapeArticle(link);

    if (article && article.title) {
      const saved = await saveToStrapi(article);
      if (saved) {
        savedCount++;
      } else {
        skippedCount++;
      }
    } else {
      errorCount++;
      console.log(`✗ Failed to scrape article`);
    }

    // Add delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n📊 Summary:');
  console.log(`Total articles processed: ${articleLinks.length}`);
  console.log(`Successfully saved: ${savedCount}`);
  console.log(`Skipped (duplicates): ${skippedCount}`);
  console.log(`Errors: ${errorCount}`);
}

// Run the scraper
if (require.main === module) {
  // Define available categories
  const CATEGORIES = {
    politica: 'Politică',
    actualitate: 'Actualitate',
    externe: 'Externe (International)',
    international: 'International',
    economic: 'Economic',
    financiar: 'Financiar',
    cultura: 'Cultură',
    sport: 'Sport',
    video: 'Video',
    comunicate: 'Comunicate',
    'comunicate-de-presa': 'Comunicate de Presă',
    evenimente: 'Evenimente'
  };

  // Parse command line arguments
  const args = process.argv.slice(2);
  let options = {};

  if (args.includes('--categories')) {
    const categoryArg = args[args.indexOf('--categories') + 1];
    if (categoryArg === 'all') {
      // Scrape from all categories
      options.categories = Object.keys(CATEGORIES);
      options.articlesPerCategory = 5;
    } else if (categoryArg) {
      // Scrape from specified categories (comma-separated)
      options.categories = categoryArg.split(',').map(c => c.trim());
      options.articlesPerCategory = 10;
    }
  }

  if (args.includes('--limit')) {
    const limit = parseInt(args[args.indexOf('--limit') + 1]);
    if (!isNaN(limit)) {
      options.articlesPerCategory = limit;
    }
  }

  // Show usage info
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Gandul.ro Scraper

Usage:
  node scrape-gandul.js [options]

Options:
  --categories <categories>   Scrape from specific categories (comma-separated)
                              Use "all" to scrape from all categories
                              Available: ${Object.keys(CATEGORIES).join(', ')}

  --limit <number>           Number of articles per category (default: 10)

  --help, -h                 Show this help message

Examples:
  # Scrape from homepage
  node scrape-gandul.js

  # Scrape 10 articles from Politică and Sport
  node scrape-gandul.js --categories politica,sport

  # Scrape 5 articles from all categories
  node scrape-gandul.js --categories all --limit 5

  # Scrape 15 articles from Actualitate
  node scrape-gandul.js --categories actualitate --limit 15
    `);
    process.exit(0);
  }

  scrapeGandul(options)
    .then(() => {
      console.log('\n✅ Scraping completed!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Scraping failed:', error);
      process.exit(1);
    });
}

module.exports = { scrapeGandul, scrapeArticle, fetchArticleLinks, fetchArticlesFromCategory };
