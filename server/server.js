require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();
const server = http.createServer(app);

// Allow any localhost port (handles Vite picking 5174 when 5173 is busy)
const corsOrigin = (origin, callback) => {
  if (!origin || /^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
  callback(new Error('Not allowed by CORS'));
};

// Socket.io setup
const io = new Server(server, {
  cors: { origin: corsOrigin, methods: ['GET', 'POST'] },
});

// Track online users: userId -> socketId
const onlineUsers = new Map();
app.set('io', io);
app.set('onlineUsers', onlineUsers);

io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('userOnline', (userId) => {
    onlineUsers.set(userId, socket.id);
    io.emit('onlineUsers', Array.from(onlineUsers.keys()));
  });

  socket.on('disconnect', () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
    io.emit('onlineUsers', Array.from(onlineUsers.keys()));
    console.log('Socket disconnected:', socket.id);
  });
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({ origin: corsOrigin }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'ConnectSphere API is running', data: null });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);

// Error handlers
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`ConnectSphere server running on port ${PORT}`);
});
