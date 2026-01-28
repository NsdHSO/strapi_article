# Clean Text Content (No HTML)

The scraper now extracts clean, structured text content instead of raw HTML!

## What Changed

### ❌ Before (Raw HTML)
```html
<div class="md:width-700 md:max-width-700 mg-x-auto">
  <p id="p-0"><strong>În timp ce SUA presează Canada...</strong></p>
  <div class="single__inline-gallery color-white mg-bottom-20 bg-black padding-5">
    <div class="md:rounded-5 display-grid xs:grid-cols-2 grid-cols-3 gap-5">
      <!-- gallery images -->
    </div>
  </div>
  <div class="strawberry-ads-manager-container">
    <!-- ads -->
  </div>
  <p id="p-1">La ceremonia semnării acordului...</p>
</div>
```

### ✅ After (Clean Text)
```
În timp ce SUA presează Canada să refuze acordul comercial cu China, amenințând-o cu tarife de 100%, Uniunea Europeană a semnat încă un acord comercial de liber schimb cu India după semnarea acordului istoric cu Mercosur.

La ceremonia semnării acordului au participat președintele Consiliului European Antonio Costa și președinta Comisiei Europene Ursula von der Leyen. Acordul a fost încheiat chiar cu ocazia Zilei Naționale a Republicii Indiene.

„Succesul Indiei va face lumea mai stabilă, mai prosperă și mai sigură", a spus Ursula von der Leyen.

Iar Antonio Costa a declarat că acordul dintre UE și India transmite un „mesaj important și puternic lumii".
```

## How It Works

The scraper now:

1. **Removes unwanted HTML elements:**
   - Ads (`.strawberry-ads-manager-container`)
   - Image galleries (`.single__inline-gallery`)
   - Related articles (`.articles`)
   - Scripts and styles
   - Dividers and decorations

2. **Extracts only text paragraphs:**
   - Finds paragraphs with IDs (`p-0`, `p-1`, `p-2`, etc.)
   - Extracts clean text from each paragraph
   - Filters out very short text (< 10 characters)

3. **Structures the content:**
   - Joins paragraphs with double newlines (`\n\n`)
   - Creates readable, structured text
   - Perfect for consumption in other apps

## Schema Changes

The `content` field is now `text` type instead of `richtext`:

```json
{
  "content": {
    "type": "text"
  }
}
```

This makes it easier to consume in:
- Mobile apps
- Web frontends
- RSS feeds
- APIs
- Text processors

## Testing the Clean Content

### 1. Run the scraper

```bash
export STRAPI_API_TOKEN="your-token"
npm run scrape:politica
```

### 2. Query via GraphQL

```graphql
query GetCleanArticle {
  article(id: 1) {
    data {
      attributes {
        title
        content
        description
      }
    }
  }
}
```

### 3. Example Response

```json
{
  "data": {
    "article": {
      "data": {
        "attributes": {
          "title": "România și UE semnează acord istoric",
          "content": "Primul paragraf cu text curat.\n\nAl doilea paragraf cu mai mult text.\n\nAl treilea paragraf continuă povestea.",
          "description": "O scurtă descriere a articolului"
        }
      }
    }
  }
}
```

## Benefits for Your Application

### ✅ Clean & Readable
- No HTML tags to parse
- No ads or unwanted content
- Just the article text

### ✅ Easy to Display
- Display directly in your app
- No need for HTML rendering
- Works on any platform

### ✅ Better UX
- Consistent formatting
- Fast rendering
- Accessible content

### ✅ Easy Processing
- Text analysis
- Translation
- Search indexing
- ML/AI processing

## Content Structure

Each article's content field contains:

```
Paragraph 1 text here.

Paragraph 2 text here.

Paragraph 3 text here.
```

### In your frontend (React example):

```jsx
function ArticleContent({ content }) {
  return (
    <div className="article-content">
      {content.split('\n\n').map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </div>
  );
}
```

### In your mobile app (React Native example):

```jsx
function ArticleContent({ content }) {
  return (
    <View style={styles.content}>
      {content.split('\n\n').map((paragraph, index) => (
        <Text key={index} style={styles.paragraph}>
          {paragraph}
        </Text>
      ))}
    </View>
  );
}
```

## Advanced: Custom Formatting

If you want different formatting, you can modify the `cleanHtmlContent` function in `scripts/scrape-gandul.js`:

### Option 1: Markdown Format

```javascript
function cleanHtmlContent($, contentElement) {
  // ... remove unwanted elements ...

  const paragraphs = [];
  contentElement.find('p[id^="p-"]').each((i, el) => {
    const $p = $(el);

    // Check for bold text
    if ($p.find('strong').length > 0) {
      const text = $p.text().trim();
      paragraphs.push(`**${text}**`); // Markdown bold
    } else {
      paragraphs.push($p.text().trim());
    }
  });

  return paragraphs.join('\n\n');
}
```

### Option 2: JSON Format

```javascript
function cleanHtmlContent($, contentElement) {
  // ... remove unwanted elements ...

  const paragraphs = [];
  contentElement.find('p[id^="p-"]').each((i, el) => {
    const text = $(el).text().trim();
    if (text && text.length > 10) {
      paragraphs.push({
        type: 'paragraph',
        content: text,
        order: i
      });
    }
  });

  return JSON.stringify(paragraphs);
}
```

## Migration for Existing Articles

If you already have articles with HTML content, you can re-scrape them or create a migration script to clean existing content.

### Re-scrape all articles:

```bash
# This will skip duplicates but you can manually delete old ones first
npm run scrape:all
```

## Summary

✅ **Clean text instead of HTML**
✅ **Structured paragraphs with `\n\n` separators**
✅ **No ads, galleries, or unwanted elements**
✅ **Easy to consume in any application**
✅ **Better for accessibility and SEO**

Your articles are now ready to be consumed by any frontend application! 🚀
