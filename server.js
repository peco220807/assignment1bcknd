require("dotenv").config()
const express = require("express")
const path = require("path")
const session = require("express-session")
const bcrypt = require("bcrypt")

const { connectDB, client, getDB } = require("./database/mongo")
const productsRouter = require("./routes/products")
const authRouter = require("./routes/auth")

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(express.static(path.join(__dirname, "public")))

app.use(
  session({
    name: "dezire.sid",
    secret: process.env.SESSION_SECRET || "supersecret",
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

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"))
})

app.use((req, res) => {
  res.status(404).json({ error: "Not Found" })
})

async function ensureAdminUser() {
  const email = (process.env.ADMIN_EMAIL || "").toLowerCase().trim()
  const password = process.env.ADMIN_PASSWORD || ""
  if (!email || !password) return

  const db = getDB()
  const users = db.collection("users")

  const exists = await users.findOne({ email })
  if (exists) return

  const passwordHash = await bcrypt.hash(password, 10)

  await users.insertOne({
    email,
    passwordHash,
    role: "admin",
    createdAt: new Date(),
  })
}

;(async () => {
  await connectDB()
  await ensureAdminUser()

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
  })

  process.on("SIGINT", async () => {
    await client.close()
    process.exit(0)
  })
})()