import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import sanitizeHtml from 'sanitize-html';
import { CitiesService } from '../cities/cities.service';
import { StorageService } from '../storage/storage.service';
import { Template, TemplateDocument } from './schemas/template.schema';

const RICH_CONTENT_ALLOWED_STYLES: sanitizeHtml.IOptions['allowedStyles'] = {
  '*': {
    color: [
      /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i,
      /^rgba?\([^)]*\)$/i,
      /^[a-z]+$/i,
    ],
    'text-decoration': [/^underline$/i, /^line-through$/i, /^none$/i],
    'font-weight': [/^(normal|bold|bolder|lighter|[1-9]00)$/i],
    'font-style': [/^(normal|italic|oblique)$/i],
    'text-align': [/^(left|right|center|justify)$/i],
    'font-size': [/^\d+(?:\.\d+)?(px|em|rem|%)$/i],
    'line-height': [/^\d+(?:\.\d+)?(?:px|em|rem|%)?$/i],
  },
};

const ABOUT_CONTENT_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    'p',
    'br',
    'h2',
    'h3',
    'h4',
    'strong',
    'b',
    'em',
    'i',
    'u',
    's',
    'blockquote',
    'ul',
    'ol',
    'li',
    'a',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'div',
    'span',
    'img',
    'hr',
    'code',
    'pre',
  ],
  allowedAttributes: {
    a: ['href', 'target', 'rel', 'title', 'style'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading', 'style'],
    table: ['class', 'style', 'width', 'border', 'cellpadding', 'cellspacing'],
    tr: ['class', 'style'],
    th: ['colspan', 'rowspan', 'scope', 'class', 'style', 'width'],
    td: ['colspan', 'rowspan', 'class', 'style', 'width'],
    thead: ['class', 'style'],
    tbody: ['class', 'style'],
    tfoot: ['class', 'style'],
    caption: ['class', 'style'],
    colgroup: ['class', 'style'],
    col: ['span', 'width', 'class', 'style'],
    p: ['style'],
    h2: ['style'],
    h3: ['style'],
    h4: ['style'],
    ul: ['style'],
    ol: ['style'],
    li: ['style'],
    blockquote: ['style'],
    div: ['style'],
    span: ['style'],
    code: ['style'],
    pre: ['style'],
  },
  allowedStyles: RICH_CONTENT_ALLOWED_STYLES,
  disallowedTagsMode: 'discard',
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: {
    img: ['http', 'https'],
  },
  transformTags: {
    a: (_tagName: string, attribs: Record<string, string>) => {
      const nextRel =
        attribs.target === '_blank' ? 'noopener noreferrer' : 'noopener';
      return {
        tagName: 'a',
        attribs: {
          ...attribs,
          rel: nextRel,
        },
      };
    },
  },
};

type PageContentSanitizerRule = {
  titleTypeError: string;
  titleEmptyError: string;
  contentTypeError: string;
};

