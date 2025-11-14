import type { Schema, Struct } from '@strapi/strapi';

export interface SharedCardHome extends Struct.ComponentSchema {
  collectionName: 'components_shared_card_homes';
  info: {
    displayName: 'cardHome';
    icon: 'bulletList';
  };
  attributes: {
    altText: Schema.Attribute.String;
    img: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios', true>;
    subTitle: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface SharedFooterHome extends Struct.ComponentSchema {
  collectionName: 'components_shared_footer_homes';
  info: {
    displayName: 'footerHome';
    icon: 'priceTag';
  };
  attributes: {
    description: Schema.Attribute.String;
    icon: Schema.Attribute.String;
  };
}

export interface SharedMedia extends Struct.ComponentSchema {
  collectionName: 'components_shared_media';
  info: {
    displayName: 'Media';
    icon: 'file-video';
  };
  attributes: {
    file: Schema.Attribute.Media<'images' | 'files' | 'videos'>;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'shared.card-home': SharedCardHome;
      'shared.footer-home': SharedFooterHome;
      'shared.media': SharedMedia;
    }
  }
}
