import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import sanitizeHtml from 'sanitize-html';
import { AclService } from '../acl/acl.service';
import {
  AclPermission,
  Prisma,
  WorkshopItemCategory,
} from '../generated/prisma-client';
import { CreateWorkshopItemDto } from './dto/create-workshop-item.dto';
import { UpdateWorkshopItemDto } from './dto/update-workshop-item.dto';
import {
  WorkshopItemListFilters,
  WorkshopItemListResult,
  WorkshopItemResponse,
  WorkshopItemWithRelations,
} from './interfaces';
import { WorkshopItemsDataService } from './workshop-items-data.service';

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

const WORKSHOP_ITEM_CONTENT_SANITIZE_OPTIONS: sanitizeHtml.IOptions = {
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
export class WorkshopItemsService {
  constructor(
    private readonly workshopItemsDataService: WorkshopItemsDataService,
    private readonly aclService: AclService,
  ) {}

  async createWorkshopItem(
    userId: number,
    dto: CreateWorkshopItemDto,
  ): Promise<WorkshopItemResponse> {
    const isPublished = dto.published ?? false;
    const publishedAt = this.resolvePublishedAt(isPublished, dto.publishedAt);

    const created = await this.workshopItemsDataService.create({
      title: this.sanitizePlainText(dto.title),
      slug: dto.slug.trim(),
      excerpt: this.sanitizePlainText(dto.excerpt),
      content: this.sanitizeRichText(dto.content),
      coverImage: this.sanitizeCoverImage(dto.coverImage),
      category: dto.category,
      published: isPublished,
      publishedAt,
      authorId: userId,
      updatedById: userId,
    });

    return this.mapToResponse(created);
  }

  async getWorkshopItemList(
    userId: number | undefined,
    query: {
      published?: boolean;
      limit?: number;
      offset?: number;
      searchQuery?: string;
      category?: WorkshopItemCategory;
    },
  ): Promise<WorkshopItemListResult> {
    const isAdmin = await this.isAdmin(userId);

    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;

    if (limit < 1 || limit > 100) {
      throw new BadRequestException('LIMIT_MUST_BE_BETWEEN_1_AND_100');
    }

    if (offset < 0) {
      throw new BadRequestException('OFFSET_MUST_BE_NON_NEGATIVE');
    }

    const filters: WorkshopItemListFilters = {
      limit,
      offset,
      searchQuery: query.searchQuery?.trim() || undefined,
      published: isAdmin ? query.published : true,
      category: query.category,
    };

    const result = await this.workshopItemsDataService.findMany(filters);

    return {
      items: result.items.map((item) => this.mapToResponse(item)),
      total: result.total,
      limit,
      offset,
    };
  }

  async getWorkshopItemBySlug(
    userId: number | undefined,
    slug: string,
  ): Promise<WorkshopItemResponse> {
    const isAdmin = await this.isAdmin(userId);
    const item = await this.workshopItemsDataService.findBySlug(slug, !isAdmin);

    if (!item) {
      throw new NotFoundException('WORKSHOP_ITEM_NOT_FOUND');
    }

    return this.mapToResponse(item);
  }

  async getWorkshopItemById(id: number): Promise<WorkshopItemResponse> {
    const item = await this.workshopItemsDataService.findById(id);
    if (!item) {
      throw new NotFoundException('WORKSHOP_ITEM_NOT_FOUND');
    }

    return this.mapToResponse(item);
  }

  async updateWorkshopItem(
    userId: number,
    id: number,
    dto: UpdateWorkshopItemDto,
  ): Promise<WorkshopItemResponse> {
    const existing = await this.workshopItemsDataService.findById(id);
    if (!existing) {
      throw new NotFoundException('WORKSHOP_ITEM_NOT_FOUND');
    }

    const nextPublishedAt = this.resolveUpdatedPublishedAt(
      existing.publishedAt,
      dto,
    );

    const updateData: Prisma.WorkshopItemUncheckedUpdateInput = {
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

    const updated = await this.workshopItemsDataService.update(id, updateData);
    return this.mapToResponse(updated);
  }

  async removeWorkshopItem(id: number): Promise<void> {
    const existing = await this.workshopItemsDataService.findById(id);
    if (!existing) {
      throw new NotFoundException('WORKSHOP_ITEM_NOT_FOUND');
    }

    await this.workshopItemsDataService.delete(id);
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
    dto: UpdateWorkshopItemDto,
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
      throw new BadRequestException('WORKSHOP_ITEM_TEXT_CANNOT_BE_EMPTY');
    }

    return sanitized;
  }

  private sanitizeRichText(value: string): string {
    const sanitized = sanitizeHtml(
      value,
      WORKSHOP_ITEM_CONTENT_SANITIZE_OPTIONS,
    ).trim();

    const plainText = sanitizeHtml(sanitized, {
      allowedTags: [],
      allowedAttributes: {},
      disallowedTagsMode: 'discard',
    })
      .replace(/\s+/g, ' ')
      .trim();

    if (plainText.length < 20) {
      throw new BadRequestException(
        'WORKSHOP_ITEM_CONTENT_TOO_SHORT_AFTER_SANITIZE',
      );
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

  private mapToResponse(item: WorkshopItemWithRelations): WorkshopItemResponse {
    return {
      id: item.id,
      title: item.title,
      slug: item.slug,
      excerpt: item.excerpt,
      content: item.content,
      coverImage: item.coverImage || undefined,
      category: item.category,
      published: item.published,
      publishedAt: item.publishedAt || undefined,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
      author: {
        id: item.author.id,
        nickName: item.author.nickName,
        fullName: item.author.fullName || undefined,
        logoUrl: item.author.logoUrl || undefined,
      },
      updatedBy: item.updatedBy
        ? {
            id: item.updatedBy.id,
            nickName: item.updatedBy.nickName,
            fullName: item.updatedBy.fullName || undefined,
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
