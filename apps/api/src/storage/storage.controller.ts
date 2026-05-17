import {
  Controller,
  Delete,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ImageFileInterceptor } from '../common/config/file-upload.config';
import { StorageResponseDto } from './dto/storage-response.dto';
import { StorageService } from './storage.service';

@Controller('storage')
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  @UseInterceptors(ImageFileInterceptor)
  async upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Query('filename') filename?: string,
  ): Promise<StorageResponseDto> {
    const saved = await this.storageService.uploadFile(file, filename);
    return new StorageResponseDto(saved);
  }

  @Delete('remove')
  async remove(
    @Query('key') key: string | undefined,
  ): Promise<{ success: boolean }> {
    return this.storageService.remove(key);
  }
}
