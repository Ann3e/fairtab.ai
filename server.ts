import { createServerApp } from './server/app';

async function start() {
  const { app, PORT } = await createServerApp();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 FairTab Server running on http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start FairTab server:', err);
  process.exit(1);
});
