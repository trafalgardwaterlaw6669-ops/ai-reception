import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { handleChat } from "./src/server/ai";
import { WebSocketServer } from "ws";
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON
  app.use(express.json());

  // --- API Routes ---
  
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // AI Chat endpoint for the receptionist simulator
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, userId } = req.body;
      const actualUserId = userId || "web_guest";
      const { handleOmnichannelMessage } = await import("./src/server/ai");
      
      const lastMessageText = messages[messages.length - 1]?.parts?.[0]?.text || "";
      const reply = await handleOmnichannelMessage(actualUserId, "web", lastMessageText);
      res.json({ reply });
    } catch (error) {
      console.error("Chat endpoint error:", error);
      res.status(500).json({ error: "Failed to process chat request." });
    }
  });

  // Omnichannel webhook endpoint for WhatsApp, Messenger, SMS, etc.
  app.post("/api/omnichannel/webhook", async (req, res) => {
    try {
      // In a real application, you would verify webhook signatures from Twilio/Meta here
      const { platform, userId, message } = req.body;
      
      if (!platform || !userId || !message) {
        return res.status(400).json({ error: "Missing required fields: platform, userId, message" });
      }

      console.log(`Received ${platform} message from ${userId}: ${message}`);
      
      const { handleOmnichannelMessage } = await import("./src/server/ai");
      const reply = await handleOmnichannelMessage(userId, platform, message);
      
      console.log(`Sending reply to ${userId} on ${platform}: ${reply}`);
      // In a real application, you would use Twilio/Meta API to send the reply back here
      
      res.json({ status: "success", reply });
    } catch (error) {
      console.error("Omnichannel webhook error:", error);
      res.status(500).json({ error: "Failed to process webhook message." });
    }
  });

  // Future API endpoints will go here (e.g., /api/appointments, /api/patients)
  app.post("/api/multimodal/screener", async (req, res) => {
    try {
      const { imageBase64, mimeType, patientNotes } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: "Missing required parameter: imageBase64" });
      }
      const { handleMultimodalScreening } = await import("./src/server/ai");
      const result = await handleMultimodalScreening(imageBase64, mimeType, patientNotes);
      res.json(result);
    } catch (error: any) {
      console.error("Multimodal screener API error:", error);
      res.status(500).json({ error: error?.message || "Failed to analyze image." });
    }
  });

  // Classify a single document (message or call log)
  app.post("/api/triage/classify", async (req, res) => {
    try {
      const { docId, type, text } = req.body;
      if (!docId || !type || !text) {
        return res.status(400).json({ error: "Missing required parameters: docId, type, text" });
      }

      const { classifyAndSaveTriage } = await import("./src/server/ai");
      const classification = await classifyAndSaveTriage(docId, type, text);
      res.json({ success: true, classification });
    } catch (error: any) {
      console.error("Triage classification API error:", error);
      res.status(500).json({ error: error?.message || "Failed to classify document." });
    }
  });

  // Bulk classify all unclassified documents
  app.post("/api/triage/classify-all", async (req, res) => {
    try {
      const { collection, getDocs, query, where } = await import("firebase/firestore");
      const { db } = await import("./src/lib/firebase");
      const { classifyAndSaveTriage } = await import("./src/server/ai");

      let count = 0;

      // 1. Unclassified inbound messages
      const messagesCol = collection(db, 'messages');
      const qMessages = query(messagesCol, where("direction", "==", "inbound"));
      const messagesSnap = await getDocs(qMessages);
      
      for (const docOfSnap of messagesSnap.docs) {
        const data = docOfSnap.data();
        if (!data.triageCategory) {
          await classifyAndSaveTriage(docOfSnap.id, 'message', data.content);
          count++;
        }
      }

      // 2. Unclassified call logs
      const callLogsCol = collection(db, 'callLogs');
      const callLogsSnap = await getDocs(callLogsCol);
      
      for (const docOfSnap of callLogsSnap.docs) {
        const data = docOfSnap.data();
        if (!data.triageCategory && data.summary) {
          await classifyAndSaveTriage(docOfSnap.id, 'call', data.summary);
          count++;
        }
      }

      res.json({ success: true, classifiedCount: count });
    } catch (error: any) {
      console.error("Bulk triage classification API error:", error);
      res.status(500).json({ error: error?.message || "Failed bulk triage classification." });
    }
  });

  // Manual trigger endpoint for 24h background SMS appointment reminders
  app.post("/api/reminders/trigger", async (req, res) => {
    try {
      const { runReminderCheck } = await import("./src/server/cron");
      const result = await runReminderCheck();
      res.json({
        success: true,
        message: `Background SMS service executed successfully. Sent ${result.processedCount} reminder(s).`,
        processedCount: result.processedCount,
        sentReminders: result.sentReminders
      });
    } catch (error: any) {
      console.error("SMS Reminder trigger error:", error);
      res.status(500).json({ error: error?.message || "Failed to trigger SMS reminders." });
    }
  });

  // Admin endpoint to purge all fake data / collections
  app.post("/api/admin/clear-data", async (req, res) => {
    try {
      const { db } = await import("./src/lib/firebase.js");
      const { collection, getDocs, writeBatch } = await import("firebase/firestore");
      const collections = [
        'patients',
        'appointments',
        'messages',
        'callLogs',
        'reminders',
        'conversations',
        'aiMemories',
        'unanswered_questions',
        'clinic_facts'
      ];

      let deletedCount = 0;
      for (const colName of collections) {
        const colRef = collection(db, colName);
        const snapshot = await getDocs(colRef);
        if (!snapshot.empty) {
          const batchSize = 400;
          let batch = writeBatch(db);
          let count = 0;
          for (const docSnap of snapshot.docs) {
            batch.delete(docSnap.ref);
            count++;
            deletedCount++;
            if (count % batchSize === 0) {
              await batch.commit();
              batch = writeBatch(db);
            }
          }
          if (count % batchSize !== 0) {
            await batch.commit();
          }
        }
      }

      res.json({ success: true, message: `Purged ${deletedCount} document(s) from database.` });
    } catch (error: any) {
      console.error("Clear data API error:", error);
      res.status(500).json({ error: error?.message || "Failed to clear database." });
    }
  });

  // --- Vite Middleware for Development ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production serving of static files
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  const { startCronJobs } = await import("./src/server/cron");
  startCronJobs();

  const wss = new WebSocketServer({ server, path: '/live' });
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  const { tools, handleToolCall } = await import("./src/server/tools");

  wss.on("connection", async (clientWs, req) => {
    try {
      const parsedUrl = new URL(req.url!, `http://${req.headers.host || 'localhost'}`);
      const callerId = parsedUrl.searchParams.get("callerId") || "new";
      
      const { getSystemInstruction } = await import("./src/server/context");
      const systemInstruction = await getSystemInstruction(callerId);

      const session = await ai.live.connect({
        model: "gemini-3.1-flash-live-preview",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: systemInstruction,
          tools: tools,
        },
        callbacks: {
          onmessage: async (message: LiveServerMessage) => {
            const audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audio) {
              if (clientWs.readyState === 1) {
                clientWs.send(JSON.stringify({ audio }));
              }
            }
            if (message.serverContent?.interrupted) {
              if (clientWs.readyState === 1) {
                clientWs.send(JSON.stringify({ interrupted: true }));
              }
            }

            // Handle tool calls
            const toolCalls = message.toolCall?.functionCalls;
            if (toolCalls && toolCalls.length > 0) {
              const responses = [];
              for (const call of toolCalls) {
                console.log(`Executing tool: ${call.name}`, call.args);
                const result = await handleToolCall(call.name, call.args);
                responses.push({
                  id: call.id,
                  name: call.name,
                  response: result
                });
              }
              try {
                // In @google/genai Live API, we send function responses using sendToolResponse
                session.sendToolResponse({ functionResponses: responses });
              } catch(e) {
                console.error("Error sending tool response", e);
              }
            }
          },
          onerror: (error) => {
            console.error('Live API Error:', error);
          },
          onclose: () => {
            console.log('Live API session closed');
          }
        },
      });

      clientWs.on("message", (data) => {
        try {
          const parsed = JSON.parse(data.toString());
          if (parsed.audio) {
            session.sendRealtimeInput({
              audio: { data: parsed.audio, mimeType: "audio/pcm;rate=16000" },
            });
          }
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      });
      
      clientWs.on("close", () => {
        try {
          session.close();
        } catch(err) {
          console.error("Error closing session:", err);
        }
      });
    } catch (error) {
      console.error("Failed to connect to Live API:", error);
      clientWs.close();
    }
  });
}

startServer();
