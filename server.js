require("dotenv").config()

const express = require("express")
const session = require("express-session")
const bcrypt = require("bcrypt")
const path = require("path")

const { connectDB, getDB, client } = require("./database/mongo")

const authRouter = require("./routes/auth")
const productsRouter = require("./routes/products")

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, "public")))

app.use(
  session({
    name: "dezire.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
    },
  })
)

app.use("/api/auth", authRouter)
app.use("/api/products", productsRouter)

app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).json({ error: "Internal server error" })
})

async function ensureAdmin() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase()
  const password = process.env.ADMIN_PASSWORD

  if (!email || !password) return

  const db = getDB()
  const users = db.collection("users")

  const existing = await users.findOne({ email })
  if (existing) return

  const hash = await bcrypt.hash(password, 10)

  await users.insertOne({
    email,
    passwordHash: hash,
    role: "admin",
    createdAt: new Date(),
  })

  console.log("Admin created")
}

;(async () => {
  await connectDB()
  await ensureAdmin()

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })

  process.on("SIGINT", async () => {
    await client.close()
    process.exit(0)
  })
})()