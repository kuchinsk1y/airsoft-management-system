import { Injectable, NotFoundException } from '@nestjs/common';
import { CitiesService } from '../cities/cities.service';
import { DealType, Prisma } from '../generated/prisma-client';
import { PrismaService } from '../prisma/prisma.service';
import { generateSlug } from '../utils/slug';
import {
  ProductsFilters,
  ProductsRequest,
  ProductsResponse,
  ProductsWithCity,
} from './interfaces';

@Injectable()
export class ProductsDataService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly citiesService: CitiesService,
  ) {}

  private async buildUniqueSlug(
    source: string,
    excludeId?: number,
  ): Promise<string> {
    const baseSlug = generateSlug(source.trim()) || 'product';
    const existingProducts: Array<{ slug: string }> =
      await this.prisma.product.findMany({
        where: {
          slug: { startsWith: baseSlug },
          ...(excludeId ? { id: { not: excludeId } } : {}),
        },
        select: {
          slug: true,
        },
      });

    const takenSlugs = new Set<string>(
      existingProducts.map((product) => product.slug),
    );
    if (!takenSlugs.has(baseSlug)) {
      return baseSlug;
    }

    let suffix = 2;
    while (takenSlugs.has(`${baseSlug}-${suffix}`)) {
      suffix += 1;
    }

    return `${baseSlug}-${suffix}`;
  }

  private mapProductToResponse(product: ProductsWithCity): ProductsResponse {
    return {
      ...product,
      cityId: product.cityId ?? undefined,
      city: product.city
        ? {
            id: product.city.id,
            name: product.city.name,
            slug: product.city.slug,
          }
        : undefined,
    };
  }

  async findById(id: number): Promise<ProductsResponse> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        city: true,
      },
    });

    if (!product) {
      throw new NotFoundException('PRODUCT_NOT_FOUND');
    }

    return this.mapProductToResponse(product);
  }

  async findBySlug(slug: string): Promise<ProductsResponse> {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        city: true,
      },
    });

    if (!product) {
      throw new NotFoundException('PRODUCT_NOT_FOUND');
    }

    return this.mapProductToResponse(product);
  }

  async findMany(filters: ProductsFilters = {}): Promise<ProductsResponse[]> {
    const where: Prisma.ProductWhereInput = {
      isActive: filters.isActive ?? true,
    };

    if (filters.dealType) {
      where.dealType = filters.dealType;
    }

    if (filters.ids && filters.ids.length > 0) {
      where.id = { in: filters.ids };
    }

    if (filters.inStock !== undefined) {
      where.inStock = filters.inStock;
    }

    const andConditions: any[] = [];

    if (filters.cityId || filters.citySlug || filters.city) {
      const cityConditions: any[] = [];

      if (filters.cityId) {
        cityConditions.push({ cityId: filters.cityId });
      }

      if (filters.citySlug || filters.city) {
        cityConditions.push({
          city: {
            OR: [
              ...(filters.citySlug ? [{ slug: filters.citySlug }] : []),
              ...(filters.city ? [{ name: filters.city }] : []),
            ],
          },
        });
      }

      if (cityConditions.length > 0) {
        andConditions.push({ OR: cityConditions });
      }
    }

    if (filters.regionSlug) {
      andConditions.push({
        city: { region: { slug: filters.regionSlug } },
      });
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      const priceFilter: { gte?: number; lte?: number } = {};
      if (filters.minPrice !== undefined) {
        priceFilter.gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        priceFilter.lte = filters.maxPrice;
      }
      Object.assign(where, { price: priceFilter });
    }

    if (filters.searchQuery) {
      const searchQuery = filters.searchQuery.trim();
      if (searchQuery) {
        andConditions.push({
          OR: [
            { name: { contains: searchQuery } },
            { description: { contains: searchQuery } },
          ],
        });
      }
    }

    if (andConditions.length > 0) {
      Object.assign(where, { AND: andConditions });
    }

    let orderBy: Record<string, 'asc' | 'desc'> = { createdAt: 'desc' };
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'price-low':
          orderBy = { price: 'asc' };
          break;
        case 'price-high':
          orderBy = { price: 'desc' };
          break;
        case 'name':
          orderBy = { name: 'asc' };
          break;
        case 'recommended':
        default:
          orderBy = { createdAt: 'desc' };
          break;
      }
    }

    const products = await this.prisma.product.findMany({
      where,
      orderBy,
      include: {
        city: true,
      },
    });

    return products.map((product) => this.mapProductToResponse(product));
  }

  async create(data: ProductsRequest): Promise<ProductsResponse> {
    let cityId: number | undefined;
    if (data.city) {
      cityId = await this.citiesService.getOrCreateCity(data.city);
    }

    const slug = await this.buildUniqueSlug(data.slug || data.name);

    const product = await this.prisma.product.create({
      data: {
        name: data.name,
        slug,
        price: data.price,
        description: data.description,
        image: data.image,
        inStock: data.inStock,
        isActive: data.isActive,
        dealType: data.dealType || DealType.RENT,
        cityId,
      },
      include: {
        city: true,
      },
    });

    return this.mapProductToResponse(product);
  }

  async update(
    id: number,
    data: Partial<ProductsRequest>,
  ): Promise<ProductsResponse> {
    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
    });
    if (!existingProduct) throw new NotFoundException('PRODUCT_NOT_FOUND');

    const updateData: Record<string, any> = { ...data };

    if (data.name && !data.slug) {
      updateData.slug = await this.buildUniqueSlug(data.name, id);
    } else if (data.slug) {
      updateData.slug = await this.buildUniqueSlug(data.slug, id);
    }

    if (data.city !== undefined) {
      if (data.city) {
        updateData.cityId = await this.citiesService.getOrCreateCity(data.city);
      } else {
        updateData.cityId = null;
      }
      delete updateData.city;
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        city: true,
      },
    });

    return this.mapProductToResponse(updatedProduct);
  }

  async delete(id: number): Promise<void> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('PRODUCT_NOT_FOUND');
    await this.prisma.product.delete({ where: { id } });
  }
}
