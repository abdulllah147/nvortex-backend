const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const Groq = require('groq-sdk');

const app = express();
app.use(cors());

// Image uploads aur base64 data ke liye limit 50mb set ki gayi hai taake request fail na ho
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

let db;
const JWT_SECRET = process.env.JWT_SECRET || 'apna_super_secret_key_123';

// Initialize SQLite Database
async function setupDatabase() {
  db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS chats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_id INTEGER NOT NULL,
      role TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (chat_id) REFERENCES chats (id) ON DELETE CASCADE
    );
  `);

  console.log('Connected to Local SQLite Database with Auth (database.sqlite)');
}

setupDatabase().catch(err => console.error('Database setup failed:', err));

// Initialize Groq Client
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Groq AI Response Function (Supports both Text and Vision with updated model)
async function generateWithGroq(promptText, imageBase64 = null, mimeType = null) {
  try {
    const currentDate = new Date().toLocaleString('en-US', { 
      timeZone: 'Asia/Karachi', 
      dateStyle: 'full', 
      timeStyle: 'medium' 
    });

    let extraContext = "";
    if (promptText && (promptText.toLowerCase().includes('fifa') || promptText.toLowerCase().includes('world cup'))) {
      extraContext = " FACT: The 2026 FIFA World Cup concluded in July 2026. Spain won the tournament by defeating Argentina 1-0 in the final after extra time.";
    }

    let contentParts = [
      { type: "text", text: (promptText || "Describe this image in detail.") + extraContext }
    ];

    let selectedModel = "llama-3.3-70b-versatile"; // Default text model

    if (imageBase64) {
      const dataUrl = `data:${mimeType || 'image/jpeg'};base64,${imageBase64}`;
      contentParts.push({
        type: "image_url",
        image_url: { url: dataUrl }
      });
      // Updated active vision model on Groq
      selectedModel = "llama-3.2-90b-vision-preview"; 
    }

    const response = await groq.chat.completions.create({
      model: selectedModel,
      messages: [
        {
          role: "system",
          content: `You are a smart, professional, real-time AI assistant. Current exact Date and Time is ${currentDate} (Pakistan Standard Time). 
          The current year is 2026. Always reply directly in Roman Urdu or English matching the user's language precisely.`
        },
        {
          role: "user",
          content: contentParts
        }
      ],
      max_tokens: 1024,
      temperature: 0.3
    });

    return response.choices[0]?.message?.content || "Jawab nahi mil saka.";
  } catch (error) {
    console.error("Groq API Error Details:", error);
    throw error;
  }
}

// --- AUTHENTICATION ROUTES ---

// 1. Signup Route
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Tamam fields pur karna lazmi hain.' });
    }

    const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'Yeh email pehle se registered hai.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.run(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );

    res.json({ message: 'Account kamyabi se ban gaya hai!', userId: result.lastID });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Server error during signup' });
  }
});

// 2. Login Route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email aur password dena lazmi hai.' });
    }

    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(400).json({ error: 'Invalid email ya password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email ya password.' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Login kamyabi se ho gaya!',
      token,
      user: { id: user.id, name: user.name, email: user.email }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});


// --- CHAT ROUTES ---

// Get all chats for a specific user
app.get('/api/chats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const results = await db.all('SELECT * FROM chats WHERE user_id = ? ORDER BY id DESC', [userId]);
    res.json(results);
  } catch (err) {
    console.error('Error fetching chats:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get messages for a specific chat
app.get('/api/chats/messages/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const results = await db.all('SELECT role, text FROM messages WHERE chat_id = ? ORDER BY id ASC', [chatId]);
    res.json(results);
  } catch (err) {
    console.error('Error fetching messages:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Create a new chat session
app.post('/api/chats/create', async (req, res) => {
  try {
    const { userId, title } = req.body;
    const result = await db.run(
      'INSERT INTO chats (user_id, title) VALUES (?, ?)',
      [userId, title || 'New Conversation']
    );
    res.json({ chatId: result.lastID, message: 'Chat created successfully' });
  } catch (err) {
    console.error('Error creating chat:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Rename Chat Title
app.put('/api/chats/rename/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { title } = req.body;
    await db.run('UPDATE chats SET title = ? WHERE id = ?', [title, chatId]);
    res.json({ message: 'Chat renamed successfully' });
  } catch (err) {
    console.error('Error renaming chat:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Delete Chat and its messages
app.delete('/api/chats/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    await db.run('DELETE FROM messages WHERE chat_id = ?', [chatId]);
    await db.run('DELETE FROM chats WHERE id = ?', [chatId]);
    res.json({ message: 'Chat deleted successfully' });
  } catch (err) {
    console.error('Error deleting chat:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Handle incoming message (with optional Image/Vision support), call Groq, and save conversation
app.post('/api/chats/message', async (req, res) => {
  try {
    const { chatId, text, imageBase64, mimeType } = req.body;

    if (!chatId || (!text && !imageBase64)) {
      return res.status(400).json({ error: 'chatId and text or image are required' });
    }

    // Save User Message text to DB
    const userMessageText = text ? (imageBase64 ? `${text} [Image Uploaded]` : text) : '[Image Uploaded]';
    await db.run('INSERT INTO messages (chat_id, role, text) VALUES (?, ?, ?)', [chatId, 'user', userMessageText]);

    // Call Groq API (Passing imageBase64 and mimeType if present)
    const aiReply = await generateWithGroq(text, imageBase64, mimeType);

    // Save Assistant Response to DB
    await db.run('INSERT INTO messages (chat_id, role, text) VALUES (?, ?, ?)', [chatId, 'assistant', aiReply]);

    res.json({ reply: aiReply });

  } catch (apiError) {
    console.error('Error in message processing details:', apiError);
    res.status(500).json({ error: 'Failed to communicate with API or Database' });
  }
});

// Start Server using PORT from .env
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server with Auth & Vision (50MB Limit) is running on port ${PORT}`);
});