const { MongoClient } = require("mongodb")

const uri = process.env.MONGO_URI
const dbName = process.env.DB_NAME || "dezire_store"

const client = new MongoClient(uri)

let db

async function connectDB() {
  try {
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

module.exports = { connectDB, getDB, client }