const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

const PORT = process.env.PORT || 5003;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Mental Health Analysis API',
    mongodb:
      mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
  });
});

app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

// Import routes
const checkinRoutes = require('./routes/checkinRoutes');
const weeklySummaryRoutes = require('./routes/weeklySummaryRoutes');
const stressRoutes = require('./routes/stressRoutes');

// Routes
app.use('/api/mental-health', checkinRoutes);
app.use('/api/mental-health/summary', weeklySummaryRoutes);
app.use('/api/mental-health/stress', stressRoutes);

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
app.listen(PORT, '0.0.0.0', () => {
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
