/**
 * financial-sanp controller
 */

import { factories } from '@strapi/strapi'
import { isMeiliEnabled, searchFor, indexDocumentsFor } from '../../../utils/meilisearch'

const CT = 'api::financial-sanp.financial-sanp';

export default factories.createCoreController(CT, ({ strapi }) => ({
  async search(ctx) {
    if (!isMeiliEnabled()) ctx.throw(503, 'Search is not configured');

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
    if (!isMeiliEnabled()) ctx.throw(503, 'Search is not configured');

    const pageSize = Math.min(500, Number(ctx.query.pageSize || 100));
    let page = 1;
    let totalIndexed = 0;

    for (;;) {
      const entities: any[] = await strapi.entityService.findMany(CT, {
        filters: { publishedAt: { $notNull: true } },
        page,
        pageSize,
      } as any);

      const items: any[] = Array.isArray(entities) ? entities : (entities as any)?.results ?? [];
      if (!items.length) break;

      const docs = items.map((e) => ({ id: e.id, publishedAt: e.publishedAt }));
      await indexDocumentsFor(CT, docs);

      totalIndexed += items.length;
      page += 1;
    }

    ctx.body = { data: { indexed: totalIndexed } };
  },
}));
