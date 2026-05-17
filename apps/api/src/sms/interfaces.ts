export interface SmsRequest {
  phoneNumber: string;
  message: string;
  metadata?: {
    [key: string]: string | number | boolean | undefined;
  };
}

export interface SmsResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}
