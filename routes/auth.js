const express = require("express")
const bcrypt = require("bcrypt")
const { getDB } = require("../database/mongo")

const router = express.Router()

router.post("/register", async (req, res) => {
  const { email, password } = req.body || {}

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" })
  }

  const db = getDB()
  const users = db.collection("users")

  const exists = await users.findOne({
    email: String(email).toLowerCase().trim(),
  })

  if (exists) {
    return res.status(400).json({ error: "User already exists" })
  }

  const passwordHash = await bcrypt.hash(password, 10)

  await users.insertOne({
    email: String(email).toLowerCase().trim(),
    passwordHash,
    role: "user",
    createdAt: new Date(),
  })

  res.status(201).json({ message: "Registered successfully" })
})

router.post("/login", async (req, res) => {
  const { email, password } = req.body || {}

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" })
  }

  const db = getDB()
  const user = await db.collection("users").findOne({
    email: String(email).toLowerCase().trim(),
  })

  if (!user) return res.status(401).json({ error: "Invalid credentials" })

  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) return res.status(401).json({ error: "Invalid credentials" })

  req.session.userId = String(user._id)
  req.session.role = user.role
  req.session.email = user.email

  res.json({
    message: "Logged in",
    email: user.email,
    role: user.role,
  })
})

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("dezire.sid")
    res.json({ message: "Logged out" })
  })
})

router.get("/me", (req, res) => {
  if (!req.session.userId) {
    return res.json({ authenticated: false })
  }

  res.json({
    authenticated: true,
    email: req.session.email,
    role: req.session.role,
  })
})

module.exports = router