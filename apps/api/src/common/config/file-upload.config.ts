import { BadRequestException } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_IMAGE_FILES = 30;

export const ALLOWED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
];

export const imageFileFilter = (
  _: any,
  file: Express.Multer.File,
  cb: (error: Error | null, acceptFile: boolean) => void,
) => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    return cb(new BadRequestException('INVALID_FILE_TYPE'), false);
  }
  cb(null, true);
};

export const ImageFileInterceptor = FileInterceptor('file', {
  storage: memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: imageFileFilter,
});

export const MultipleImageFilesInterceptor = FilesInterceptor(
  'files',
  MAX_IMAGE_FILES,
  {
    storage: memoryStorage(),
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: imageFileFilter,
  },
);
