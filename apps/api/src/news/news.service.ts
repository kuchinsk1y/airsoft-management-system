import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';
import { AclService } from '../acl/acl.service';
import {
  AclPermission,
  NewsCategory,
  Prisma,
} from '../generated/prisma-client';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import {
  AdjacentNewsResult,
  NewsListFilters,
  NewsListResult,
  NewsResponse,
  NewsWithRelations,
} from './interfaces';
import { NewsDataService } from './news-data.service';

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

const NEWS_CONTENT_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
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

@Injectable()
export class NewsService {
  constructor(
    private readonly newsDataService: NewsDataService,
    private readonly aclService: AclService,
  ) {}

  async createNews(userId: number, dto: CreateNewsDto): Promise<NewsResponse> {
    const isPublished = dto.published ?? false;
    const publishedAt = this.resolvePublishedAt(isPublished, dto.publishedAt);

    const sanitizedTitle = this.sanitizePlainText(dto.title);
    const sanitizedSlug = dto.slug.trim();
    const sanitizedExcerpt = this.sanitizePlainText(dto.excerpt);
    const sanitizedContent = this.sanitizeRichText(dto.content);
    const sanitizedCoverImage = this.sanitizeCoverImage(dto.coverImage);

    const created = await this.newsDataService.create({
      title: sanitizedTitle,
      slug: sanitizedSlug,
      excerpt: sanitizedExcerpt,
      content: sanitizedContent,
      coverImage: sanitizedCoverImage,
      category: dto.category,
      published: isPublished,
      publishedAt,
      authorId: userId,
      updatedById: userId,
    });

    return this.mapToResponse(created);
  }

  async getNewsList(
    userId: number | undefined,
    query: {
      published?: boolean;
      limit?: number;
      offset?: number;
      searchQuery?: string;
      category?: NewsCategory;
    },
  ): Promise<NewsListResult> {
    const isAdmin = await this.isAdmin(userId);

    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;

    if (limit < 1 || limit > 100) {
      throw new BadRequestException('LIMIT_MUST_BE_BETWEEN_1_AND_100');
    }

    if (offset < 0) {
      throw new BadRequestException('OFFSET_MUST_BE_NON_NEGATIVE');
    }

    const filters: NewsListFilters = {
      limit,
      offset,
      searchQuery: query.searchQuery?.trim() || undefined,
      published: isAdmin ? query.published : true,
      category: query.category,
    };

    const result = await this.newsDataService.findMany(filters);

    return {
      items: result.items.map((item) => this.mapToResponse(item)),
      total: result.total,
      limit,
      offset,
    };
  }

  async getNewsBySlug(
    userId: number | undefined,
    slug: string,
  ): Promise<NewsResponse> {
    const isAdmin = await this.isAdmin(userId);
    const news = await this.newsDataService.findBySlug(slug, !isAdmin);

    if (!news) {
      throw new NotFoundException('NEWS_NOT_FOUND');
    }

    return this.mapToResponse(news);
  }

  async getAdjacentNewsBySlug(
    slug: string,
    limit = 2,
  ): Promise<AdjacentNewsResult> {
    if (limit < 1 || limit > 10) {
      throw new BadRequestException('LIMIT_MUST_BE_BETWEEN_1_AND_10');
    }

    const trimmedSlug = slug.trim();
    if (!trimmedSlug) {
      throw new BadRequestException('SLUG_IS_REQUIRED');
    }

    const adjacent = await this.newsDataService.findAdjacentBySlug(
      trimmedSlug,
      limit,
    );
    if (!adjacent) {
      throw new NotFoundException('NEWS_NOT_FOUND');
    }

    return {
      previous: adjacent.previous.map((item) => this.mapToResponse(item)),
      next: adjacent.next.map((item) => this.mapToResponse(item)),
    };
  }

  async getNewsById(id: number): Promise<NewsResponse> {
    const news = await this.newsDataService.findById(id);
    if (!news) {
      throw new NotFoundException('NEWS_NOT_FOUND');
    }

    return this.mapToResponse(news);
  }

