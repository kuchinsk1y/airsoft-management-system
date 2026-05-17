import { BaseResponseDto } from '../../common/dto/base-response.dto';
import { DealType, ProductsResponse } from '../interfaces';

export class ProductsResponseDto
  extends BaseResponseDto<ProductsResponse>
  implements ProductsResponse
{
  id: number;
  name: string;
  slug: string;
  price: number;
  description: string;
  image: string;
  inStock: boolean;
  isActive: boolean;
  dealType: DealType;
  cityId?: number;
  city?: {
    id: number;
    name: string;
    slug: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
