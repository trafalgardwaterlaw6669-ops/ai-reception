import { GoogleGenAI, GenerateContentParameters, Part, Type } from "@google/genai";
import { tools, handleToolCall } from "./tools";
import { db } from "../lib/firebase";
import { doc, getDoc, setDoc, collection, addDoc, getDocs, query, where, updateDoc } from "firebase/firestore";
import { getSystemInstruction } from "./context";

export async function handleOmnichannelMessage(userId: string, platform: string, message: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }

  const ai = new GoogleGenAI({ apiKey });
  const conversationRef = doc(db, "conversations", userId);
  const conversationSnap = await getDoc(conversationRef);
  
  let history: { role: string, parts: Part[] }[] = [];
  
  if (conversationSnap.exists()) {
    history = conversationSnap.data()?.history || [];
  } else {
    // New conversation
    history = [];
  }

  // Push the new user message
  history.push({ role: "user", parts: [{ text: message }] });

  // Get context for this user
  const systemInstruction = await getSystemInstruction(userId);

  let responseText = "";
  
  try {
    let currentHistory = [...history];
    let isDone = false;
    
    while (!isDone) {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: currentHistory,
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.2,
          tools: tools as any,
          toolConfig: { includeServerSideToolInvocations: true }
        },
      });

      if (response.functionCalls && response.functionCalls.length > 0) {
        // Model wants to call a tool
        // Push the model's message with function calls
        currentHistory.push(response.candidates![0].content as any);
        
        const functionResponses = [];
        for (const call of response.functionCalls) {
          console.log(`Executing tool from text API: ${call.name}`, call.args);
          const result = await handleToolCall(call.name, call.args);
          functionResponses.push({
            id: call.id,
            name: call.name,
            response: result
          });
        }
        
        // Push the function responses back to the model
        currentHistory.push({
          role: "user",
          parts: functionResponses.map(fr => ({
            functionResponse: { name: fr.name, id: fr.id, response: fr.response }
          }))
        } as any);
        
      } else {
        // Model responded with text
        responseText = response.text || "";
        currentHistory.push({ role: "model", parts: [{ text: responseText }] });
        isDone = true;
      }
    }
    
    // Save updated history
    await setDoc(conversationRef, {
      userId,
      platform,
      lastMessageAt: new Date().toISOString(),
      history: currentHistory
    });

    // Save inbound and outbound messages to the Firestore "messages" collection for CRM sync and triage
    try {
      let patientId = "pat_2"; // default fallback is Sara Ahmed
      const patientsCol = collection(db, "patients");
      const qPatients = query(patientsCol, where("phone", "==", userId));
      const pSnap = await getDocs(qPatients);
      if (!pSnap.empty) {
        patientId = pSnap.docs[0].id;
      }

      // 1. Inbound patient message
      const inboundDocRef = await addDoc(collection(db, 'messages'), {
        patientId,
        content: message,
        direction: 'inbound',
        status: 'read',
        timestamp: new Date().toISOString()
      });

      // 2. Outbound AI reply
      await addDoc(collection(db, 'messages'), {
        patientId,
        content: responseText,
        direction: 'outbound',
        status: 'read',
        timestamp: new Date().toISOString()
      });

      // 3. Classify the inbound message for the Triage queue (non-blocking)
      classifyAndSaveTriage(inboundDocRef.id, 'message', message).catch(err => {
        console.error("Failed to run automated triage classification:", err);
      });
    } catch (crmErr) {
      console.error("Failed to sync message to CRM collection:", crmErr);
    }

    // Trigger background conversation evaluation (non-blocking)
    evaluateConversation(message, responseText).catch(err => {
      console.error("Failed to run background conversation evaluation:", err);
    });

    return responseText;
  } catch (error) {
    console.error("Gemini API Error in omnichannel handler:", error);
    throw error;
  }
}

