const express = require('express');
const db = require('./db');

const router = express.Router();

// 1. Get all chats for a user
router.get('/:userId', (req, res) => {
    const { userId } = req.params;
    db.all('SELECT * FROM chats WHERE user_id = ? ORDER BY id DESC', [userId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 2. Create a new chat
router.post('/create', (req, res) => {
    const { userId, title } = req.body;
    db.run('INSERT INTO chats (user_id, title) VALUES (?, ?)', [userId, title], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ chatId: this.lastID, title });
    });
});

// 3. Get messages of a specific chat
router.get('/messages/:chatId', (req, res) => {
    const { chatId } = req.params;
    db.all('SELECT * FROM messages WHERE chat_id = ?', [chatId], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 4. Save a message
router.post('/message', (req, res) => {
    const { chatId, role, text } = req.body;
    db.run('INSERT INTO messages (chat_id, role, text) VALUES (?, ?, ?)', [chatId, role, text], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ messageId: this.lastID, chatId, role, text });
    });
});

module.exports = router;