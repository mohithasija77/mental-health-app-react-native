const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

const PORT = process.env.PORT || 5001;

// Middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Mental Health Analysis API',
  });
});

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Import routes
const checkinRoutes = require('./routes/checkinRoutes');

// Routes
app.use('/api/mental-health', checkinRoutes);

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: 'Something went wrong processing your request',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `${req.method} ${req.originalUrl} is not a valid endpoint`,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Mental Health Analysis API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(
    `Main endpoint: POST http://localhost:${PORT}/api/mental-health/analyze`
  );
  console.log(
    `Quick check: POST http://localhost:${PORT}/api/mental-health/mood-check`
  );
});

module.exports = app;
