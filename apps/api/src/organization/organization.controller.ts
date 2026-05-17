import { Body, Controller, Get, Header, Put } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationResponseDto } from './dto/organization-response.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { Admin } from '../common/decorators/admin.decorator';
import { Public } from '../common/decorators/public.decorator';

const ORGANIZATION_CACHE_CONTROL = 'no-store, no-cache, must-revalidate';

@Controller('organization')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Public()
  @Get()
  @Header('Cache-Control', ORGANIZATION_CACHE_CONTROL)
  async getOrganization(): Promise<OrganizationResponseDto> {
    return this.organizationService.getOrganization();
  }

  @Admin()
  @Put()
  async updateOrganization(
    @Body() data: UpdateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    return this.organizationService.updateOrganization(data);
  }
}