const PAGE_CONTENT_SANITIZER_RULES: Record<string, PageContentSanitizerRule> = {
  about: {
    titleTypeError: 'ABOUT_TITLE_MUST_BE_STRING',
    titleEmptyError: 'ABOUT_TITLE_CANNOT_BE_EMPTY',
    contentTypeError: 'ABOUT_CONTENT_MUST_BE_STRING',
  },
  'weekend-game': {
    titleTypeError: 'WEEKEND_GAME_TITLE_MUST_BE_STRING',
    titleEmptyError: 'WEEKEND_GAME_TITLE_CANNOT_BE_EMPTY',
    contentTypeError: 'WEEKEND_GAME_CONTENT_MUST_BE_STRING',
  },
  privacy: {
    titleTypeError: 'PRIVACY_TITLE_MUST_BE_STRING',
    titleEmptyError: 'PRIVACY_TITLE_CANNOT_BE_EMPTY',
    contentTypeError: 'PRIVACY_CONTENT_MUST_BE_STRING',
  },
  terms: {
    titleTypeError: 'TERMS_TITLE_MUST_BE_STRING',
    titleEmptyError: 'TERMS_TITLE_CANNOT_BE_EMPTY',
    contentTypeError: 'TERMS_CONTENT_MUST_BE_STRING',
  },
  legal: {
    titleTypeError: 'LEGAL_TITLE_MUST_BE_STRING',
    titleEmptyError: 'LEGAL_TITLE_CANNOT_BE_EMPTY',
    contentTypeError: 'LEGAL_CONTENT_MUST_BE_STRING',
  },
  'public-offer': {
    titleTypeError: 'PUBLIC_OFFER_TITLE_MUST_BE_STRING',
    titleEmptyError: 'PUBLIC_OFFER_TITLE_CANNOT_BE_EMPTY',
    contentTypeError: 'PUBLIC_OFFER_CONTENT_MUST_BE_STRING',
  },
  payment: {
    titleTypeError: 'PAYMENT_TITLE_MUST_BE_STRING',
    titleEmptyError: 'PAYMENT_TITLE_CANNOT_BE_EMPTY',
    contentTypeError: 'PAYMENT_CONTENT_MUST_BE_STRING',
  },
  'what-is-airsoft': {
    titleTypeError: 'WHAT_IS_AIRSOFT_TITLE_MUST_BE_STRING',
    titleEmptyError: 'WHAT_IS_AIRSOFT_TITLE_CANNOT_BE_EMPTY',
    contentTypeError: 'WHAT_IS_AIRSOFT_CONTENT_MUST_BE_STRING',
  },
  'game-types': {
    titleTypeError: 'GAME_TYPES_TITLE_MUST_BE_STRING',
    titleEmptyError: 'GAME_TYPES_TITLE_CANNOT_BE_EMPTY',
    contentTypeError: 'GAME_TYPES_CONTENT_MUST_BE_STRING',
  },
  gallery: {
    titleTypeError: 'GALLERY_TITLE_MUST_BE_STRING',
    titleEmptyError: 'GALLERY_TITLE_CANNOT_BE_EMPTY',
    contentTypeError: 'GALLERY_CONTENT_MUST_BE_STRING',
  },
};

const DEFAULT_TEMPLATE_CONFIGS: Record<string, Record<string, unknown>> = {
  gallery: {
    title: 'ГАЛЕРЕЯ',
    content:
      'Фото з життя клубу, івентів, полігонів та команди Strike Shop Action.',
    seo: {
      browserTitle: 'Галерея | Strike Shop Action',
      ruBrowserTitle: '',
      metaDescription:
        'Фото з івентів, полігонів та життя команди Strike Shop Action.',
      ruMetaDescription: '',
      index: true,
      follow: true,
      includeSitemap: true,
      canonicalUrl: '/gallery',
      seoText: '',
    },
  },
  'game-types': {
    title: 'Типи ігор',
    content: '',
    seo: {
      browserTitle: 'Типи ігор | Strike Shop Action',
      ruBrowserTitle: '',
      metaDescription:
        'Опис форматів і типів страйкбольних ігор на Strike Shop Action.',
      ruMetaDescription: '',
      index: true,
      follow: true,
      includeSitemap: true,
      canonicalUrl: '/game-types',
      seoText: '',
    },
  },
  ratings: {
    title: 'Рейтингова таблиця',
    content: '',
    seo: {
      browserTitle: 'Рейтингова таблиця | Strike Shop Action',
      ruBrowserTitle: '',
      metaDescription: 'Рейтингові таблиці команд та гравців зі страйкболу.',
      ruMetaDescription: '',
      index: true,
      follow: true,
      includeSitemap: true,
      canonicalUrl: '/ratings',
      seoText: '',
    },
  },
};

@Injectable()
export class TemplateService {
  constructor(
    @InjectModel(Template.name)
    private readonly templateModel: Model<TemplateDocument>,
    private readonly storageService: StorageService,
    private readonly citiesService: CitiesService,
  ) {}

