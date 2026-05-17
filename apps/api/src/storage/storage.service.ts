import { BadRequestException, Injectable } from '@nestjs/common';
import { del, put } from '@vercel/blob';
import { promises as fs } from 'fs';
import { join } from 'path';
import sharp from 'sharp';
import {
  APP_BASE_URL,
  BLOB_READ_WRITE_TOKEN,
  STORAGE_DRIVER,
} from '../utils/config';
import { StorageDriver, StorageResponse } from './interfaces';

const IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
const MAX_IMAGE_WIDTH = 1920;
const WEBP_QUALITY = 85;

@Injectable()
export class StorageService {
  private readonly driver: StorageDriver;
  private readonly uploadDir = join(process.cwd(), 'uploads');
  private readonly baseUrl = APP_BASE_URL;

  constructor() {
    this.driver =
      STORAGE_DRIVER === 'vercel' && BLOB_READ_WRITE_TOKEN
        ? StorageDriver.VERCEL
        : StorageDriver.LOCAL;

    fs.mkdir(this.uploadDir, { recursive: true }).catch(() => void 0);
  }

  private async optimizeImage(buffer: Buffer, mimetype: string): Promise<{ buffer: Buffer; mimetype: string; ext: string }> {
    if (!IMAGE_MIME_TYPES.includes(mimetype)) {
      return { buffer, mimetype, ext: '' };
    }
    const optimized = await sharp(buffer)
      .resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
    return { buffer: optimized, mimetype: 'image/webp', ext: '.webp' };
  }

  private replaceExt(filename: string, newExt: string): string {
    const lastDot = filename.lastIndexOf('.');
    const base = lastDot !== -1 ? filename.slice(0, lastDot) : filename;
    return `${base}${newExt}`;
  }

  async uploadFile(
    file: Express.Multer.File | undefined,
    filename?: string,
  ): Promise<StorageResponse> {
    if (!file) {
      throw new BadRequestException('NO_FILE_PROVIDED');
    }

    const finalFilename = filename?.trim() || file.originalname;
    const { buffer, mimetype, ext } = await this.optimizeImage(file.buffer, file.mimetype);
    const optimizedFilename = ext ? this.replaceExt(finalFilename, ext) : finalFilename;
    return this.save(buffer, optimizedFilename, mimetype);
  }

  async save(
    buffer: Buffer,
    filename: string,
    contentType?: string,
  ): Promise<StorageResponse> {
    const finalContentType = contentType || 'application/octet-stream';
    const finalFilename = filename || 'file';
    const finalBuffer = buffer;

    if (this.driver === StorageDriver.VERCEL) {
      const pathname = this.timestampedKey(finalFilename);
      const blob = await put(pathname, finalBuffer, {
        access: 'public',
        contentType: finalContentType,
        token: BLOB_READ_WRITE_TOKEN,
      });
      return {
        url: blob.url,
        key: blob.url,
        filename: finalFilename,
        contentType: finalContentType,
        size: finalBuffer.length,
      };
    }

    const key = this.timestampedKey(finalFilename);
    const filePath = join(this.uploadDir, key);
    await fs.writeFile(filePath, finalBuffer);
    const url = `/uploads/${key}`;
    return {
      url,
      key,
      filename: finalFilename,
      contentType: finalContentType,
      size: finalBuffer.length,
    };
  }

  async remove(key: string | undefined): Promise<{ success: boolean }> {
    if (!key) {
      throw new BadRequestException('KEY_REQUIRED');
    }

    if (this.driver === StorageDriver.VERCEL) {
      try {
        await del(key, { token: BLOB_READ_WRITE_TOKEN });
        return { success: true };
      } catch {
        return { success: false };
      }
    }

    const filePath = join(this.uploadDir, key);
    try {
      await fs.unlink(filePath);
      return { success: true };
    } catch {
      return { success: false };
    }
  }

  private safeKey(name: string) {
    return name.replace(/[^\w.-]+/g, '_');
  }
  private timestampedKey(name: string) {
    const safe = this.safeKey(name);
    const ts = Date.now();
    return `${ts}-${safe}`;
  }

  extractKeyFromUrl(url: string): string {
    if (
      url.includes('blob.vercel-storage.com') ||
      url.includes('vercel-storage.com')
    ) {
      return url;
    }
    return url.split('/').pop() || url;
  }
}
