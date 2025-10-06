import express from 'express';

export function createServer() {
  const app = express();

  // Tambahkan middleware yang diperlukan
  app.use(express.json());

  // Tambahkan route yang diperlukan
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  return app;
}