  async getTemplateConfig(pageKey: string) {
    const template = await this.templateModel.findOne({ pageKey }).lean();
    if (template) {
      return template.config;
    }

    const defaultConfig = DEFAULT_TEMPLATE_CONFIGS[pageKey];
    if (defaultConfig) {
      try {
        const created = await this.templateModel.create({
          pageKey,
          config: defaultConfig,
        });
        return created.config;
      } catch {
        const existing = await this.templateModel.findOne({ pageKey }).lean();
        if (existing) {
          return existing.config;
        }
      }
    }

    throw new NotFoundException(`Page "${pageKey}" not found`);
  }

  async exists(pageKey: string): Promise<boolean> {
    const res = await this.templateModel.exists({ pageKey });
    return !!res;
  }

  private isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private mergeConfig(
    current: Record<string, unknown>,
    partial: Record<string, unknown>,
  ): Record<string, unknown> {
    const merged: Record<string, unknown> = { ...current };

    for (const k in partial) {
      const next = partial[k];
      const prev = merged[k];

      if (this.isPlainObject(prev) && this.isPlainObject(next)) {
        merged[k] = this.mergeConfig(prev, next);
      } else {
        merged[k] = next;
      }
    }

    return merged;
  }

  private sanitizePlainText(value: string, emptyErrorCode: string): string {
    const sanitized = sanitizeHtml(value, {
      allowedTags: [],
      allowedAttributes: {},
      disallowedTagsMode: 'discard',
    })
      .replace(/\s+/g, ' ')
      .trim();

    if (!sanitized) {
      throw new BadRequestException(emptyErrorCode);
    }

    return sanitized;
  }

  private sanitizeRichText(value: string): string {
    return sanitizeHtml(value, ABOUT_CONTENT_SANITIZE_OPTIONS).trim();
  }

  private sanitizeConfigForPage(
    pageKey: string,
    config: Record<string, unknown>,
  ): Record<string, unknown> {
    const rule = PAGE_CONTENT_SANITIZER_RULES[pageKey];

    if (!rule) {
      return config;
    }

    const nextConfig: Record<string, unknown> = { ...config };

    if ('title' in nextConfig) {
      const rawTitle = nextConfig.title;
      if (typeof rawTitle !== 'string') {
        throw new BadRequestException(rule.titleTypeError);
      }

      nextConfig.title = this.sanitizePlainText(rawTitle, rule.titleEmptyError);
    }

    if ('content' in nextConfig) {
      const rawContent = nextConfig.content;
      if (typeof rawContent !== 'string') {
        throw new BadRequestException(rule.contentTypeError);
      }

      nextConfig.content = this.sanitizeRichText(rawContent);
    }

    return nextConfig;
  }

