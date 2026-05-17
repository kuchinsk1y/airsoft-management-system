export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentId?: string;
  contentType?: string;
  disposition?: 'inline' | 'attachment';
}

export interface EmailSendOptions {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
  metadata?: {
    phone?: string;
    event_date?: string;
    [key: string]: string | number | boolean | undefined;
  };
}

export interface EmailProvider {
  send(options: EmailSendOptions): Promise<void>;
}
