import sgMail from '@sendgrid/mail';
import { EmailProvider, EmailSendOptions } from './email-provider.interface';

export class SendGridProvider implements EmailProvider {
  constructor(
    apiKey: string,
    private readonly from: string,
  ) {
    sgMail.setApiKey(apiKey);
  }

  async send({
    to,
    subject,
    html,
    attachments,
  }: EmailSendOptions): Promise<void> {
    await sgMail.send({
      to,
      from: this.from,
      subject,
      html,
      attachments: attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content.toString('base64'),
        type: attachment.contentType ?? 'application/octet-stream',
        disposition: attachment.disposition ?? 'attachment',
        ...(attachment.contentId && attachment.disposition === 'inline'
          ? { content_id: attachment.contentId }
          : {}),
      })),
    });
  }
}
