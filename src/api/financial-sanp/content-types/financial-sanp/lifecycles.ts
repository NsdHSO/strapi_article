import type { Core } from '@strapi/strapi';
import { isTypesenseEnabled, indexDocumentFor, deleteDocumentFor } from '../../../../utils/typesense';

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

export default {
  async afterCreate(event: any) {
    if (!isTypesenseEnabled()) return;
    const id = (event as any).result?.id;
    if (!id) return;

    const entity = await (strapi as Core.Strapi).entityService.findOne(CT, id, { populate: '*' } as any);
    if (entity?.publishedAt) {
      const search_text = flattenStrings(entity);
      await indexDocumentFor(CT, {
        id: entity.id,
        title: (entity as any).title,
        subTitle: (entity as any).subTitle,
        search_text,
        publishedAt: entity.publishedAt,
      });
    } else {
      await deleteDocumentFor(CT, id);
    }
  },

  async afterUpdate(event: any) {
    if (!isTypesenseEnabled()) return;
    const id = (event as any).result?.id;
    if (!id) return;

    const entity = await (strapi as Core.Strapi).entityService.findOne(CT, id, { populate: '*' } as any);
    if (entity?.publishedAt) {
      const search_text = flattenStrings(entity);
      await indexDocumentFor(CT, {
        id: entity.id,
        title: (entity as any).title,
        subTitle: (entity as any).subTitle,
        search_text,
        publishedAt: entity.publishedAt,
      });
    } else {
      await deleteDocumentFor(CT, id);
    }
  },

  async afterDelete(event: any) {
    if (!isTypesenseEnabled()) return;
    const id = (event as any).result?.id;
    if (id) {
      await deleteDocumentFor(CT, id);
    }
  },
};
