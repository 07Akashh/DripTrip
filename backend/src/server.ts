import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import videoRoutes from './routes/video.routes';

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI  || 'mongodb://127.0.0.1:27017/driptrip';

// Middleware configuration
app.use(cors());
app.use(express.json());

// Routes registration
app.use('/', videoRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected', 
    uptime: process.uptime() 
  });
});

// Connect to MongoDB and start server
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB.');
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
  })
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`Server is running and listening on port ${PORT}`);
    });
  });

