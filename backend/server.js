const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const config = require('config');
const WebSocket = require('ws');
const http = require('http');

const authRoutes = require('./routes/auth');
const subscriptionRoutes = require('./routes/subscription');
const analyticsRoutes = require('./routes/analytics');
const notificationRoutes = require('./routes/notifications');
const marketingRoutes = require('./routes/marketing');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(config.get('mongoURI'), {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('MongoDB Connection Error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/marketing', marketingRoutes);

// WebSocket connection handling
require('./services/websocket')(wss);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
