import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  OrderEventRequest,
  OrderProductRequest,
  OrderRequest,
} from '../interfaces';

export class OrderProductRequestDto implements OrderProductRequest {
  @IsInt()
  productId: number;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  price: number;
}

export class OrderEventRequestDto implements OrderEventRequest {
  @IsInt()
  @Type(() => Number)
  eventId: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  eventSideId?: number | null;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsInt()
  teamId?: number;

  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  selectedMemberIds?: number[];
}

export class OrderRequestDto implements OrderRequest {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderProductRequestDto)
  products?: OrderProductRequestDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderEventRequestDto)
  events?: OrderEventRequestDto[];

  @IsEnum(['BANK', 'CASH'])
  paymentMethod: 'BANK' | 'CASH';
}
