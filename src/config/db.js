import mongoose from "mongoose";

/** Reuse connection across Vercel serverless invocations (and local hot reload). */
const globalCache = globalThis;

if (!globalCache.__mongooseCache) {
  globalCache.__mongooseCache = { conn: null, promise: null };
}

const cache = globalCache.__mongooseCache;

export async function connectDb(uri) {
  mongoose.set("strictQuery", true);

  if (cache.conn) {
    return cache.conn;
  }

  if (!cache.promise) {
    cache.promise = mongoose
      .connect(uri, {
        serverSelectionTimeoutMS: 15000,
        maxPoolSize: 5,
        bufferCommands: false,
      })
      .then((m) => {
        console.log("[db] Connected");
        cache.conn = m;
        return m;
      })
      .catch((err) => {
        cache.promise = null;
        cache.conn = null;
        throw err;
      });
  }

  return cache.promise;
}

export async function disconnectDb() {
  if (cache.conn) {
    await mongoose.disconnect();
    cache.conn = null;
    cache.promise = null;
  }
}
