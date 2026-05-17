import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { existsSync, readFileSync } from 'fs';
import * as handlebars from 'handlebars';
import { join } from 'path';
import { EMAIL_PROVIDER } from './email.providers';
import { EmailAttachment, EmailRequest, EmailResponse } from './interfaces';
import {
  EmailProvider,
  EmailSendOptions,
} from './providers/email-provider.interface';

declare const __dirname: string;

let handlebarsEmailGlobalsRegistered = false;

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    @Inject(EMAIL_PROVIDER)
    private readonly provider: EmailProvider,
    private readonly config: ConfigService,
  ) {}

  async send(data: EmailRequest): Promise<EmailResponse> {
    const { email, metadata, body } = data;
    const { template, subject, ...rest } = metadata;

    if (!subject) {
      throw new BadRequestException('SUBJECT_MUST_BE_PROVIDED_IN_METADATA');
    }

    const templateName = template || 'notification';
    const rawBase = this.config.get<string>('FRONTEND_BASE_URL') ?? '';
    const siteUrl = rawBase.replace(/\/$/, '');
    const { headerLogoUrl, footerLogoUrl } = this.resolveEmailLogoUrls();
    const templateData = {
      ...rest,
      body,
      subject,
      siteUrl,
      currentYear: new Date().getFullYear(),
      headerLogoUrl,
      footerLogoUrl,
    };

    if (templateName === 'verify') {
      this.logger.debug(
        `Rendering verify template, frontendUrl: ${templateData.frontendUrl}`,
      );
    }

    const html = this.renderTemplate(templateName, templateData);

    const sendOptions: EmailSendOptions = {
      to: email,
      subject,
      html,
      metadata: {
        ...rest,
        phone: rest.phone as string | undefined,
        event_date: rest.event_date as string | undefined,
      },
    };
    const mergedAttachments: EmailAttachment[] = [...(data.attachments ?? [])];
    if (mergedAttachments.length > 0) {
      sendOptions.attachments = mergedAttachments;
    }
    await this.provider.send(sendOptions);

    return { success: true };
  }

  private resolveEmailLogoUrls(): {
    headerLogoUrl: string;
    footerLogoUrl: string;
  } {
    const rawApi = this.config.get<string>('APP_BASE_URL') ?? '';
    const apiBase = rawApi.replace(/\/$/, '');
    const headerExplicit = this.config
      .get<string>('EMAIL_HEADER_LOGO_URL')
      ?.trim();
    const footerExplicit = this.config
      .get<string>('EMAIL_FOOTER_LOGO_URL')
      ?.trim();
    return {
      headerLogoUrl: (
        headerExplicit || `${apiBase}/email-assets/top-logo.svg`
      ).replace(/\/$/, ''),
      footerLogoUrl: (
        footerExplicit || `${apiBase}/email-assets/footer-logo.svg`
      ).replace(/\/$/, ''),
    };
  }

  private resolvePartialPath(partialName: string): string {
    const candidates = [
      join(__dirname, 'partials', `${partialName}.hbs`),
      join(
        process.cwd(),
        'apps',
        'api',
        'src',
        'email',
        'partials',
        `${partialName}.hbs`,
      ),
      join(process.cwd(), 'src', 'email', 'partials', `${partialName}.hbs`),
      join(__dirname, '..', 'email', 'partials', `${partialName}.hbs`),
      join(
        __dirname,
        '..',
        '..',
        'src',
        'email',
        'partials',
        `${partialName}.hbs`,
      ),
    ];
    const found = candidates.find((p) => existsSync(p));
    if (!found) {
      throw new BadRequestException(
        `Email partial not found: ${partialName}.hbs`,
      );
    }
    return found;
  }

  private ensureHandlebarsEmailGlobals(): void {
    if (handlebarsEmailGlobalsRegistered) {
      return;
    }
    handlebars.registerHelper('encodeURIComponent', function (str: string) {
      return encodeURIComponent(str);
    });
    handlebars.registerHelper('concat', function (...args: unknown[]) {
      const parts = args.slice(0, -1);
      return parts.map(String).join('');
    });
    handlebars.registerHelper('stripLinks', function (html: unknown) {
      if (html == null) {
        return '';
      }
      return String(html).replace(/<a\b[^>]*>([\s\S]*?)<\/a>/gi, '$1');
    });
    handlebarsEmailGlobalsRegistered = true;
  }

  renderTemplate(templateName: string, data: Record<string, any>) {
    this.ensureHandlebarsEmailGlobals();
    const strikePartial = readFileSync(
      this.resolvePartialPath('strike-email'),
      'utf-8',
    );
    handlebars.registerPartial('strike-email', strikePartial);

    let filePath = join(__dirname, 'templates', `${templateName}.hbs`);

    if (!existsSync(filePath)) {
      const possiblePaths = [
        join(
          process.cwd(),
          'apps',
          'api',
          'src',
          'email',
          'templates',
          `${templateName}.hbs`,
        ),
        join(process.cwd(), 'src', 'email', 'templates', `${templateName}.hbs`),
        join(
          __dirname,
          '..',
          '..',
          'src',
          'email',
          'templates',
          `${templateName}.hbs`,
        ),
        join(__dirname, '..', 'email', 'templates', `${templateName}.hbs`),
      ];

      const foundPath = possiblePaths.find((path) => existsSync(path));
      if (foundPath) {
        filePath = foundPath;
      } else {
        this.logger.error(
          `Email template not found: ${templateName}.hbs. Searched in: ${possiblePaths.join(', ')}`,
        );
        throw new BadRequestException(
          `Email template not found: ${templateName}.hbs`,
        );
      }
    }

    const source = readFileSync(filePath, 'utf-8');

    const compiled = handlebars.compile(source);

    if (data.token && typeof data.token === 'string') {
      data.token = encodeURIComponent(data.token);
    }

    return compiled(data);
  }
}
