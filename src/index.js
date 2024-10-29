require('dotenv').config();
const express = require('express');
const cors = require('cors');
const winston = require('winston');

// Initialize logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  logger.info('Home route accessed');
  res.json({ message: 'Welcome to JarvisHelper!' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
}); 