const { MongoClient } = require("mongodb")

const dbName = process.env.DB_NAME || "dezire_store"

let client
let db

async function connectDB() {
  try {
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI
    if (!uri) {
      throw new Error("MONGO_URI (or MONGODB_URI) is not set")
    }

    client = new MongoClient(uri)
    await client.connect()
    db = client.db(dbName)

    // Indexes for production readiness
    await db.collection("products").createIndex({ ownerId: 1 })
    await db.collection("products").createIndex({ createdAt: -1 })

    console.log("MongoDB connected")
  } catch (err) {
    console.error("MongoDB connection error:", err.message)
    process.exit(1)
  }
}

function getDB() {
  if (!db) throw new Error("Database not initialized")
  return db
}

async function closeDB() {
  if (client) {
    await client.close()
  }
}

module.exports = { connectDB, getDB, closeDB }
