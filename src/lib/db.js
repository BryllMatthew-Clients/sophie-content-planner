import { MongoClient } from 'mongodb';

let client = null;
let _db = null;

export async function getDb() {
  if (_db) return _db;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set. Add it to your .env file or Render environment variables.');
  client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
  await client.connect();
  _db = client.db();
  return _db;
}

export async function closeDb() {
  if (client) {
    await client.close();
    client = null;
    _db = null;
  }
}
