const express = require("express")
const { ObjectId } = require("mongodb")
const { getDB } = require("../database/mongo")

const router = express.Router()

function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: "Unauthorized" })
  }
  next()
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.session.role !== role) {
      return res.status(403).json({ error: "Forbidden" })
    }
    next()
  }
}

async function requireOwnerOrAdmin(req, res, next) {
  const db = getDB()

  const product = await db.collection("products").findOne({
    _id: new ObjectId(req.params.id),
  })

  if (!product) {
    return res.status(404).json({ error: "Product not found" })
  }

  const isOwner = product.ownerId === req.session.userId
  const isAdmin = req.session.role === "admin"

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ error: "Forbidden" })
  }

  next()
}

/* ---------- GET with pagination ---------- */

router.get("/", async (req, res) => {
  const db = getDB()

  const page = Number(req.query.page || 1)
  const limit = Number(req.query.limit || 10)
  const skip = (page - 1) * limit

  const filter = {}
  if (req.query.category) {
    filter.category = req.query.category
  }

  const total = await db.collection("products").countDocuments(filter)

  const products = await db
    .collection("products")
    .find(filter)
    .skip(skip)
    .limit(limit)
    .toArray()

  res.json({
    page,
    total,
    pages: Math.ceil(total / limit),
    items: products,
  })
})

router.get("/:id", async (req, res) => {
  const db = getDB()

  const product = await db.collection("products").findOne({
    _id: new ObjectId(req.params.id),
  })

  if (!product) {
    return res.status(404).json({ error: "Product not found" })
  }

  res.json(product)
})

router.post("/", requireAuth, async (req, res) => {
  const { name, price, category, image, description } = req.body

  if (!name || price == null) {
    return res.status(400).json({ error: "Name and price required" })
  }

  const numericPrice = Number(price)
  if (Number.isNaN(numericPrice)) {
    return res.status(400).json({ error: "Price must be number" })
  }

  const db = getDB()

  const result = await db.collection("products").insertOne({
    name: name.trim(),
    price: numericPrice,
    category: category || null,
    image: image || null,
    description: description || null,
    ownerId: req.session.userId,
    createdAt: new Date(),
  })

  const created = await db
    .collection("products")
    .findOne({ _id: result.insertedId })

  res.status(201).json(created)
})

router.put("/:id", requireAuth, requireOwnerOrAdmin, async (req, res) => {
  const { name, price, category, image, description } = req.body

  const numericPrice = Number(price)

  const db = getDB()

  const result = await db.collection("products").findOneAndUpdate(
    { _id: new ObjectId(req.params.id) },
    {
      $set: {
        name,
        price: numericPrice,
        category,
        image,
        description,
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" }
  )

  res.json(result.value)
})

router.delete("/:id", requireAuth, requireOwnerOrAdmin, async (req, res) => {
  const db = getDB()

  await db.collection("products").deleteOne({
    _id: new ObjectId(req.params.id),
  })

  res.json({ message: "Deleted successfully" })
})

router.get(
  "/admin/stats",
  requireAuth,
  requireRole("admin"),
  async (req, res) => {
    const db = getDB()
    const totalProducts = await db.collection("products").countDocuments()
    const totalUsers = await db.collection("users").countDocuments()

    res.json({ totalProducts, totalUsers })
  }
)

module.exports = router