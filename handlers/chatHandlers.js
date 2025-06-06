import { db } from "../db.js"
import { InferenceClient } from "@huggingface/inference"

export async function getAllChats(req, res) {
  if (!req.session.user) return res.status(401).json({success: false, error: "Unauthorized"})

  try {
    const [chats] = await db.query("select ChatId, ChatName from Chats where fk_UserDataId = ?", [req.session.user.id])

    res.status(200).json({success: true, chats: chats})
  } catch {
    console.error("Error:", error)
    res.status(500).json({success: false, error: "Error while fetching chats"})
  }
}

export async function getChat(req, res) {
  const {chatid} = req.body
  if (!chatid) return res.status(400).json({success: false, error: "Missing data"})
  if (!req.session.user) return res.status(401).json({success: false, error: "Unauthorized"})
  
  try {
    let [chatdata] = await db.query("select ChatId, ChatName, SelectedAI from Chats where ChatId = ? and fk_UserDataId = ?", [chatid, req.session.user.id])
    if (chatdata.length == 0) return res.status(404).json({success: false, error: "Chat not found or not the owner of the chat"})
    chatdata = chatdata[0]
    
    try {
      const [chatmessages] = await db.query("select ChatMessageId, Content, Sender from ChatMessages where fk_ChatId = ?", [chatid])

      res.status(200).json({success: true, chatdata: chatdata, chatmessages: chatmessages})
    } catch (error) {
      console.error("Error:", error)
      res.status(500).json({success: false, error: "Error while fetching chatmessages"})
    }
  } catch (error) {
    console.error("Error:", error)
    res.status(500).json({success: false, error: "Error while fetching chatdata"})
  }
}

export async function addChat(req, res) {
  const {chatname, selectedai} = req.body
  if (!chatname || !selectedai) return res.status(400).json({success: false, error: "Missing data"})
  if (!req.session.user) return res.status(401).json({success: false, error: "Unauthorized"})
  
  try {
    await db.query("insert into Chats (ChatName, SelectedAI, fk_UserDataId) values (?,?,?)", [chatname, selectedai, req.session.user.id])

    res.status(200).json({success: true, message: "Successfully added chat"})
  } catch (error) {
    console.error("Error:", error)
    res.status(500).json({success: false, error: "Error while inserting chat into database"})
  }
}

export async function deleteChat(req, res) {
  const {chatid} = req.body
  if (!chatid) return res.status(400).json({success: false, error: "Missing data"})
  if (!req.session.user) return res.status(401).json({success: false, error: "Unauthorized"})
  
  try {
    const [chat] = await db.query("select * from Chats where ChatId = ? and fk_UserDataId = ?", [chatid, req.session.user.id])
    if (chat.length == 0) return res.status(404).json({success: false, error: "Chat not found or not the owner of the chat"})

    try {
      await db.query("delete from Chats where ChatId = ?", [chatid])

      res.status(200).json({success: true, message: "Successfully deleted chat"})
    } catch (error) {
      console.error("Error:", error)
      res.status(500).json({success: false, error: "Error while deleting chat"})
    }
  } catch (error) {
    console.error("Error:", error)
    res.status(500).json({success: false, error: "Error while fetching chat"})
  }
}

export async function renameChat(req, res) {
  const {chatid, chatname} = req.body
  if (!chatid || !chatname) return res.status(400).json({success: false, error: "Missing data"})
  if (!req.session.user) return res.status(401).json({success: false, error: "Unauthorized"})
  
  try {
    const [chat] = await db.query("select * from Chats where ChatId = ? and fk_UserDataId = ?", [chatid, req.session.user.id])
    if (chat.length == 0) return res.status(404).json({success: false, error: "Chat not found or not the owner of the chat"})

    try {
      await db.query("update Chats set ChatName = ? where ChatId = ? ", [chatname, chatid])

      res.status(200).json({success: true, message: "Successfully renamed chat"})
    } catch (error) {
      console.error("Error:", error)
      res.status(500).json({success: false, error: "Error while renaming chat"})
    }
  } catch (error) {
    console.error("Error:", error)
    res.status(500).json({success: false, error: "Error while fetching chat"})
  }
}

export async function addChatMessage(req, res) {
  const {content, chatid} = req.body
  if (!content || !chatid) return res.status(400).json({success: false, error: "Missing data"})
  if (!req.session.user) return res.status(401).json({success: false, error: "Unauthorized"})
  
  try {
    let [chat] = await db.query("select SelectedAI from Chats where ChatId = ? and fk_UserDataId = ?", [chatid, req.session.user.id])
    if (chat.length == 0) return res.status(404).json({success: false, error: "Chat not found or not the owner of the chat"})
    chat = chat[0]
    
    try {
      await db.query("insert into ChatMessages (Content, Sender, fk_ChatId) values (?,'user',?)", [content, chatid])
      
      try {
        const [accesstokens] = await db.query("select TokenValue from AccessTokens where fk_UserDataId = ?", [req.session.user.id])
        if (accesstokens.length == 0) return res.status(404).json({success: false, error: "No accesstokens found"})
        
        try {
          const [chatmessages] = await db.query("select ChatMessageId, Content, Sender from ChatMessages where fk_ChatId = ?", [chatid])
          const formattedChatmessages = chatmessages.map(m => ({role: m.Sender, content: m.Content}))

          try {
            let aiResponse = ""
            let tokenIndex = 0

            for (const accesstoken of accesstokens) {
              aiResponse = await AIResponse(accesstoken.TokenValue, chat.SelectedAI, formattedChatmessages)
              if (aiResponse !== null) {
                break
              } 

              tokenIndex++
              if (tokenIndex === accesstokens.length) return res.status(400).json({success: false, error: "All accesstokens used up"})
            }
  
            try {
              await db.query("insert into ChatMessages (Content, Sender, fk_ChatId) values (?,'assistant',?)", [aiResponse, chatid])
              res.status(200).json({success: true, message: "Successfully added chat message"})
            } catch (error) {
              console.error("Error:", error)
              res.status(500).json({success: false, error: "Error inserting AI response into db"})
            }
          } catch (error) {
            console.error("Error:", error)
            res.status(500).json({success: false, error: "Error while getting AI response"})
          }
        } catch (error) {
          console.error("Error:", error)
          res.status(500).json({success: false, error: "Error while fetching chat history"})
        }
      } catch (error) {
        console.error("Error:", error)
        res.status(500).json({success: false, error: "Error while fetching accesstokens"})
      }
    } catch (error) {
      console.error("Error:", error)
      res.status(500).json({success: false, error: "Error while inserting chat message into database"})
    }
  } catch (error) {
    console.error("Error:", error)
    res.status(500).json({success: false, error: "Error while fetching chat"})
  }
}

async function AIResponse(accesstoken, selectedai, messages) {
  try {
    const client = new InferenceClient(accesstoken);
  
    const response = await client.chatCompletion({
      provider: "auto",
      model: selectedai,
      messages: messages,
    })

    return response.choices[0].message.content
  } catch (error) {
    if (error.message.includes("You have exceeded your monthly included credits for Inference Providers")) {
      return null
    } else {
      throw(error)
    }
  }
}