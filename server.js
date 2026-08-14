import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { createServerApp } from './server/app.js';

async function start() {
  const { app, PORT } = await createServerApp();
  const server = http.createServer(app);

  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  });

  // Attach io instance to express app so routes can broadcast events
  app.set('io', io);

  io.on('connection', (socket) => {
    socket.on('join_group', (groupId) => {
      socket.join(`group:${groupId}`);
    });

    socket.on('leave_group', (groupId) => {
      socket.leave(`group:${groupId}`);
    });

    socket.on('typing', (payload) => {
      socket.to(`group:${payload.groupId}`).emit('user_typing', payload);
    });
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 FairTab Server (PostgreSQL + Socket.io) running on http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start FairTab server:', err);
  process.exit(1);
});
