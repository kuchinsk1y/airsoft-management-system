import express from 'express';
import { createApp } from './src/main';

export default async function handler(
  req: express.Request,
  res: express.Response,
): Promise<void> {
  const app = await createApp();
  app(req, res);
}