// Keep handleChat for backward compatibility or simple use cases
export async function handleChat(messages: any[]) {
  // We can just use handleOmnichannelMessage for it
  const textMessage = messages[messages.length - 1]?.parts[0]?.text || "Hello";
  return handleOmnichannelMessage("web_guest", "web", textMessage);
}

export async function handleMultimodalScreening(imageBase64: string, mimeType: string, patientNotes?: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Clean the base64 prefix if it exists (e.g., "data:image/png;base64,")
  let cleanBase64 = imageBase64;
  if (cleanBase64.includes(";base64,")) {
    cleanBase64 = cleanBase64.split(";base64,").pop() || "";
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [
        {
          inlineData: {
            data: cleanBase64,
            mimeType: mimeType || "image/jpeg",
          }
        },
        {
          text: `You are an expert dental receptionist AI triage assistant. Analyze this patient-uploaded dental or oral image and any provided notes: "${patientNotes || 'None provided'}".
Determine the urgency level, key findings, actionable next steps, and professional advice.
CRITICAL MANDATES:
1. DO NOT DIAGNOSE a specific clinical pathology (e.g. do not say "You have a periapical abscess in tooth #14"). Instead, describe visible signs/features (e.g., "visible localized swelling of the gum tissue", "apparent tooth fracture", "surface discoloration").
2. ADVISE clearly that only a licensed dentist can make a diagnosis.
3. Recommend an Urgency Level strictly chosen from:
   - "IMMEDIATE EMERGENCY" (for life-threatening signs like severe facial swelling extending to the eye/neck, breathing/swallowing difficulty, heavy persistent bleeding, knocked-out permanent tooth)
   - "PROMPT EVALUATION" (for broken tooth with pain, visible dental abscess or pimple on the gum, moderate toothache, loose crown with discomfort)
   - "ROUTINE/MONITOR" (for minor chips without pain, cosmetic concerns, surface staining, minor cold sensitivity)
4. Format the final output strictly as a JSON object matching this schema:
{
  "disclaimer": "Only a dentist can make a medical diagnosis. This AI screening provides educational urgency levels based on visible signs.",
  "urgencyLevel": "IMMEDIATE EMERGENCY" | "PROMPT EVALUATION" | "ROUTINE/MONITOR",
  "findings": ["finding 1", "finding 2"],
  "reasoning": "the reason for this classification",
  "nextSteps": ["step 1", "step 2"],
  "friendlyAdvice": "comforting/informative tip"
}`
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            disclaimer: { type: Type.STRING },
            urgencyLevel: { type: Type.STRING },
            findings: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            reasoning: { type: Type.STRING },
            nextSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            friendlyAdvice: { type: Type.STRING }
          },
          required: ["disclaimer", "urgencyLevel", "findings", "reasoning", "nextSteps", "friendlyAdvice"]
        }
      }
    });

    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("Multimodal screening Gemini error:", error);
    throw error;
  }
}

