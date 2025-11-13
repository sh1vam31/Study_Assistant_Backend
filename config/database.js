import mongoose from 'mongoose';

let isConnected = false;

export async function connectDatabase() {
  if (isConnected) {
    console.log('Using existing MongoDB connection');
    return;
  }

  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-study-assistant';
    
    if (!mongoURI || mongoURI === 'mongodb://localhost:27017/smart-study-assistant') {
      console.warn('Warning: Using local MongoDB URI. Set MONGODB_URI environment variable for production.');
    }

    const options = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };
    
    await mongoose.connect(mongoURI, options);
    
    isConnected = true;
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    // Don't exit in serverless environment
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
    throw error;
  }
}

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
  isConnected = false;
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err);
  isConnected = false;
});
