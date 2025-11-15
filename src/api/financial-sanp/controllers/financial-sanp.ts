/**
 * financial-sanp controller
 */

import { factories } from '@strapi/strapi'
import { isTypesenseEnabled, searchFor, indexDocumentsFor } from '../../../utils/typesense'

const CT = 'api::financial-sanp.financial-sanp';

function flattenStrings(value: any, maxLen = 10000): string {
  const seen = new Set<any>();
  let out: string[] = [];
  function walk(v: any) {
    if (v == null) return;
    if (typeof v === 'string') {
      if (v.trim().length) out.push(v);
      return;
    }
    if (typeof v === 'number' || typeof v === 'boolean') {
      out.push(String(v));
      return;
    }
    if (typeof v !== 'object') return;
    if (seen.has(v)) return;
    seen.add(v);
    if (Array.isArray(v)) {
      for (const i of v) walk(i);
      return;
    }
    for (const k of Object.keys(v)) {
      walk((v as any)[k]);
      if (out.join(' ').length >= maxLen) return;
    }
  }
  walk(value);
  const s = out.join(' ').slice(0, maxLen);
  return s;
}

export default factories.createCoreController(CT, ({ strapi }) => ({
  async search(ctx) {
    if (!isTypesenseEnabled()) ctx.throw(503, 'Search is not configured');

    const q = (ctx.query.q as string) || '';
    const page = Math.max(1, Number(ctx.query.page || 1));
    const pageSize = Math.min(100, Math.max(1, Number(ctx.query.pageSize || 10)));
    const offset = (page - 1) * pageSize;

    const { hits, total } = await searchFor(CT, q, offset, pageSize);
    ctx.body = {
      data: hits,
      meta: { pagination: { page, pageSize, total, pageCount: Math.ceil(total / pageSize) } },
    };
  },

  async reindex(ctx) {
    if (!isTypesenseEnabled()) ctx.throw(503, 'Search is not configured');

    const pageSize = Math.min(500, Number(ctx.query.pageSize || 100));
    const includeDrafts = String(ctx.query.includeDrafts || 'false') === 'true';

    let page = 1;
    let totalIndexed = 0;

    for (;;) {
      const findOpts: any = {
        fields: ['id', 'publishedAt', 'title', 'subTitle'],
        populate: '*',
        pagination: { page, pageSize },
      };
      if (!includeDrafts) {
        findOpts.filters = { publishedAt: { $notNull: true } };
      }

      const items: any[] = await strapi.entityService.findMany(CT, findOpts);
      if (!items.length) break;
      console.log(JSON.stringify(items));
      
      const docs = items.map((e) => ({
        id: e.id,
        title: e.title,
        subTitle: (e as any).subTitle,
        search_text: flattenStrings(e),
        publishedAt: e.publishedAt,
      }));
      await indexDocumentsFor(CT, docs as any);

      totalIndexed += items.length;
      if (items.length < pageSize) break;
      page += 1;
    }

    ctx.body = { data: { indexed: totalIndexed, includeDrafts } };
  },
}));
