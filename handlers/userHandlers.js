import { db } from "../db.js"
import bcrypt from "bcrypt"

export async function getuserdata(req, res) {
  if (!req.session.user) return res.status(401).json({success: false, message: 'Unauthorized'})
  
    try {
      let [user] = await db.query("select * from UserData where UserDataId = ?", [req.session.user.id])
      user = user[0]
  
      res.status(200).json({id: user.UserDataId, username: user.Username, email: user.Email})
    } catch (error) {
      console.error("Error:", error)
      res.status(500).json({success: false, error: "Error retrieving data from the database"})
    }
}

export async function register(req, res) {
  const {username, email, password} = req.body
  if (!username || !email || !password ) return res.status(400).json({success: false, error: "Missing data"})   
    try {
      const [dbusername] = await db.query("select * from UserData where Username = ?", [username])
      const [dbemail] = await db.query("select * from UserData where Email = ?", [email])
  
      if (dbusername.length !== 0) return res.status(400).json({success: false, error: "Username is taken"})
      if (dbemail.length !== 0) return res.status(400).json({success: false, error: "E-Mail is taken"})
  
      try {
        const hashedpassword = await bcrypt.hash(password, 10)
        const [result] = await db.query("insert into UserData (Username, Email, PasswordHash) values (?,?,?)", [username, email, hashedpassword])
        req.session.user = { id: result.insertId }
        res.status(200).json({success: true, message: "User registered successfully", userdataid: result.insertId})
      } catch (error) {
        console.error("Error:", error)
        res.status(500).json({success: false, error: "Error while registering"})
      }
    } catch (error) {
      console.error("Error:", error)
      res.status(500).json({success: false, error: "Error while fetching data from database"})
    }
}

export async function login(req, res) {
  const {email, password} = req.body
    if (!email || !password) return res.status(400).json({success: false, error: "Missing data"})
    try {
      let [user] = await db.query("select * from UserData where Email = ?", [email])
      if (user.length === 0) return res.status(404).json({success: false, error: "User not found"})
      user = user[0]
  
      const isPasswordValid = await bcrypt.compare(password, user.PasswordHash)
      if (!isPasswordValid) return res.status(401).json({success: false, error: "Wrong password"})
  
      req.session.user = { id: user.UserDataId }
      res.status(200).json({success: true, message: "User successfully logged in"})
    } catch (error) {
      console.error("Error:", error)
      res.status(500).json({success: false, error: "Error while logging in"})
    }
}

export async function logout(req, res) {
  if (!req.session.user) return res.status(401).json({success: false, message: 'Unauthorized'})

  try {
    req.session.destroy()
    res.clearCookie('SessionId')
    res.status(200).json({success: true, message: 'Logged out successfully'})
  } catch (error) {
    console.error("Error:", error)
    res.status(500).json({success: false, error: "Error while logging out"})
  }
}

export async function deleteuser(req, res) {
  if (!req.session.user) return res.status(401).json({success: false, message: 'Unauthorized'})

  try {
      await db.query("delete from UserData where UserDataId = ?", [req.session.user.id])
      req.session.destroy()
      res.clearCookie('SessionId')
      res.status(200).json({success: true, message: `Successfully deleted user`})
  } catch (error) {
      console.error("Error:", error)
      res.status(500).json({success: false, error: "Error while deleting the user from the database"})
  }
}