import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ImageFileInterceptor } from '../common/config/file-upload.config';
import { Admin } from '../common/decorators/admin.decorator';
import { Public } from '../common/decorators/public.decorator';
import { User } from '../common/decorators/user.decorator';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { TemplateService } from './template.service';

@Controller('template')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  @Get(':key')
  @Public()
  @UseGuards(ApiKeyGuard)
  async getTemplate(@Param('key') key: string) {
    return this.templateService.getTemplateConfig(key);
  }

  @Post(':key')
  @Admin()
  async updateTemplate(
    @User() userId: number,
    @Param('key') key: string,
    @Body() body: { config: any },
  ) {
    const cfg = body.config as Record<string, unknown>;
    return this.templateService.createTemplate(userId, key, cfg);
  }

  @Patch(':key')
  @Admin()
  async patchTemplate(
    @User() userId: number,
    @Param('key') key: string,
    @Body() body: { config: Record<string, any> },
  ) {
    const partial = body.config as Record<string, unknown>;
    return this.templateService.patchTemplate(userId, key, partial);
  }

  @Post(':key/upload-image')
  @Admin()
  @UseInterceptors(ImageFileInterceptor)
  async uploadImage(
    @User() userId: number,
    @Param('key') key: string,
    @UploadedFile() file: Express.Multer.File,
    @Query('field') field?: string,
  ) {
    return this.templateService.uploadImage(userId, key, file, field);
  }
}
