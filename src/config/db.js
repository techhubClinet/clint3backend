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
        serverSelectionTimeoutMS: 10000,
        maxPoolSize: 10,
      })
      .then((m) => {
        console.log("[db] Connected");
        return m;
      });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}

export async function disconnectDb() {
  if (cache.conn) {
    await mongoose.disconnect();
    cache.conn = null;
    cache.promise = null;
  }
}
