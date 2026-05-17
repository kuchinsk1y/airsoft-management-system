import { BadRequestException } from '@nestjs/common';
import { NewsService } from './news.service';
import { NewsWithRelations } from './interfaces';

const buildNews = (
  overrides: Partial<NewsWithRelations> = {},
): NewsWithRelations => {
  return {
    id: 1,
    title: 'Default title',
    slug: 'default-title',
    excerpt: 'Default excerpt text for testing',
    content: '<p>Default content with enough text length for tests.</p>',
    coverImage: null,
    category: 'AIRSOFT',
    published: false,
    publishedAt: null,
    authorId: 7,
    updatedById: 7,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    author: {
      id: 7,
      nickName: 'admin',
      fullName: 'Admin User',
      logoUrl: null,
    },
    updatedBy: {
      id: 7,
      nickName: 'admin',
      fullName: 'Admin User',
    },
    ...overrides,
  } as NewsWithRelations;
};

describe('NewsService security sanitization', () => {
  const newsDataService = {
    create: jest.fn(),
    update: jest.fn(),
    findById: jest.fn(),
    findBySlug: jest.fn(),
    findMany: jest.fn(),
    delete: jest.fn(),
  };

  const aclService = {
    can: jest.fn(),
  };

  let service: NewsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new NewsService(newsDataService as never, aclService as never);
  });

  it('sanitizes scripts, event handlers and javascript links on create', async () => {
    newsDataService.create.mockImplementation(async (data) =>
      buildNews({
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt,
        content: data.content,
        coverImage: data.coverImage ?? null,
        published: data.published,
        publishedAt: data.publishedAt ?? null,
      }),
    );

    await service.createNews(7, {
      title: 'Test <img src=x onerror=alert(1)> title',
      slug: 'test-news',
      excerpt: 'Excerpt with <script>alert(1)</script> some extra text',
      content:
        '<p>Long enough content before payload to keep validation happy.</p>' +
        '<script>alert(1)</script>' +
        '<img src="https://safe.example/image.jpg" onerror="alert(1)" />' +
        '<a href="javascript:alert(1)" target="_blank">bad link</a>' +
        '<a href="https://example.com" target="_blank">good link</a>',
      coverImage: 'https://example.com/cover.jpg',
      category: 'AIRSOFT',
      published: true,
    });

    expect(newsDataService.create).toHaveBeenCalledTimes(1);
    const createData = newsDataService.create.mock.calls[0][0];
    const sanitizedContent = String(createData.content);

    expect(sanitizedContent).not.toContain('<script');
    expect(sanitizedContent.toLowerCase()).not.toContain('onerror=');
    expect(sanitizedContent.toLowerCase()).not.toContain('javascript:');
    expect(sanitizedContent).toContain('href="https://example.com"');
    expect(sanitizedContent).toContain('rel="noopener noreferrer"');
  });

  it('strips javascript href variants on update', async () => {
    newsDataService.findById.mockResolvedValue(buildNews());
    newsDataService.update.mockImplementation(async (_id, data) =>
      buildNews({
        content: data.content as string,
      }),
    );

    await service.updateNews(7, 1, {
      content:
        '<p>This update has enough visible text to pass minimal length checks.</p>' +
        '<a href="JaVaScRiPt:alert(1)" target="_blank">bad mixed case link</a>',
    });

    expect(newsDataService.update).toHaveBeenCalledTimes(1);
    const updateData = newsDataService.update.mock.calls[0][1];
    const sanitizedContent = String(updateData.content);

    expect(sanitizedContent.toLowerCase()).not.toContain('javascript:');
    expect(sanitizedContent).toContain('bad mixed case link');
  });

  it('rejects javascript cover image URL', async () => {
    await expect(
      service.createNews(7, {
        title: 'Safe title for cover validation test',
        slug: 'safe-title-for-cover-validation-test',
        excerpt: 'Safe excerpt content with enough length',
        content:
          '<p>Safe content that has enough plain text length for validation.</p>',
        coverImage: 'javascript:alert(1)',
        category: 'STRIKESHOP',
      }),
    ).rejects.toThrow(BadRequestException);

    expect(newsDataService.create).not.toHaveBeenCalled();
  });
});
