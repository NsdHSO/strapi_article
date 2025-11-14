import { MeiliSearch, Index } from 'meilisearch';

let client: MeiliSearch | null = null;

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

export function isMeiliEnabled(): boolean {
  return Boolean(env('MEILISEARCH_HOST'));
}

export function getIndexName(contentType: string): string {
  const prefix = env('MEILISEARCH_INDEX_PREFIX') || 'strapi-';
  const base = contentType.split('.').pop() || contentType;
  return `${prefix}${base}`.toLowerCase();
}

export function getMeiliClient(): MeiliSearch {
  if (client) return client;
  const host = env('MEILISEARCH_HOST');
  const apiKey = env('MEILISEARCH_API_KEY');
  if (!host) throw new Error('Meilisearch not configured: set MEILISEARCH_HOST');
  client = new MeiliSearch({ host, apiKey });
  return client;
}

async function getOrCreateIndex(indexName: string): Promise<Index<Record<string, any>>> {
  const c = getMeiliClient();
  try {
    const idx = await c.getIndex(indexName);
    return idx as any;
  } catch (e) {
    const { taskUid } = await c.createIndex(indexName, { primaryKey: 'id' });
    await (c as any).waitForTask(taskUid);
    return (await c.getIndex(indexName)) as any;
  }
}

export type ArticleSearchDoc = {
  id: number | string;
  title?: string | null;
  description?: string | null;
  slug?: string | null;
  authorName?: string | null;
  categoryName?: string | null;
  publishedAt?: string | null;
};

export function serializeArticleForSearch(entity: any): ArticleSearchDoc {
  return {
    id: entity.id,
    title: entity.title ?? null,
    description: entity.description ?? null,
    slug: entity.slug ?? null,
    authorName: entity.author?.name ?? null,
    categoryName: entity.category?.name ?? null,
    publishedAt: entity.publishedAt ?? null,
  };
}

export async function ensureIndexFor(contentType: string, settings?: {
  searchableAttributes?: string[];
  filterableAttributes?: string[];
  sortableAttributes?: string[];
}) {
  const indexName = getIndexName(contentType);
  const idx = await getOrCreateIndex(indexName);
  if (settings) {
    try {
      const { taskUid } = await idx.updateSettings(settings);
      await (idx as any).waitForTask(taskUid);
    } catch {}
  }
}

export async function indexDocumentsFor<T extends { id: number | string }>(contentType: string, docs: T[]) {
  const indexName = getIndexName(contentType);
  const idx = await getOrCreateIndex(indexName);
  const { taskUid } = await idx.addDocuments(docs as any);
  await (idx as any).waitForTask(taskUid);
}

export async function indexDocumentFor<T extends { id: number | string }>(contentType: string, doc: T) {
  return indexDocumentsFor(contentType, [doc]);
}

export async function deleteDocumentFor(contentType: string, id: number | string) {
  const indexName = getIndexName(contentType);
  const idx = await getOrCreateIndex(indexName);
  const { taskUid } = await idx.deleteDocument(String(id));
  await (idx as any).waitForTask(taskUid);
}

export async function searchFor<T = any>(contentType: string, q: string, offset = 0, limit = 10) {
  const indexName = getIndexName(contentType);
  const idx = await getOrCreateIndex(indexName);
  const res = await idx.search<T>(q || '', {
    offset,
    limit,
  });
  return {
    total: res.estimatedTotalHits ?? res.hits.length,
    hits: (res.hits || []).map((h: any) => ({ id: h.id, ...h })),
  };
}

// Convenience wrappers for articles (kept if you add back the Article content type)
export async function ensureArticleIndex() {
  return ensureIndexFor('api::article.article', {
    searchableAttributes: ['title', 'description', 'authorName', 'categoryName'],
    filterableAttributes: ['authorName', 'categoryName'],
    sortableAttributes: ['publishedAt', 'title'],
  });
}

export async function indexArticleDocuments(docs: ArticleSearchDoc[]) {
  return indexDocumentsFor('api::article.article', docs);
}

export async function indexArticleDocument(doc: ArticleSearchDoc) {
  return indexDocumentFor('api::article.article', doc);
}

export async function deleteArticleDocument(id: number) {
  return deleteDocumentFor('api::article.article', id);
}

export async function searchArticles(q: string, offset = 0, limit = 10) {
  return searchFor<ArticleSearchDoc>('api::article.article', q, offset, limit);
}
