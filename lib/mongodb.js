import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

// Multi-document transactions require a replica set / mongos (standalone MongoDB doesn't support them).
// Off only when NODE_ENV is explicitly "development" (i.e. `next dev`), so a local standalone mongod
// works out of the box. Unset/missing NODE_ENV is treated as production (transactions on) — safer
// default for anywhere this runs outside `next dev`. Override explicitly with MONGODB_USE_TRANSACTIONS.
export const useTransactions = process.env.MONGODB_USE_TRANSACTIONS
  ? process.env.MONGODB_USE_TRANSACTIONS === 'true'
  : process.env.NODE_ENV !== 'development';

if (!MONGODB_URI) {
  throw new Error('Please define MONGODB_URI in .env.local');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false, // IMPORTANT
    });
  }

  cached.conn = await cached.promise;
  console.log('[MongoDB] Mongoose connected');
  return cached.conn;
}
