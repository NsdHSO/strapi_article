import type { Core } from '@strapi/strapi';
import { isMeiliEnabled, indexDocumentFor, deleteDocumentFor } from '../../../../utils/meilisearch';

const CT = 'api::financial-sanp.financial-sanp';

export default {
  async afterCreate(event: any) {
    if (!isMeiliEnabled()) return;
    const id = (event as any).result?.id;
    if (!id) return;

    const entity = await (strapi as Core.Strapi).entityService.findOne(CT, id, { populate: [] });
    if (entity?.publishedAt) {
      await indexDocumentFor(CT, { id: entity.id, publishedAt: entity.publishedAt });
    } else {
      await deleteDocumentFor(CT, id);
    }
  },

  async afterUpdate(event: any) {
    if (!isMeiliEnabled()) return;
    const id = (event as any).result?.id;
    if (!id) return;

    const entity = await (strapi as Core.Strapi).entityService.findOne(CT, id, { populate: [] });
    if (entity?.publishedAt) {
      await indexDocumentFor(CT, { id: entity.id, publishedAt: entity.publishedAt });
    } else {
      await deleteDocumentFor(CT, id);
    }
  },

  async afterDelete(event: any) {
    if (!isMeiliEnabled()) return;
    const id = (event as any).result?.id;
    if (id) {
      await deleteDocumentFor(CT, id);
    }
  },
};
