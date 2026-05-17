import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CitiesModule } from '../cities/cities.module';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { StorageModule } from '../storage/storage.module';
import { Template, TemplateSchema } from './schemas/template.schema';
import { TemplateController } from './template.controller';
import { TemplateService } from './template.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Template.name, schema: TemplateSchema },
    ]),
    StorageModule,
    CitiesModule,
  ],
  controllers: [TemplateController],
  providers: [TemplateService, ApiKeyGuard],
  exports: [TemplateService],
})
export class TemplateModule {}
