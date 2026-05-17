export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentId?: string;
  contentType?: string;
  disposition?: 'inline' | 'attachment';
}

export interface EmailRequest {
  email: string;
  body?: string;
  attachments?: EmailAttachment[];
  metadata: {
    frontendUrl?: string;
    subject: string;
    template?: string;
    [key: string]: string | number | boolean | undefined;
  };
}
export interface EmailResponse {
  success: boolean;
}
