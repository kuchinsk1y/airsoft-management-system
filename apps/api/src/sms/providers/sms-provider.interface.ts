export interface SmsSendOptions {
  phoneNumber: string;
  message: string;
}

export interface SmsProvider {
  send(options: SmsSendOptions): Promise<void>;
}
