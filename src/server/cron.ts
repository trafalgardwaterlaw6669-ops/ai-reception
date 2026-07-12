import { adminDb } from "../lib/firebase-admin.js";

export function startCronJobs() {
  console.log("Starting appointment reminder cron job...");

  // Check every minute
  setInterval(async () => {
    try {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      const tomorrowStr = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD
      const nowStr = now.toISOString().split('T')[0]; // YYYY-MM-DD

      // Fetch appointments for tomorrow and today using admin SDK
      const appointmentsRef = adminDb.collection("appointments");
      const q = appointmentsRef.where("date", "in", [nowStr, tomorrowStr]);
      const snapshot = await q.get();

      if (snapshot.empty) {
        return;
      }

      const batch = adminDb.batch();
      let hasUpdates = false;
      
      for (const document of snapshot.docs) {
        const data = document.data();
        
        // Skip if already sent
        if (data.reminderSent === true) {
          continue;
        }
        
        // Parse appointment date/time
        // Assuming data.date is "YYYY-MM-DD" and data.time is "HH:MM"
        const appointmentDate = new Date(`${data.date}T${data.time}:00`);
        
        // Check if appointment is within the next 24 hours
        const timeDiff = appointmentDate.getTime() - now.getTime();
        const hoursUntilAppointment = timeDiff / (1000 * 60 * 60);

        if (hoursUntilAppointment > 0 && hoursUntilAppointment <= 24) {
          console.log(`Sending reminder to ${data.patientName} for appointment at ${data.date} ${data.time}`);
          
          // 1. Log the reminder
          const reminderRef = adminDb.collection("reminders").doc();
          batch.set(reminderRef, {
            appointmentId: document.id,
            patientName: data.patientName,
            phone: data.phone || "",
            type: "SMS",
            status: "Sent",
            message: `Reminder: You have an appointment tomorrow at ${data.time}.`,
            sentAt: new Date().toISOString()
          });

          // 2. Mark appointment as reminded
          batch.update(document.ref, { reminderSent: true });
          hasUpdates = true;
        }
      }

      if (hasUpdates) {
        await batch.commit();
      }
      
    } catch (error) {
      console.error("Error running reminder cron job:", error);
    }
  }, 60 * 1000); // 1 minute
}


