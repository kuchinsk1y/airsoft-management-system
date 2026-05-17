import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { EmailProvider, EmailSendOptions } from './email-provider.interface';

export class NodemailerProvider implements EmailProvider {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async send({
    to,
    subject,
    html,
    attachments,
  }: EmailSendOptions): Promise<void> {
    await this.transporter.sendMail({
      from: process.env.SMTP_FROM,
      to,
      subject,
      html,
      attachments: attachments?.map((a) => ({
        filename: a.filename,
        content: a.content,
        contentType: a.contentType,
        cid:
          a.contentId && a.disposition === 'inline' ? a.contentId : undefined,
      })),
    });
  }
}
