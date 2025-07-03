const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');
const next = require('next');
// Import the session cleanup cron job so it runs when the server starts
// require('./app/cron/sessionCleanup'); 

const prisma = new PrismaClient();
const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT, 10) || 3000;

// Initialize Next.js
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

let io;

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(server, {
    path: '/api/socket/io',
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Kitchen Cook namespace
  const kitchenCookNamespace = io.of('/kitchenCook');
  kitchenCookNamespace.on('connection', (socket) => {
    const restaurantId = socket.handshake.query.restaurantId;

    if (restaurantId) {
      socket.join(restaurantId); // Join room for this restaurant
      
    }

    // Forward cookOrderUpdate to admin
    socket.on('cookOrderUpdate', ({ restaurantId, ...data }) => {
      kitchenAdminNamespace.to(restaurantId).emit('cookOrderUpdate', data , restaurantId);
      
    });

    socket.on('disconnect', () => {
      
    });
  });
  // Kitchen Admin namespace
  const kitchenAdminNamespace = io.of('/kitchenAdmin');
  kitchenAdminNamespace.on('connection', (socket) => {
    const restaurantId = socket.handshake.query.restaurantId;

    if (restaurantId) {
      socket.join(restaurantId); // Join room for this restaurant
      
    }

    // Forward adminNotification to specific kitchen
    socket.on('adminNotification', ({ restaurantId, ...data }) => {
      kitchenCookNamespace.to(restaurantId).emit('adminNotification', data , restaurantId);
      
    });

    socket.on('disconnect', () => {
      console.log('Kitchen Admin disconnected');
    });
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
