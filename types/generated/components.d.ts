import type { Schema, Struct } from '@strapi/strapi';

export interface SharedButton extends Struct.ComponentSchema {
  collectionName: 'components_shared_buttons';
  info: {
    displayName: 'Button';
  };
  attributes: {
    action: Schema.Attribute.String;
    content: Schema.Attribute.String;
    icon: Schema.Attribute.String;
    type: Schema.Attribute.String;
  };
}

export interface SharedCard extends Struct.ComponentSchema {
  collectionName: 'components_shared_cards';
  info: {
    displayName: 'Card';
    icon: 'apps';
  };
  attributes: {
    centerSide: Schema.Attribute.Component<'shared.center', true>;
    leftSide: Schema.Attribute.Component<'shared.icon', false>;
  };
}

export interface SharedCardHome extends Struct.ComponentSchema {
  collectionName: 'components_shared_card_homes';
  info: {
    displayName: 'CardHome';
    icon: 'bulletList';
  };
  attributes: {
    action: Schema.Attribute.String;
    altText: Schema.Attribute.String;
    img: Schema.Attribute.Media<'images' | 'files' | 'videos' | 'audios', true>;
    subTitle: Schema.Attribute.String;
    title: Schema.Attribute.String;
  };
}

export interface SharedCenter extends Struct.ComponentSchema {
  collectionName: 'components_shared_centers';
  info: {
    displayName: 'center';
    icon: 'arrowUp';
  };
  attributes: {
    button: Schema.Attribute.Component<'shared.button', false>;
    texts: Schema.Attribute.Component<'shared.textx', true>;
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

export interface SharedIcon extends Struct.ComponentSchema {
  collectionName: 'components_shared_icons';
  info: {
    displayName: 'Icon';
  };
  attributes: {
    color: Schema.Attribute.String;
    font: Schema.Attribute.String;
    name: Schema.Attribute.String;
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

export interface SharedTextx extends Struct.ComponentSchema {
  collectionName: 'components_shared_textxes';
  info: {
    displayName: 'Text';
  };
  attributes: {
    content: Schema.Attribute.String;
    type: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export module Public {
    export interface ComponentSchemas {
      'shared.button': SharedButton;
      'shared.card': SharedCard;
      'shared.card-home': SharedCardHome;
      'shared.center': SharedCenter;
      'shared.footer-home': SharedFooterHome;
      'shared.icon': SharedIcon;
      'shared.media': SharedMedia;
      'shared.textx': SharedTextx;
    }
  }
}
