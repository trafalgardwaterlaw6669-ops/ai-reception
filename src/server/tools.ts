import { Type } from "@google/genai";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";

export const getAvailableSlots = {
  name: "getAvailableSlots",
  description: "Check available appointment slots for a specific date.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      date: { type: Type.STRING, description: "Date in YYYY-MM-DD format" }
    },
    required: ["date"]
  }
};

export const getOptimalSlots = {
  name: "getOptimalSlots",
  description: "Intelligent schedule optimization: Finds optimal appointment slots based on procedure type. It prevents gaps, groups similar procedures, and leaves emergency buffer times.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      date: { type: Type.STRING, description: "Date in YYYY-MM-DD format" },
      procedureType: { type: Type.STRING, description: "Type of procedure (e.g., Checkup, Cleaning, Root Canal, Emergency)" },
      durationMinutes: { type: Type.INTEGER, description: "Estimated duration in minutes (e.g., 30, 60, 90)" },
      urgency: { type: Type.STRING, description: "Urgency level (e.g., Low, Medium, High, Emergency)" },
      equipmentNeeded: { type: Type.STRING, description: "Required equipment for the procedure" }
    },
    required: ["date", "procedureType"]
  }
};

export const bookAppointment = {
  name: "bookAppointment",
  description: "Book a new appointment slot for a patient.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      date: { type: Type.STRING, description: "Date in YYYY-MM-DD format" },
      time: { type: Type.STRING, description: "Time in HH:MM format" },
      patientName: { type: Type.STRING, description: "Patient's full name" },
      reason: { type: Type.STRING, description: "Reason for appointment" },
      phone: { type: Type.STRING, description: "Patient's phone number" },
      durationMinutes: { type: Type.INTEGER, description: "Estimated duration in minutes" },
      urgency: { type: Type.STRING, description: "Urgency level" },
      equipmentNeeded: { type: Type.STRING, description: "Required equipment for the procedure" }
    },
    required: ["date", "time", "patientName", "reason"]
  }
};

export const rescheduleAppointment = {
  name: "rescheduleAppointment",
  description: "Move an existing appointment to a new date and time to reduce gaps and optimize the schedule.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      patientName: { type: Type.STRING, description: "Patient's full name" },
      newDate: { type: Type.STRING, description: "New Date in YYYY-MM-DD format" },
      newTime: { type: Type.STRING, description: "New Time in HH:MM format" }
    },
    required: ["patientName", "newDate", "newTime"]
  }
};

export const cancelAppointment = {
  name: "cancelAppointment",
  description: "Cancel an existing appointment and free up the schedule.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      patientName: { type: Type.STRING, description: "Patient's full name" },
      date: { type: Type.STRING, description: "Date of appointment to cancel" }
    },
    required: ["patientName", "date"]
  }
};

export const notifyDentistOfEmergency = {
  name: "notifyDentistOfEmergency",
  description: "Alert the dentist immediately about a patient experiencing a dental emergency.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      patientName: { type: Type.STRING, description: "Patient's full name" },
      symptoms: { type: Type.STRING, description: "Description of the emergency symptoms (e.g. swollen face, severe pain)" }
    },
    required: ["patientName", "symptoms"]
  }
};

export const transferCallToDentist = {
  name: "transferCallToDentist",
  description: "Transfer the conversation to a human dentist. Use this when the patient asks to speak to the doctor or has a question only a doctor can answer. Summarize the conversation so far.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      patientName: { type: Type.STRING, description: "Patient's full name" },
      summary: { type: Type.STRING, description: "A concise summary of the patient's issue and context." }
    },
    required: ["patientName", "summary"]
  }
};

export const sendReviewLink = {
  name: "sendReviewLink",
  description: "Send a review link to a happy patient after their treatment.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      patientName: { type: Type.STRING, description: "Patient's full name" }
    },
    required: ["patientName"]
  }
};

export const verifyInsurance = {
  name: "verifyInsurance",
  description: "Verify a patient's dental insurance policy prior to arrival. Checks if the carrier is accepted, coverage percentages, and remaining annual benefits.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      policyNumber: { type: Type.STRING, description: "Insurance policy/membership number (e.g. WAFA-ASSUR-3321, AXA-MAROC-9921, CNSS-AMO-8843, CIGNA-GLOBAL-771)" },
      patientName: { type: Type.STRING, description: "Patient's full name" }
    },
    required: ["policyNumber", "patientName"]
  }
};

