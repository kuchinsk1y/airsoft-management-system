import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { DealType } from '../../generated/prisma-client';
import { ProductsRequest } from '../interfaces';

export class ProductsRequestDto implements ProductsRequest {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsNumber()
  @IsPositive()
  price: number;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  image: string;

  @IsBoolean()
  inStock: boolean;

  @IsBoolean()
  isActive: boolean;

  @IsEnum(DealType)
  @IsOptional()
  dealType?: DealType;

  @IsString()
  @IsOptional()
  city?: string;
}