  async updateNews(
    userId: number,
    id: number,
    dto: UpdateNewsDto,
  ): Promise<NewsResponse> {
    const existing = await this.newsDataService.findById(id);
    if (!existing) {
      throw new NotFoundException('NEWS_NOT_FOUND');
    }

    const nextPublishedAt = this.resolveUpdatedPublishedAt(
      existing.publishedAt,
      dto,
    );

    const updateData: Prisma.NewsUncheckedUpdateInput = {
      ...(dto.title !== undefined
        ? { title: this.sanitizePlainText(dto.title) }
        : {}),
      ...(dto.slug !== undefined ? { slug: dto.slug.trim() } : {}),
      ...(dto.excerpt !== undefined
        ? { excerpt: this.sanitizePlainText(dto.excerpt) }
        : {}),
      ...(dto.content !== undefined
        ? { content: this.sanitizeRichText(dto.content) }
        : {}),
      ...(dto.coverImage !== undefined
        ? { coverImage: this.sanitizeCoverImage(dto.coverImage) }
        : {}),
      ...(dto.category !== undefined ? { category: dto.category } : {}),
      ...(dto.published !== undefined ? { published: dto.published } : {}),
      ...(nextPublishedAt !== undefined
        ? { publishedAt: nextPublishedAt }
        : {}),
      updatedById: userId,
    };

    const updated = await this.newsDataService.update(id, updateData);
    return this.mapToResponse(updated);
  }

  async removeNews(id: number): Promise<void> {
    const existing = await this.newsDataService.findById(id);
    if (!existing) {
      throw new NotFoundException('NEWS_NOT_FOUND');
    }

    await this.newsDataService.delete(id);
  }

  private resolvePublishedAt(
    published: boolean,
    publishedAt?: string,
  ): Date | null {
    if (!published) {
      return null;
    }

    if (publishedAt) {
      return new Date(publishedAt);
    }

    return new Date();
  }

  private resolveUpdatedPublishedAt(
    currentPublishedAt: Date | null,
    dto: UpdateNewsDto,
  ): Date | null | undefined {
    if (dto.published === false) {
      return null;
    }

    if (dto.publishedAt !== undefined) {
      return new Date(dto.publishedAt);
    }

    if (dto.published === true && !currentPublishedAt) {
      return new Date();
    }

    return undefined;
  }

  private sanitizePlainText(value: string): string {
    const sanitized = sanitizeHtml(value, {
      allowedTags: [],
      allowedAttributes: {},
      disallowedTagsMode: 'discard',
    })
      .replace(/\s+/g, ' ')
      .trim();

    if (!sanitized) {
      throw new BadRequestException('NEWS_TEXT_CANNOT_BE_EMPTY');
    }

    return sanitized;
  }

  private sanitizeRichText(value: string): string {
    const sanitized = sanitizeHtml(value, NEWS_CONTENT_SANITIZE_OPTIONS).trim();

    const plainText = sanitizeHtml(sanitized, {
      allowedTags: [],
      allowedAttributes: {},
      disallowedTagsMode: 'discard',
    })
      .replace(/\s+/g, ' ')
      .trim();

    if (plainText.length < 20) {
      throw new BadRequestException('NEWS_CONTENT_TOO_SHORT_AFTER_SANITIZE');
    }

    return sanitized;
  }

  private sanitizeCoverImage(value?: string): string | undefined {
    if (value === undefined) {
      return undefined;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return undefined;
    }

    if (trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/')) {
      return trimmed;
    }

    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return trimmed;
      }
    } catch {
      // Fall through to explicit validation error.
    }

    throw new BadRequestException('INVALID_COVER_IMAGE_URL');
  }

  private mapToResponse(news: NewsWithRelations): NewsResponse {
    return {
      id: news.id,
      title: news.title,
      slug: news.slug,
      excerpt: news.excerpt,
      content: news.content,
      coverImage: news.coverImage || undefined,
      category: news.category,
      published: news.published,
      publishedAt: news.publishedAt || undefined,
      createdAt: news.createdAt,
      updatedAt: news.updatedAt,
      author: {
        id: news.author.id,
        nickName: news.author.nickName,
        fullName: news.author.fullName || undefined,
        logoUrl: news.author.logoUrl || undefined,
      },
      updatedBy: news.updatedBy
        ? {
            id: news.updatedBy.id,
            nickName: news.updatedBy.nickName,
            fullName: news.updatedBy.fullName || undefined,
          }
        : undefined,
    };
  }

  private async isAdmin(userId?: number): Promise<boolean> {
    if (!userId) {
      return false;
    }

    return this.aclService.can(userId, AclPermission.write, 'system', null);
  }
}
