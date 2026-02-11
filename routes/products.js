const express = require("express")
const { ObjectId } = require("mongodb")
const { getDB } = require("../database/mongo")

const router = express.Router()

function requireAuth(req, res, next) {
  if (!req.session?.userId)
    return res.status(401).json({ error: "Unauthorized" })
  next()
}

function requireRole(role) {
  return (req, res, next) => {
    if (req.session.role !== role)
      return res.status(403).json({ error: "Forbidden" })
    next()
  }
}

async function requireOwnerOrAdmin(req, res, next) {
  if (!ObjectId.isValid(req.params.id))
    return res.status(400).json({ error: "Invalid id" })

  const db = getDB()
  const product = await db.collection("products").findOne({
    _id: new ObjectId(req.params.id),
  })

  if (!product)
    return res.status(404).json({ error: "Not found" })

  const isOwner = product.ownerId === req.session.userId
  const isAdmin = req.session.role === "admin"

  if (!isOwner && !isAdmin)
    return res.status(403).json({ error: "Forbidden" })

  next()
}

router.get("/", async (req, res) => {
  const db = getDB()

  const page = Number(req.query.page || 1)
  const limit = Number(req.query.limit || 10)
  const skip = (page - 1) * limit

  const total = await db.collection("products").countDocuments()

  const items = await db
    .collection("products")
    .find()
    .skip(skip)
    .limit(limit)
    .toArray()

  res.json({
    page,
    total,
    pages: Math.ceil(total / limit),
    items,
  })
})

router.post("/", requireAuth, async (req, res) => {
  const { name, price, category, image, description } = req.body

  if (typeof name !== "string" || name.trim().length < 2)
    return res.status(400).json({ error: "Invalid name" })

  const numericPrice = Number(price)
  if (numericPrice <= 0)
    return res.status(400).json({ error: "Invalid price" })

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

  res.status(201).json({ _id: result.insertedId })
})

router.put("/:id", requireAuth, requireOwnerOrAdmin, async (req, res) => {
  const db = getDB()

  await db.collection("products").updateOne(
    { _id: new ObjectId(req.params.id) },
    {
      $set: {
        name: req.body.name,
        price: Number(req.body.price),
        category: req.body.category,
        image: req.body.image,
        description: req.body.description,
        updatedAt: new Date(),
      },
    }
  )

  res.json({ message: "Updated" })
})

router.delete("/:id", requireAuth, requireOwnerOrAdmin, async (req, res) => {
  const db = getDB()

  await db.collection("products").deleteOne({
    _id: new ObjectId(req.params.id),
  })

  res.json({ message: "Deleted" })
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