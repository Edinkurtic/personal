import express from "express";
import {DB} from "../src/database";
import type {Database} from "sqlite";

export const chatRouter = express.Router();

chatRouter.post("/", async (req, res) => {
    let db: Database = await DB.getConnection();
    try {
        const content = req.body ?? {};
        const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
        const model = process.env.OLLAMA_MODEL || "llama3.1:8b-instruct-q4_K_M";
        let aiText: string | null = null;
        let aiMessageId: number | null = null;
        const userMessage = req.body.content;

        if (!userMessage) {
            return res.status(400).json({ error: "Message is required" });
        }
        try {
            const prompt = `You are a helpful AI assistant. Give concise, direct answers.
Keep responses brief and to the point unless asked for details.

User: ${userMessage}
Assistant:`;
            const resp = await fetch(`${OLLAMA_URL}/api/generate`, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    model,
                    prompt,
                    stream: false,
                    options: {
                        temperature: 0.7,
                        top_p: 0.9
                    }
                })
            });
            if (!resp.ok) {
                const errText = await resp.text().catch(() => "");
                throw new Error(`Ollama error ${resp.status}: ${errText}`);
            }
            const data = await resp.json();
            aiText = data?.response ?? null;

            if (aiText) {
                let aiUser = await db.get<{ id: number }>(
                    "SELECT id FROM users WHERE username = ?",
                    "assistant"
                );
                if (!aiUser) {
                    const aiUserResult = await db.run(
                        "INSERT INTO users (username, display_name) VALUES (?, ?)",
                        "assistant",
                        "AI Assistant"
                    );
                    aiUser = { id: aiUserResult.lastID as number };
                }
                const aiMsgResult = await db.run(
                    "INSERT INTO messages (user_id, content) VALUES (?, ?)",
                    aiUser.id,
                    aiText
                );
                aiMessageId = aiMsgResult.lastID as number;
            }
        } catch (e) {
            console.error("Ollama request failed:", e);
        }
        return res.status(201).json({
            reply: aiText,
            aiMessageId
        });
    } catch (error) {
        console.error("POST /chat error:", error);
        return res.status(500).json({error: "Failed to create message"});
    }
});

chatRouter.patch("/", async (req, res) => {
    let db: Database = await DB.getConnection();
    try {
       let result = await db.run("SELECT * FROM messages;");
       if (result) {
           await db.run("DELETE FROM messages");
       }
    }catch (e) {
        console.error(e);
    }

})