  private sanitizeCityName(value: string): string {
    return sanitizeHtml(value, {
      allowedTags: [],
      allowedAttributes: {},
      disallowedTagsMode: 'discard',
    })
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractUniqueContactCities(
    config: Record<string, unknown>,
  ): string[] {
    const content = config.content;
    if (!Array.isArray(content)) {
      return [];
    }

    const unique = new Map<string, string>();

    for (const item of content) {
      if (!this.isPlainObject(item)) {
        continue;
      }

      const rawCity = item.city;
      if (typeof rawCity !== 'string') {
        continue;
      }

      const city = this.sanitizeCityName(rawCity);
      if (!city) {
        continue;
      }

      const normalizedKey = city.toLowerCase();
      if (!unique.has(normalizedKey)) {
        unique.set(normalizedKey, city);
      }
    }

    return Array.from(unique.values());
  }

  private async syncCitiesFromContactsConfig(
    pageKey: string,
    config: Record<string, unknown>,
  ): Promise<void> {
    if (pageKey !== 'contacts') {
      return;
    }

    const cities = this.extractUniqueContactCities(config);
    if (cities.length === 0) {
      return;
    }

    await Promise.all(
      cities.map((city) => this.citiesService.getOrCreateCity(city)),
    );
  }

  private async _create(
    userId: number,
    pageKey: string,
    config: Record<string, unknown>,
  ) {
    const doc = new this.templateModel({ pageKey, config });
    return doc.save();
  }

  async createTemplate(
    userId: number,
    pageKey: string,
    config: Record<string, unknown>,
  ) {
    const exists = await this.exists(pageKey);
    if (exists) {
      throw new ConflictException(
        `Template with key "${pageKey}" already exists`,
      );
    }
    const sanitizedConfig = this.sanitizeConfigForPage(pageKey, config);
    await this.syncCitiesFromContactsConfig(pageKey, sanitizedConfig);
    return this._create(userId, pageKey, sanitizedConfig);
  }

  async update(
    userId: number,
    pageKey: string,
    config: Record<string, unknown>,
  ) {
    const sanitizedConfig = this.sanitizeConfigForPage(pageKey, config);
    await this.syncCitiesFromContactsConfig(pageKey, sanitizedConfig);

    const doc = await this.templateModel.findOneAndUpdate(
      { pageKey },
      { $set: { config: sanitizedConfig } },
      { returnDocument: 'after', upsert: false },
    );
    if (!doc) {
      throw new NotFoundException(`Page "${pageKey}" not found`);
    }
    return doc;
  }

  async patchTemplate(
    userId: number,
    pageKey: string,
    partialConfig: Record<string, unknown>,
  ) {
    const currentConfig = await this.getTemplateConfig(pageKey);
    const current = currentConfig as Record<string, unknown>;
    const partial = partialConfig;

    const merged = this.mergeConfig(current, partial);

    return this.update(userId, pageKey, merged);
  }

  async listTemplate() {
    return this.templateModel.find({}, 'pageKey updatedAt').lean();
  }

  async uploadImage(
    userId: number,
    key: string,
    file: Express.Multer.File,
    field?: string,
  ): Promise<{ url: string; config: Record<string, unknown> }> {
    if (!file) {
      throw new BadRequestException('NO_FILE_PROVIDED');
    }

    let config: Record<string, unknown> = {};
    try {
      const current = await this.getTemplateConfig(key);
      config =
        typeof current === 'object' && current
          ? { ...(current as Record<string, unknown>) }
          : {};
    } catch {
      config = {};
    }

    if (field) {
      const prev = field
        .split('.')
        .reduce<unknown>((acc: unknown, k: string) => {
          if (acc && typeof acc === 'object')
            return (acc as Record<string, unknown>)[k];
          return undefined;
        }, config);
      if (typeof prev === 'string') {
        const oldKey = this.storageService.extractKeyFromUrl(prev);
        await this.storageService.remove(oldKey).catch(() => {});
      }
    }

    const saved = await this.storageService.save(
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    if (field) {
      if (field === 'hero.image') {
        const content = Array.isArray(config.content)
          ? (config.content as Array<Record<string, unknown>>)
          : [];
        const heroIdx = content.findIndex(
          (b: Record<string, unknown>) => b.type === 'hero',
        );
        const heroBlock = content[heroIdx];
        if (heroIdx >= 0) {
          content[heroIdx] = { ...heroBlock, image: saved.url };
          config.content = content;
        }
      } else {
        const parts = field.split('.');
        let cursor: Record<string, unknown> = config;
        for (let i = 0; i < parts.length - 1; i++) {
          const p = parts[i];
          const next = cursor[p];
          if (typeof next !== 'object' || next === null)
            cursor[p] = {} as Record<string, unknown>;
          cursor = cursor[p] as Record<string, unknown>;
        }
        cursor[parts[parts.length - 1]] = saved.url;
      }
    } else {
      config['image'] = saved.url;
    }

    const exists = await this.exists(key);
    const doc = exists
      ? await this.update(userId, key, config)
      : await this._create(userId, key, config);

    return { url: saved.url, config: doc.config as Record<string, unknown> };
  }
}
