require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { errorHandler } = require('./middlewares/errorHandler');
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/auth');
const contentRoutes = require('./routes/content');
const analyticsRoutes = require('./routes/analytics');
const figmaRoutes = require('./routes/figma');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => logger.info('Connected to MongoDB'))
.catch((err) => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/figma', figmaRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(errorHandler);

// Handle unhandled routes
app.use((req, res) => {
    res.status(404).json({ error: 'Not Found' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    logger.error('Unhandled Promise Rejection:', err);
    // Close server & exit process
    process.exit(1);
});

module.exports = app;