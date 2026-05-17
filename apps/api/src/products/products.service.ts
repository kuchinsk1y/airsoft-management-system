import { BadRequestException, Injectable } from '@nestjs/common';
import { StorageService } from '../storage/storage.service';
import {
  ProductsFilters,
  ProductsRequest,
  ProductsResponse,
} from './interfaces';
import { ProductsDataService } from './products-data.service';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productsDataService: ProductsDataService,
    private readonly storageService: StorageService,
  ) {}

  async createProduct(
    userId: number,
    data: ProductsRequest,
  ): Promise<ProductsResponse> {
    return await this.productsDataService.create(data);
  }

  async getProduct(id: number): Promise<ProductsResponse> {
    return this.productsDataService.findById(id);
  }

  async getProductBySlug(slug: string): Promise<ProductsResponse> {
    return this.productsDataService.findBySlug(slug);
  }

  async getProducts(filters?: ProductsFilters): Promise<ProductsResponse[]> {
    return this.productsDataService.findMany(filters);
  }

  async updateProduct(
    userId: number,
    id: number,
    data: Partial<ProductsRequest>,
  ): Promise<ProductsResponse> {
    return this.productsDataService.update(id, data);
  }

  async removeProduct(userId: number, id: number): Promise<void> {
    await this.productsDataService.delete(id);
  }

  async uploadProductImage(
    userId: number,
    productId: number,
    file: Express.Multer.File,
  ): Promise<{ url: string; product: ProductsResponse }> {
    if (!file) {
      throw new BadRequestException('NO_FILE_PROVIDED');
    }

    const product = await this.getProduct(productId);

    const saved = await this.storageService.save(
      file.buffer,
      file.originalname,
      file.mimetype,
    );

    const updatedProduct = await this.updateProduct(userId, productId, {
      image: saved.url,
    });

    if (product.image) {
      const oldKey = this.storageService.extractKeyFromUrl(product.image);
      await this.storageService.remove(oldKey);
    }

    return {
      url: saved.url,
      product: updatedProduct,
    };
  }
}
