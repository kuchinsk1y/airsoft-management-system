import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma-client';
import { UpdateServiceDto } from './dto/update-service.dto';
import { CreateServiceOrder, ServiceFilter } from './interface';
import { ServiceDataService } from './service-data.service';

@Injectable()
export class ServiceService {
  constructor(private readonly serviceDataService: ServiceDataService) {}

  private buildWhere(filter: ServiceFilter): Prisma.ServiceWhereInput {
    const where: Prisma.ServiceWhereInput = {};

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.searchQuery) {
      const search = filter.searchQuery.trim();

      const orConditions: Prisma.ServiceWhereInput[] = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search } },
      ];

      const isPureDigits = /^\d+$/.test(search);

      if (isPureDigits && search.length < 10) {
        const searchNumber = parseInt(search, 10);
        const PG_INT_MAX = 2147483647;

        if (searchNumber <= PG_INT_MAX) {
          orConditions.push({ id: searchNumber });
        }
      }

      where.OR = orConditions;
    }

    return where;
  }

  create(data: CreateServiceOrder) {
    return this.serviceDataService.create(data);
  }

  findAll(filter: ServiceFilter) {
    const where = this.buildWhere(filter);
    return this.serviceDataService.findMany(where);
  }

  count(filter: ServiceFilter) {
    const where = this.buildWhere(filter);
    return this.serviceDataService.count(where);
  }

  findOne(id: number) {
    return this.serviceDataService.findOne(id);
  }

  update(id: number, updateServiceDto: UpdateServiceDto) {
    return this.serviceDataService.update(id, updateServiceDto);
  }

  remove(id: number) {
    return this.serviceDataService.remove(id);
  }
}
