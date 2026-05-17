export enum StorageDriver {
  LOCAL = 'local',
  VERCEL = 'vercel',
}

export interface StorageResponse {
  url: string;
  key: string;
  filename: string;
  contentType: string;
  size: number;
}
