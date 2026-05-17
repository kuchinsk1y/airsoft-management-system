import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ServiceService } from './service.service';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceRequestDto } from './dto/service-request.dto';
import { Public } from '../common/decorators/public.decorator';
import { Admin } from '../common/decorators/admin.decorator';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { GetServicesFilterDto } from './dto/get-services-filter.dto';

@Controller('services')
export class ServiceController {
  constructor(private readonly serviceService: ServiceService) {}

  @Public()
  @UseGuards(ApiKeyGuard)
  @Post()
  create(@Body() serviceRequestDto: ServiceRequestDto) {
    return this.serviceService.create(serviceRequestDto);
  }

  @Get()
  @Admin()
  findAll(@Query() filter: GetServicesFilterDto) {
    return this.serviceService.findAll(filter);
  }

  @Get('count')
  @Admin()
  count(@Query() filter: GetServicesFilterDto) {
    return this.serviceService.count(filter).then((count) => ({ count }));
  }

  @Get(':id')
  @Admin()
  findOne(@Param('id') id: string) {
    return this.serviceService.findOne(+id);
  }

  @Patch(':id')
  @Admin()
  update(@Param('id') id: string, @Body() updateServiceDto: UpdateServiceDto) {
    return this.serviceService.update(+id, updateServiceDto);
  }

  @Delete(':id')
  @Admin()
  remove(@Param('id') id: string) {
    return this.serviceService.remove(+id);
  }
}
