import Typesense from 'typesense';

// Derive the correct instance type for the client without relying on a namespace type
type TypesenseClient = InstanceType<typeof Typesense.Client>;

type TSField = { name: string; type: string; optional?: boolean };

let client: TypesenseClient | null = null;

function env(name: string): string | undefined {
  const v = process.env[name];
  return v && v.length > 0 ? v : undefined;
}

export function isTypesenseEnabled(): boolean {
  return Boolean(env('TYPESENSE_URL') || env('TYPESENSE_HOST'));
}

export function getCollectionName(contentType: string): string {
  const prefix = env('TYPESENSE_COLLECTION_PREFIX') || 'strapi-';
  const base = contentType.split('.').pop() || contentType;
  return `${prefix}${base}`.toLowerCase();
}

function getTypesenseClient(): TypesenseClient {
  if (client) return client;
  const apiKey = env('TYPESENSE_API_KEY');
  if (!apiKey) throw new Error('Typesense not configured: set TYPESENSE_API_KEY');

  const url = env('TYPESENSE_URL');
  let nodes: { host: string; port: number; protocol: 'http' | 'https' }[] = [];
  if (url) {
    const u = new URL(url);
    nodes = [{
      host: u.hostname,
      port: Number(u.port || (u.protocol === 'https:' ? 443 : 80)),
      protocol: (u.protocol.replace(':', '') as 'http' | 'https'),
    }];
  } else {
    const host = env('TYPESENSE_HOST') || 'localhost';
    const port = Number(env('TYPESENSE_PORT') || 8108);
    const protocol = (env('TYPESENSE_PROTOCOL') || 'http') as 'http' | 'https';
    nodes = [{ host, port, protocol }];
  }

  client = new Typesense.Client({ nodes, apiKey, connectionTimeoutSeconds: 5 });
  return client;
}

async function ensureCollectionWithFields(collectionName: string, requiredFields: TSField[]) {
  const c = getTypesenseClient();
  try {
    const existing: any = await c.collections(collectionName).retrieve();
    const existingNames = new Set(((existing?.fields as any[]) || []).map((f: any) => f.name));
    for (const f of requiredFields) {
      if (!existingNames.has(f.name)) {
        // Add missing field to schema (cast to any: fields() not in TS types for some versions)
        await (c.collections(collectionName) as any).fields().create(f as any);
      }
    }
    return await c.collections(collectionName).retrieve();
  } catch (e: any) {
    const schema: any = { name: collectionName, fields: requiredFields };
    try {
      await c.collections().create(schema);
    } catch (ee: any) {
      if (ee && (ee.httpStatus === 409 || ee.code === 409)) {
        // Collection already exists; safe to proceed
        return await c.collections(collectionName).retrieve();
      }
      throw ee;
    }
    return await c.collections(collectionName).retrieve();
  }
}

async function getOrCreateCollection(collectionName: string) {
  // Fields we rely on for financial-sanp
  const requiredFields: TSField[] = [
    { name: 'id', type: 'string' },
    { name: 'title', type: 'string', optional: true },
    { name: 'subTitle', type: 'string', optional: true },
    { name: 'search_text', type: 'string', optional: true },
    { name: 'publishedAt', type: 'string', optional: true },
  ];
  return await ensureCollectionWithFields(collectionName, requiredFields);
}

export async function indexDocumentsFor<T extends { id: number | string }>(contentType: string, docs: T[]) {
  const collectionName = getCollectionName(contentType);
  await getOrCreateCollection(collectionName);
  const c = getTypesenseClient();
  const toUpsert = (docs || []).map((d) => ({
    ...d,
    id: String(d.id),
  }));
  // Use upsert to handle existing docs
  await c.collections(collectionName).documents().import(toUpsert, { action: 'upsert' } as any);
}

export async function indexDocumentFor<T extends { id: number | string }>(contentType: string, doc: T) {
  const collectionName = getCollectionName(contentType);
  await getOrCreateCollection(collectionName);
  const c = getTypesenseClient();
  await c.collections(collectionName).documents().upsert({ ...doc, id: String((doc as any).id) } as any);
}

export async function deleteDocumentFor(contentType: string, id: number | string) {
  const collectionName = getCollectionName(contentType);
  await getOrCreateCollection(collectionName);
  const c = getTypesenseClient();
  try {
    await c.collections(collectionName).documents(String(id)).delete();
  } catch {}
}

export async function searchFor<T = any>(contentType: string, q: string, offset = 0, limit = 10) {
  const collectionName = getCollectionName(contentType);
  const c = getTypesenseClient();
  const col: any = await getOrCreateCollection(collectionName);

  const fieldNames = new Set(((col?.fields as any[]) || []).map((f: any) => f.name));

  // Content-type specific preferred fields
  const preferredByCT: Record<string, string[]> = {
    'api::financial-sanp.financial-sanp': ['title', 'subTitle'],
  };

  const preferred = preferredByCT[contentType] || ['title', 'subTitle'];
  const queryFields = preferred.filter((f) => fieldNames.has(f));
  const primaryQueryBy = queryFields.length ? queryFields.join(',') : undefined;

  const page = Math.max(1, Math.floor(offset / Math.max(1, limit)) + 1);
  const baseParams: any = {
    q: (q && q.length > 0 ? q : '*'),
    page,
    per_page: Math.max(1, limit),
  };

  const candidates: string[] = [];
  if (primaryQueryBy) candidates.push(primaryQueryBy);
  candidates.push('title,subTitle');
  candidates.push('subTitle,title');
  if (fieldNames.has('title')) candidates.push('title');
  if (fieldNames.has('subTitle')) candidates.push('subTitle');
  if (fieldNames.has('publishedAt')) candidates.push('publishedAt');

  let res: any | null = null;
  for (const qb of candidates) {
    try {
      res = await c.collections(collectionName).documents().search({ ...baseParams, query_by: qb });
      if (res && Array.isArray(res.hits)) break;
    } catch {}
  }

  if (!res) {
    // Final fallback: wildcard against any available field
    const anyField = Array.from(fieldNames)[0] || 'title';
    res = await c.collections(collectionName).documents().search({ ...baseParams, query_by: anyField, q: '*' });
  }

  const hits = ((res.hits || []) as any[]).map((h: any) => ({ id: String(h.document?.id ?? ''), ...(h.document || {}) }));
  const total = (typeof res.found === 'number' ? res.found : hits.length) as number;
  return { total, hits } as { total: number; hits: (T & { id: string })[] };
}