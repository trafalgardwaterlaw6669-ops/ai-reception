import { db } from "../lib/firebase.js";
import { collection, query, where, getDocs, writeBatch, doc } from "firebase/firestore";

export async function runReminderCheck(): Promise<{ processedCount: number; sentReminders: any[] }> {
  let processedCount = 0;
  const sentReminders: any[] = [];

  try {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    const tomorrowStr = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD
    const nowStr = now.toISOString().split('T')[0]; // YYYY-MM-DD

    // Fetch appointments for today and tomorrow using client SDK
    const appointmentsRef = collection(db, "appointments");
    const q = query(appointmentsRef, where("date", "in", [nowStr, tomorrowStr]));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return { processedCount: 0, sentReminders: [] };
    }

    const batch = writeBatch(db);
    let hasUpdates = false;

    for (const document of snapshot.docs) {
      const data = document.data();
      
      // Skip if already sent or if appointment is cancelled
      if (data.reminderSent === true || data.status === 'Cancelled' || data.status === 'Annulé') {
        continue;
      }
      
      // Parse appointment date/time
      const timeStr = data.time || "09:00";
      const appointmentDate = new Date(`${data.date}T${timeStr}:00`);
      
      // Check if appointment is within the next 24 hours
      const timeDiff = appointmentDate.getTime() - now.getTime();
      const hoursUntilAppointment = timeDiff / (1000 * 60 * 60);

      // Trigger 24 hours before scheduled appointment (or within the 0 to 24 hour window)
      if (hoursUntilAppointment > -2 && hoursUntilAppointment <= 24) {
        const patientName = data.patientName || "Patient";
        const phone = data.phone || data.patientPhone || "+212 6 00 00 00 00";
        const dateStr = data.date;
        const smsMessage = `[Rappel Cabinet Dentaire] Bonjour ${patientName}, nous vous rappelons votre rendez-vous prévu le ${dateStr} à ${timeStr}. En cas d'empêchement, merci de nous contacter au plus vite.`;

        console.log(`[SMS Service] Triggering 24h SMS reminder for ${patientName} (${phone}) - Appt: ${dateStr} ${timeStr}`);
        
        // 1. Log the reminder in Firestore 'reminders' collection
        const reminderRef = doc(collection(db, "reminders"));
        const reminderData = {
          appointmentId: document.id,
          patientName: patientName,
          phone: phone,
          type: "SMS",
          status: "Sent",
          message: smsMessage,
          sentAt: new Date().toISOString()
        };

        batch.set(reminderRef, reminderData);

        // 2. Mark appointment as reminded
        batch.update(document.ref, { 
          reminderSent: true,
          reminderSentAt: new Date().toISOString()
        });

        hasUpdates = true;
        processedCount++;
        sentReminders.push({ id: reminderRef.id, ...reminderData });
      }
    }

    if (hasUpdates) {
      await batch.commit();
      console.log(`[SMS Service] Batch committed: ${processedCount} SMS reminder(s) sent.`);
    }

  } catch (error) {
    console.error("[SMS Service] Error running reminder cron job:", error);
  }

  return { processedCount, sentReminders };
}

export function startCronJobs() {
  console.log("Starting appointment reminder background service...");

  // Run immediately on boot
  runReminderCheck().catch(err => {
    console.error("Initial reminder check failed:", err);
  });

  // Check every minute
  setInterval(() => {
    runReminderCheck().catch(err => {
      console.error("Scheduled reminder check failed:", err);
    });
  }, 60 * 1000); // 1 minute
}