async function evaluateConversation(userMessage: string, aiReply: string) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return;

    const ai = new GoogleGenAI({ apiKey });
    
    const evaluationPrompt = `You are an AI supervisor evaluating an interaction between a patient and a dental clinic AI receptionist.
Analyze the following exchange:
Patient: "${userMessage}"
AI Receptionist: "${aiReply}"

Determine if the patient asked a clear question about the clinic's services, hours, facility, prices, staff, or policies that the AI was UNABLE to answer because it lacked specific information or gave an "I don't know" style response.

If the AI receptionist could NOT fully answer the question due to missing clinic context or gave a generic polite refusal because it didn't know, classify this as unanswered.

Format your output strictly as a JSON object matching this schema:
{
  "isUnanswered": boolean,
  "question": "The specific question asked by the patient, cleaned up and summarized (e.g. 'Do you offer Invisalign?' or 'Is parking free?')",
  "category": "Pricing" | "Services" | "Facility" | "Policies" | "Staff" | "Other",
  "suggestedAnswer": "A professional placeholder draft of the answer (e.g. 'Please clarify if the clinic offers this.')"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: evaluationPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isUnanswered: { type: Type.BOOLEAN },
            question: { type: Type.STRING },
            category: { type: Type.STRING },
            suggestedAnswer: { type: Type.STRING }
          },
          required: ["isUnanswered", "question", "category", "suggestedAnswer"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    
    if (result.isUnanswered && result.question) {
      const { collection, query, where, getDocs, addDoc, updateDoc } = await import("firebase/firestore");
      
      // Check if this question already exists (case insensitive or approximate)
      const q = query(collection(db, "unanswered_questions"), where("status", "==", "pending"));
      const snapshot = await getDocs(q);
      
      let foundDoc = null;
      for (const d of snapshot.docs) {
        const existingQ = d.data().question.toLowerCase().trim();
        const newQ = result.question.toLowerCase().trim();
        if (existingQ === newQ || existingQ.includes(newQ) || newQ.includes(existingQ)) {
          foundDoc = d;
          break;
        }
      }

      if (foundDoc) {
        await updateDoc(foundDoc.ref, {
          count: (foundDoc.data().count || 1) + 1,
          updatedAt: new Date().toISOString()
        });
        console.log(`[Self-Improving AI] Incremented unanswered question count: ${result.question}`);
      } else {
        await addDoc(collection(db, "unanswered_questions"), {
          question: result.question,
          category: result.category,
          count: 1,
          status: "pending",
          suggestedAnswer: result.suggestedAnswer,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        console.log(`[Self-Improving AI] Logged new unanswered question: ${result.question}`);
      }
    }
  } catch (error) {
    console.error("Error in evaluateConversation:", error);
  }
}

export async function classifyTriage(text: string, type: 'message' | 'call') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing");
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `You are an expert dental receptionist AI triage assistant.
Analyze the following patient incoming communication (${type}) and classify its urgency strictly into one of three categories:
1. "Urgent/Emergency": For severe pain, swelling of the face/gums/neck, fever, uncontrolled bleeding, trauma/fractured tooth with acute symptoms, knocked-out tooth, or other immediate dental emergencies.
2. "Routine": For standard treatments, scheduling a routine checkup/cleaning, tooth sensitivity that is mild, follow-up appointments, or fitting already planned crowns/orthodontics.
3. "General Inquiry": For general non-clinical questions like opening hours, location, insurance coverage, prices, parking, or request for information.

Your classification MUST be returned strictly as a JSON object matching this schema:
{
  "category": "Urgent/Emergency" | "Routine" | "General Inquiry",
  "reason": "A brief 1-sentence professional explanation of why this classification was chosen (in French if the original input is in French/Darija, or English)."
}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `Incoming Patient ${type}: "${text}"`,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            reason: { type: Type.STRING }
          },
          required: ["category", "reason"]
        }
      }
    });

    const textResult = response.text || "{}";
    const result = JSON.parse(textResult);
    
    // Validate returned category
    const validCategories = ["Urgent/Emergency", "Routine", "General Inquiry"];
    if (!validCategories.includes(result.category)) {
      result.category = "General Inquiry";
    }

    return result;
  } catch (error) {
    console.error("Error in classifyTriage:", error);
    return {
      category: "General Inquiry",
      reason: "Évaluation automatique temporairement indisponible."
    };
  }
}

export async function classifyAndSaveTriage(docId: string, type: 'message' | 'call', text: string) {
  try {
    const { doc, updateDoc } = await import("firebase/firestore");
    const classification = await classifyTriage(text, type);
    
    const collectionName = type === 'message' ? 'messages' : 'callLogs';
    const docRef = doc(db, collectionName, docId);
    
    await updateDoc(docRef, {
      triageCategory: classification.category,
      triageReason: classification.reason,
      triageAnalyzedAt: new Date().toISOString()
    });
    
    console.log(`[AI Triage] Successfully categorized ${type} ${docId} as ${classification.category}`);
    return classification;
  } catch (error) {
    console.error(`Error in classifyAndSaveTriage for ${type} ${docId}:`, error);
  }
}
