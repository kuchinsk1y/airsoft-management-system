import {
  Controller,
  Get,
  Header,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { createReadStream, existsSync } from 'fs';
import { join } from 'path';
import { Public } from '../common/decorators/public.decorator';

@Controller('email-assets')
@Public()
export class EmailAssetsController {
  @Get('top-logo.svg')
  @Header('Content-Type', 'image/svg+xml')
  @Header('Cache-Control', 'public, max-age=86400')
  topLogo(): StreamableFile {
    return this.streamSvg('TopLogo.svg');
  }

  @Get('footer-logo.svg')
  @Header('Content-Type', 'image/svg+xml')
  @Header('Cache-Control', 'public, max-age=86400')
  footerLogo(): StreamableFile {
    return this.streamSvg('Logo_Footer.svg');
  }

  private streamSvg(fileName: string): StreamableFile {
    const p = this.resolvePublicFile(fileName);
    if (!p) {
      throw new NotFoundException(`Email asset not found: ${fileName}`);
    }
    return new StreamableFile(createReadStream(p));
  }

  private resolvePublicFile(fileName: string): string | null {
    const roots = [
      join(process.cwd(), 'apps', 'web', 'public'),
      join(process.cwd(), '..', 'web', 'public'),
      join(process.cwd(), '..', '..', 'apps', 'web', 'public'),
    ];
    for (const base of roots) {
      const p = join(base, fileName);
      if (existsSync(p)) {
        return p;
      }
    }
    return null;
  }
}
