const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection failed. Full error below:');
    console.error(error);

    if (error.reason && error.reason.servers) {
      console.error('--- Per-server errors ---');
      for (const [host, desc] of error.reason.servers) {
        console.error(host, '=>', desc.error?.message || desc.error || 'no specific error');
      }
    }

    process.exit(1);
  }
};

module.exports = connectDB;