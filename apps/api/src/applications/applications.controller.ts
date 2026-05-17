import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { Admin } from '../common/decorators/admin.decorator';
import { Application } from '../common/decorators/application.decorator';
import { User } from '../common/decorators/user.decorator';
import { ApplicationsService } from './applications.service';
import { ApplicationRequest } from './interfaces';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  async create(
    @User('userId') userId: number,
    @Body() data: ApplicationRequest,
  ) {
    return this.applicationsService.createApplication(userId, data);
  }

  @Get()
  async getAll(@User('userId') userId: number) {
    return this.applicationsService.getApplications(userId);
  }

  @Get(':id')
  @Admin()
  @Application('id')
  async getById(
    @User('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.applicationsService.get({ id });
  }

  @Patch(':id')
  @Admin()
  @Application('id')
  async update(
    @User('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: Partial<ApplicationRequest>,
  ) {
    return this.applicationsService.updateApplication(userId, id, data);
  }

  @Delete(':id')
  @Admin()
  @Application('id')
  async remove(
    @User('userId') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.applicationsService.removeApplication(userId, id);
  }
}
