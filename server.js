const express = require("express");
const fs = require("fs");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Store messages in memory with timestamps
const messages = [];

// Add this route to serve your HTML file
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Save message to memory and file
app.post("/save-message", (req, res) => {
    const { message, userIP } = req.body;
    if (!message) return res.status(400).send("Message is required");

    const timestamp = new Date();
    const logEntry = `[${timestamp.toLocaleString()}] ${userIP}: ${message}\n`;

    // Add message to memory with ID and timestamp
    const messageId = Date.now().toString();
    messages.push({
        id: messageId,
        text: message,
        userIP,
        timestamp,
        logEntry
    });

    // Write to file
    fs.appendFile("chat_history.txt", logEntry, (err) => {
        if (err) {
            console.error("Error writing to file:", err);
            return res.status(500).send("Error saving message");
        }

        // Schedule message deletion after 1 minute
        setTimeout(() => deleteMessage(messageId), 60000);

        res.json({ success: true, messageId });
    });
});

// Function to delete a message
function deleteMessage(messageId) {
    const index = messages.findIndex(msg => msg.id === messageId);
    if (index !== -1) {
        messages.splice(index, 1);

        // Rewrite the file with current messages
        fs.writeFile("chat_history.txt", "", err => {
            if (err) {
                console.error("Error clearing file:", err);
                return;
            }

            // Write remaining messages back to file
            messages.forEach(msg => {
                fs.appendFileSync("chat_history.txt", msg.logEntry);
            });

            console.log(`Message ${messageId} deleted after 1 minute`);
        });
    }
}

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});