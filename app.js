import express from "express"
import session from "express-session"
import cors from "cors"
import dotenv from "dotenv"
import { createSessionStore } from "./db.js"
import * as userHandlers from "./handlers/userHandlers.js"
dotenv.config()


const app = express()
app.use(express.json())
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}))

const sessionStore = createSessionStore()

app.use(session({
  key: "SessionId",
  secret: process.env.SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: "None",
    maxAge: 1000 * 60 * 60
  }
}))

//Users
app.get("/getuserdata", userHandlers.getuserdata)
app.post("/register", userHandlers.register)
app.post("/login", userHandlers.login)
app.post("/logout", userHandlers.logout)
app.delete("/deleteuser", userHandlers.deleteuser)



const port = process.env.PORT || 3000

app.listen(port, () => console.log(`Server running on port ${port}`))