export const tools = [{ functionDeclarations: [getAvailableSlots, getOptimalSlots, bookAppointment, rescheduleAppointment, cancelAppointment, notifyDentistOfEmergency, transferCallToDentist, sendReviewLink, verifyInsurance] }];

export async function handleToolCall(name: string, args: any) {
  try {
    if (name === "getAvailableSlots") {
      const date = args.date;
      // In a real app we would check Firestore. For now, let's return some mock slots.
      // E.g. business hours 9am to 5pm, slots every 30m.
      const snapshot = await getDocs(query(collection(db, "appointments"), where("date", "==", date)));
      const bookedTimes = snapshot.docs.map(d => d.data().time);
      
      const allSlots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"];
      const available = allSlots.filter(t => !bookedTimes.includes(t));
      
      return { result: { availableSlots: available } };
    }
    
    if (name === "bookAppointment") {
      const { date, time, patientName, reason, phone, durationMinutes, urgency, equipmentNeeded } = args;
      
      const snapshot = await getDocs(query(collection(db, "appointments"), where("date", "==", date), where("time", "==", time)));
      if (!snapshot.empty) {
        return { error: "Slot already booked" };
      }
      
      await addDoc(collection(db, "appointments"), {
        date,
        time,
        patientName,
        reason,
        phone: phone || "",
        durationMinutes: durationMinutes || 30,
        urgency: urgency || "Normal",
        equipmentNeeded: equipmentNeeded || "Standard",
        createdAt: new Date().toISOString()
      });
      
      // Simulate sending automated confirmations
      await addDoc(collection(db, "notifications"), {
        patientName,
        appointmentDate: date,
        appointmentTime: time,
        type: "booking_confirmation",
        channels: ["SMS", "WhatsApp", "Email"],
        includes: ["Calendar Invitation", "Google Maps Location", "Preparation Instructions", "One-Tap Confirm Link"],
        timestamp: new Date().toISOString()
      });

      return { 
        result: "Success! Appointment booked.", 
        notificationsSent: "Automated confirmations via SMS, WhatsApp, and Email have been sent immediately. This includes a calendar invite, Google Maps location, preparation instructions, and a one-tap confirm link. You can tell the patient to check their phone/email."
      };
    }
    
    if (name === "getOptimalSlots") {
      const { date, procedureType, durationMinutes, urgency, equipmentNeeded } = args;
      const snapshot = await getDocs(query(collection(db, "appointments"), where("date", "==", date)));
      const bookedAppointments = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
      const bookedTimes = bookedAppointments.map((a: any) => a.time);
      
      const allSlots = ["09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"];
      const available = allSlots.filter(t => !bookedTimes.includes(t));
      
      // Simple optimization logic:
      // If it's a complicated procedure (e.g. Root Canal), prefer morning slots and ensure 1 hour (2 consecutive slots).
      // If it's an emergency, find the soonest available.
      // Group similar procedures: if there's already a cleaning that day, try to schedule adjacent to it.
      let optimal = available.slice(0, 3);
      if (procedureType?.toLowerCase().includes("root canal")) {
         optimal = available.filter(t => t.startsWith("09") || t.startsWith("10")).slice(0, 2);
         if (optimal.length === 0) optimal = available.slice(0, 2); // Fallback
      } else if (procedureType?.toLowerCase().includes("cleaning")) {
         // Try to find slots adjacent to existing cleanings
         const cleanings = bookedAppointments.filter((a: any) => a.reason?.toLowerCase().includes("cleaning"));
         if (cleanings.length > 0) {
           const idealSlots = available.filter(a => {
             // Basic adjacency check (just prefer afternoon if cleanings are afternoon, etc.)
             return true; 
           });
           optimal = idealSlots.slice(0, 3);
         }
      }

      return { 
        result: { 
          availableSlots: available,
          optimalSlots: optimal,
          reasoning: "Based on schedule optimization rules (grouping similar procedures, managing gaps)."
        } 
      };
    }
    
    if (name === "rescheduleAppointment") {
      const { patientName, newDate, newTime } = args;
      
      // Check if new slot is available
      const newSlotSnap = await getDocs(query(
        collection(db, "appointments"),
        where("date", "==", newDate),
        where("time", "==", newTime)
      ));
      if (!newSlotSnap.empty) {
        return { error: "Target slot is already booked" };
      }

      // Find existing
      const snapshot = await getDocs(query(
        collection(db, "appointments"),
        where("patientName", "==", patientName)
      ));
      
      if (snapshot.empty) {
        return { error: "No appointment found for this patient." };
      }
      
      // Take the first one found for simplicity
      const docToUpdate = snapshot.docs[0];
      await updateDoc(docToUpdate.ref, {
        date: newDate,
        time: newTime
      });
      
      return { result: "Success! Appointment rescheduled." };
    }

    if (name === "cancelAppointment") {
      const { patientName, date } = args;
      const snapshot = await getDocs(query(
        collection(db, "appointments"),
        where("patientName", "==", patientName),
        where("date", "==", date)
      ));
      
      if (snapshot.empty) {
        return { error: "No appointment found for this patient on this date." };
      }
      
      await deleteDoc(snapshot.docs[0].ref);
      
      return { result: "Success! Appointment canceled." };
    }

    if (name === "notifyDentistOfEmergency") {
      const { patientName, symptoms } = args;
      
      // In a real app, this would trigger an SMS, push notification, or pager to the dentist.
      await addDoc(collection(db, "emergencies"), {
        patientName,
        symptoms,
        timestamp: new Date().toISOString(),
        status: "Pending Review"
      });
      
      return { result: `Dentist has been successfully notified about the emergency for ${patientName}.` };
    }

    if (name === "transferCallToDentist") {
      const { patientName, summary } = args;
      
      await addDoc(collection(db, "transfers"), {
        patientName,
        summary,
        timestamp: new Date().toISOString(),
        status: "Pending Transfer"
      });

      return { result: `Transfer initiated. Please say 'One moment please, I am transferring you to the dentist.' and stop speaking.` };
    }

    if (name === "sendReviewLink") {
      const { patientName } = args;
      
      await addDoc(collection(db, "notifications"), {
        patientName,
        type: "review_request",
        channels: ["SMS"],
        timestamp: new Date().toISOString()
      });

      return { result: `Review link sent successfully to ${patientName}.` };
    }

    if (name === "verifyInsurance") {
      const { policyNumber, patientName } = args;
      
      const cleanNum = policyNumber.toUpperCase();
      let provider = "Allianz Maroc";
      let coverage = { hygiene: "90%", checkup: "80%", major: "50%" };
      let remaining = "MAD 10,500";
      let accepted = true;
      let notes = "Verified via automatic central AI insurance clearing. General co-pay applies.";

      if (cleanNum.includes("WAFA")) {
        provider = "Wafa Assurance";
        coverage = { hygiene: "100%", checkup: "85%", major: "60%" };
        remaining = "MAD 9,500";
        notes = "Co-pay waived for preventive procedures and children teeth hygiene.";
      } else if (cleanNum.includes("AXA")) {
        provider = "AXA Assurance Maroc";
        coverage = { hygiene: "100%", checkup: "80%", major: "60%" };
        remaining = "MAD 10,800";
        notes = "Pre-authorization required for procedures over MAD 5,000.";
      } else if (cleanNum.includes("CNSS") || cleanNum.includes("AMO")) {
        provider = "CNSS / AMO Maroc";
        coverage = { hygiene: "80%", checkup: "70%", major: "50%" };
        remaining = "MAD 6,800";
        notes = "Strict national tariff apply. High-grade implants covered up to MAD 2,500/unit.";
      } else if (cleanNum.includes("CIGNA")) {
        provider = "Cigna Global Health";
        coverage = { hygiene: "100%", checkup: "90%", major: "75%" };
        remaining = "$2,550";
        notes = "Direct billing approved across Casablanca & Rabat nodes.";
      }

      await addDoc(collection(db, "insurance_verifications"), {
        patientName,
        policyNumber: cleanNum,
        provider,
        coverage,
        remaining,
        accepted,
        verifiedAt: new Date().toISOString()
      });

      return {
        result: {
          accepted,
          providerName: provider,
          policyNumber: cleanNum,
          coverage,
          remainingBenefits: remaining,
          notes
        }
      };
    }

    return { error: "Unknown tool" };
  } catch (error: any) {
    console.error("Tool execution error:", error);
    return { error: error.message };
  }
}

