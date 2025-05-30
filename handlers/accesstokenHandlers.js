import { db } from "../db.js"

export async function getAccesstokens(req, res) {
  if (!req.session.user) return res.status(401).json({success: false, error: "Unauthorized"})

  try {
    const [tokens] = await db.query("select AccessTokenId, TokenValue from AccessTokens where fk_UserDataId = ?", [req.session.user.id])
    res.status(200).json({success: true, message: "Successfully retrieved accesstokens from database", accesstokens: tokens})
  } catch (error) {
    console.error("Error:", error)
    res.status(500).json({success: false, error: "Error while fetching tokens from the datbase"})
  }
}

export async function addAccesstokens(req, res) {
  const {accesstokens} = req.body
  if (!accesstokens) return res.status(400).json({success: false, error: "Missing data"})
  if (!req.session.user) return res.status(401).json({success: false, error: "Unauthorized"})
  
  try {
    for (const token of accesstokens) {
      await db.query("insert into AccessTokens (TokenValue,fk_UserDataId) values (?,?)", [token, req.session.user.id])
    }

    res.status(200).json({success: true, message: "Successfully added tokens to the database"})
  } catch (error) {
    console.error("Error:", error)
    res.status(500).json({success: false, error: "Error while inserting tokens into the database"})
  }
}

export async function deleteAccesstoken(req, res) {
  const {accesstokenid} = req.body
  if (!accesstokenid) return res.status(400).json({success: false, error: "Missing data"})
  if (!req.session.user) return res.status(401).json({success: false, error: "Unauthorized"})
  
  try {
    let [token] = await db.query("select * from AccessTokens where AccessTokenId = ?", [accesstokenid])
    if (token.length == 0) return res.status(404).json({success: false, error: "Accesstoken not found"}) 
    token = token[0] 

    if (token.fk_UserDataId !== req.session.user.id) return res.status(403).json({success: false, error: "Not your accesstoken"})
    
    try {
      await db.query("delete from AccessTokens where AccessTokenId = ?", [accesstokenid])
      res.status(200).json({success: true, message: "Successfully deleted accesstoken"})

    } catch (error) {
      console.error("Error:", error)
      res.status(500).json({success: false, error: "Error while deleting accesstoken from the database"})
    }
  } catch (error) {
    console.error("Error:", error)
    res.status(500).json({success: false, error: "Error while fetching accesstoken from the database"})
  }
}