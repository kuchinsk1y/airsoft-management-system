import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma-client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ServiceDataService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.ServiceCreateInput) {
    return this.prisma.service.create({
      data,
    });
  }

  async findMany(filters: Prisma.ServiceWhereInput) {
    return this.prisma.service.findMany({ where: { ...filters } });
  }

  async count(filters: Prisma.ServiceWhereInput) {
    return this.prisma.service.count({ where: { ...filters } });
  }

  async findOne(id: number) {
    return this.prisma.service.findUnique({
      where: { id },
    });
  }

  async update(id: number, data: Prisma.ServiceUpdateInput) {
    return this.prisma.service.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    return this.prisma.service.delete({
      where: { id },
    });
  }
}
