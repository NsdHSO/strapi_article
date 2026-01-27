# GraphQL Query Examples for Articles

Access GraphQL Playground at: http://localhost:1337/graphql

## Basic Queries

### Get All Articles
```graphql
query GetAllArticles {
  articles {
    data {
      id
      attributes {
        title
        description
        author
        publishedDate
        category
        featuredImage
        sourceUrl
        createdAt
        updatedAt
      }
    }
    meta {
      pagination {
        total
        page
        pageSize
        pageCount
      }
    }
  }
}
```

### Get Single Article by ID
```graphql
query GetArticle {
  article(id: 1) {
    data {
      id
      attributes {
        title
        description
        content
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

### Get Articles with Pagination
```graphql
query GetArticlesPaginated {
  articles(pagination: { page: 1, pageSize: 10 }) {
    data {
      id
      attributes {
        title
        publishedDate
        category
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

## Filtering

### Filter by Category
```graphql
query GetArticlesByCategory {
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

### Search by Title
```graphql
query SearchArticles {
  articles(filters: { title: { contains: "Romania" } }) {
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

### Filter by Author
```graphql
query GetArticlesByAuthor {
  articles(filters: { author: { eq: "John Doe" } }) {
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

### Filter by Date Range
```graphql
query GetRecentArticles {
  articles(
    filters: {
      publishedDate: {
        gte: "2026-01-01"
        lte: "2026-01-31"
      }
    }
  ) {
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

### Multiple Filters (AND)
```graphql
query GetFilteredArticles {
  articles(
    filters: {
      and: [
        { category: { eq: "Politics" } }
        { publishedDate: { gte: "2026-01-01" } }
      ]
    }
  ) {
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

### Multiple Filters (OR)
```graphql
query GetArticlesByMultipleCategories {
  articles(
    filters: {
      or: [
        { category: { eq: "Politics" } }
        { category: { eq: "Economics" } }
      ]
    }
  ) {
    data {
      id
      attributes {
        title
        category
      }
    }
  }
}
```

## Sorting

### Sort by Date (Descending - Newest First)
```graphql
query GetLatestArticles {
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

### Sort by Date (Ascending - Oldest First)
```graphql
query GetOldestArticles {
  articles(sort: "publishedDate:asc") {
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

### Sort by Multiple Fields
```graphql
query GetSortedArticles {
  articles(sort: ["category:asc", "publishedDate:desc"]) {
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

## Advanced Queries

### Combined: Filter, Sort, and Paginate
```graphql
query GetPoliticsArticles {
  articles(
    filters: { category: { eq: "Politics" } }
    sort: "publishedDate:desc"
    pagination: { page: 1, pageSize: 5 }
  ) {
    data {
      id
      attributes {
        title
        description
        author
        publishedDate
        featuredImage
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

### Get Article Count by Category
```graphql
query GetArticleStats {
  articles(filters: { category: { eq: "Politics" } }) {
    meta {
      pagination {
        total
      }
    }
  }
}
```

### Full Text Search Across Multiple Fields
```graphql
query FullTextSearch($searchTerm: String!) {
  articles(
    filters: {
      or: [
        { title: { containsi: $searchTerm } }
        { description: { containsi: $searchTerm } }
      ]
    }
  ) {
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

Variables for above query:
```json
{
  "searchTerm": "Romania"
}
```

### Get Articles Published Today
```graphql
query GetTodayArticles {
  articles(
    filters: {
      publishedDate: {
        gte: "2026-01-26T00:00:00.000Z"
        lte: "2026-01-26T23:59:59.999Z"
      }
    }
    sort: "publishedDate:desc"
  ) {
    data {
      id
      attributes {
        title
        publishedDate
        category
      }
    }
  }
}
```

### Get Latest 5 Articles Per Category
```graphql
query GetLatestPerCategory($category: String!) {
  articles(
    filters: { category: { eq: $category } }
    sort: "publishedDate:desc"
    pagination: { limit: 5 }
  ) {
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

Variables:
```json
{
  "category": "Politics"
}
```

## Useful Filter Operators

- `eq`: Equal to
- `ne`: Not equal to
- `lt`: Less than
- `lte`: Less than or equal to
- `gt`: Greater than
- `gte`: Greater than or equal to
- `in`: In array
- `notIn`: Not in array
- `contains`: Contains (case-sensitive)
- `notContains`: Does not contain (case-sensitive)
- `containsi`: Contains (case-insensitive)
- `notContainsi`: Does not contain (case-insensitive)
- `startsWith`: Starts with
- `endsWith`: Ends with
- `null`: Is null
- `notNull`: Is not null

## Testing Your Setup

1. Start Strapi in development mode:
   ```bash
   npm run develop
   ```

2. Run the scraper to populate data:
   ```bash
   npm run scrape:gandul
   ```

3. Open GraphQL Playground:
   http://localhost:1337/graphql

4. Try running the queries above!

## Using GraphQL in Your Application

### JavaScript/TypeScript Example (using fetch)
```javascript
const query = `
  query GetArticles {
    articles(pagination: { limit: 10 }) {
      data {
        id
        attributes {
          title
          description
          featuredImage
        }
      }
    }
  }
`;

fetch('http://localhost:1337/graphql', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query }),
})
  .then(res => res.json())
  .then(data => console.log(data));
```

### Using Apollo Client (React)
```javascript
import { ApolloClient, InMemoryCache, gql, useQuery } from '@apollo/client';

const client = new ApolloClient({
  uri: 'http://localhost:1337/graphql',
  cache: new InMemoryCache(),
});

const GET_ARTICLES = gql`
  query GetArticles {
    articles {
      data {
        id
        attributes {
          title
          description
        }
      }
    }
  }
`;

function ArticlesList() {
  const { loading, error, data } = useQuery(GET_ARTICLES);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <div>
      {data.articles.data.map(article => (
        <div key={article.id}>
          <h2>{article.attributes.title}</h2>
          <p>{article.attributes.description}</p>
        </div>
      ))}
    </div>
  );
}
```

### Using axios
```javascript
import axios from 'axios';

const getArticles = async () => {
  const { data } = await axios.post('http://localhost:1337/graphql', {
    query: `
      query {
        articles {
          data {
            id
            attributes {
              title
            }
          }
        }
      }
    `
  });

  return data.data.articles.data;
};
```
