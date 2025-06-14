import express from "express"
import session from "express-session"
import cors from "cors"
import dotenv from "dotenv"
import { createSessionStore } from "./db.js"
import * as userHandlers from "./handlers/userHandlers.js"
import * as accesstokenHandlers from "./handlers/accesstokenHandlers.js"
import * as chatHandlers from "./handlers/chatHandlers.js"
dotenv.config()


const app = express()
app.use(express.json())
app.use(cors({
  origin: process.env.ORIGIN_URL,
  credentials: true
}))
app.set('trust proxy', 2)

const sessionStore = createSessionStore()

const isProd = process.env.NODE_ENV == "production"

app.use(session({
  key: "SessionId",
  secret: process.env.SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProd,
    httpOnly: true,
    sameSite: isProd ? "strict" : "lax",
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}))

//Users
app.get("/isloggedin", userHandlers.isloggedin)
app.get("/getuserdata", userHandlers.getuserdata)
app.post("/register", userHandlers.register)
app.post("/login", userHandlers.login)
app.post("/logout", userHandlers.logout)
app.delete("/deleteuser", userHandlers.deleteuser)

//Accesstokens
app.get("/getaccesstokens", accesstokenHandlers.getAccesstokens)
app.post("/addaccesstokens", accesstokenHandlers.addAccesstokens)
app.delete("/deleteaccesstoken", accesstokenHandlers.deleteAccesstoken)

//Chats
app.get("/getallchats", chatHandlers.getAllChats)
app.post("/getchat", chatHandlers.getChat)
app.post("/addchat", chatHandlers.addChat)
app.delete("/deletechat", chatHandlers.deleteChat)
app.patch("/renamechat", chatHandlers.renameChat)
app.post("/addchatmessage", chatHandlers.addChatMessage)

const port = process.env.PORT || 3000

app.listen(port, () => console.log(`Server running on port ${port}`))