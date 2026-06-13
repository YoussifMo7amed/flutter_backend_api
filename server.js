import dotenv from 'dotenv';
import app from './src/app.js';
import connectDB from './src/config/db.js';
import { initFirebase } from './src/config/firebase.js';

// Load env vars
dotenv.config();

// Initialize Firebase
initFirebase();

// Connect to Database
connectDB();

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Close server & exit process
  server.close(() => process.exit(1));
});
