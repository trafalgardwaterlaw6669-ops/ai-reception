import { db } from './firebase';
import { collection, doc, updateDoc, addDoc, getDocs, query, where, deleteDoc } from 'firebase/firestore';

/**
 * Interface representing a Google Calendar Event retrieved or synced.
 */
export interface GCalEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  hangoutLink?: string;
}

/**
 * Creates or updates an appointment in Google Calendar.
 * Returns the Google Calendar Event ID and Meet/Hangout link.
 */
export async function syncAppointmentToGoogleCalendar(
  appointment: {
    id?: string;
    patientName: string;
    phone: string;
    patientEmail?: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    reason: string;
    notes?: string;
    clinicId: string;
  },
  token: string | null,
  isDemo: boolean = false
): Promise<{ gcalEventId: string; meetLink: string | null }> {
  const startDateTime = `${appointment.date}T${appointment.time}:00`;
  // Assume a default 30 minute duration
  const endHourMin = addMinutesToTime(appointment.time, 30);
  const endDateTime = `${appointment.date}T${endHourMin}:00`;

  const eventBody: any = {
    summary: `🦷 AuraDental: ${appointment.reason} - ${appointment.patientName}`,
    description: `Rendez-vous médical chez AuraDental.\nPatient: ${appointment.patientName}\nTéléphone: ${appointment.phone}\nCabinet: ${appointment.clinicId.toUpperCase()}\nNotes: ${appointment.notes || 'Aucune'}\n\n[AuraDental]`,
    start: {
      dateTime: startDateTime,
      timeZone: 'Africa/Casablanca',
    },
    end: {
      dateTime: endDateTime,
      timeZone: 'Africa/Casablanca',
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 24 hours before
        { method: 'popup', minutes: 60 },      // 1 hour before
      ],
    },
    conferenceData: {
      createRequest: {
        requestId: `meet_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
  };

  if (appointment.patientEmail) {
    eventBody.attendees = [
      { email: appointment.patientEmail, displayName: appointment.patientName }
    ];
  }

  if (isDemo || !token) {
    console.log('[Demo Mode] Syncing to Google Calendar: ', eventBody);
    // Simulate a successful sync
    const randomEventId = `gcal_demo_${Date.now()}`;
    const mockMeetLink = 'https://meet.google.com/demo-meet-link';
    return { gcalEventId: randomEventId, meetLink: mockMeetLink };
  }

  try {
    const url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(eventBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Google Calendar API Error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return {
      gcalEventId: data.id,
      meetLink: data.hangoutLink || null,
    };
  } catch (err) {
    console.error('Error in syncAppointmentToGoogleCalendar:', err);
    throw err;
  }
}

/**
 * Removes an event from Google Calendar.
 */
export async function deleteAppointmentFromGoogleCalendar(
  gcalEventId: string,
  token: string | null,
  isDemo: boolean = false
): Promise<boolean> {
  if (isDemo || !token) {
    console.log('[Demo Mode] Deleted Google Calendar Event:', gcalEventId);
    return true;
  }

  try {
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${gcalEventId}`;
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.ok;
  } catch (err) {
    console.error('Error deleting Google Calendar event:', err);
    return false;
  }
}

/**
 * Fetches Google Calendar events for a specific date range and identifies slots to block off.
 */
export async function fetchGoogleCalendarBlockedSlots(
  date: string, // YYYY-MM-DD
  token: string | null,
  isDemo: boolean = false
): Promise<Array<{ id: string; summary: string; time: string; duration: number }>> {
  if (isDemo || !token) {
    // Return standard mock Google Calendar personal events to block off
    return [
      {
        id: 'external_event_1',
        summary: 'Dentist Personal Break: Lunch with Ortho Supplier',
        time: '12:00',
        duration: 60,
      },
      {
        id: 'external_event_2',
        summary: 'Google Calendar: Clinique Aura Staff Meeting',
        time: '17:00',
        duration: 30,
      }
    ];
  }

  try {
    const timeMin = `${date}T00:00:00Z`;
    const timeMax = `${date}T23:59:59Z`;
    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.statusText}`);
    }

    const data = await response.json();
    const items: GCalEvent[] = data.items || [];

    // Filter out AuraDental events (we only want EXTERNAL events that block dentist availability)
    const externalEvents = items.filter(item => {
      const isAuraDental = item.description?.includes('[AuraDental]') || item.summary?.includes('AuraDental');
      return !isAuraDental;
    });

    return externalEvents.map(event => {
      const startDateTimeStr = event.start.dateTime || event.start.date || '';
      let timeStr = '09:00';
      let duration = 30;

      if (startDateTimeStr.includes('T')) {
        const timePart = startDateTimeStr.split('T')[1];
        timeStr = timePart.substring(0, 5); // HH:MM

        if (event.end?.dateTime) {
          const diffMs = new Date(event.end.dateTime).getTime() - new Date(startDateTimeStr).getTime();
          duration = Math.max(15, Math.round(diffMs / 60000));
        }
      }

      return {
        id: event.id,
        summary: event.summary || 'Occupation Personnelle (Bloqué)',
        time: timeStr,
        duration: duration,
      };
    });
  } catch (err) {
    console.error('Error fetching Google Calendar blocked slots:', err);
    return [];
  }
}

/**
 * Sends a highly professional, stylish HTML appointment confirmation email to the patient via Gmail API.
 */
export async function sendGmailAppointmentConfirmation(
  params: {
    patientName: string;
    patientEmail: string;
    date: string;
    time: string;
    reason: string;
    meetLink?: string | null;
    clinicName: string;
    clinicPhone: string;
  },
  token: string | null,
  isDemo: boolean = false
): Promise<boolean> {
  const formattedDate = new Date(params.date).toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const emailLines = [
    `To: ${params.patientEmail}`,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: 🦷 Confirmation de votre rendez-vous - ${params.clinicName}`,
    '',
    `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Confirmation de rendez-vous</title>
    </head>
    <body style="margin:0; padding:0; background-color:#f1f5f9; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f1f5f9; padding:40px 20px;">
        <tr>
          <td align="center">
            <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 10px 15px -3px rgba(0,0,0,0.1); max-width:600px;">
              <!-- Header -->
              <tr>
                <td style="background-color:#2563eb; padding:32px; text-align:center;">
                  <h1 style="color:#ffffff; margin:0; font-size:24px; font-weight:800; letter-spacing:-0.025em;">AuraDental Care</h1>
                  <p style="color:#bfdbfe; margin:8px 0 0 0; font-size:14px; font-weight:500;">Votre sourire, notre engagement au quotidien</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding:40px 32px;">
                  <p style="font-size:16px; line-height:24px; color:#1e293b; margin:0 0 16px 0;">
                    Bonjour <strong>${params.patientName}</strong>,
                  </p>
                  <p style="font-size:15px; line-height:24px; color:#334155; margin:0 0 24px 0;">
                    Nous vous confirmons la bonne prise en compte de votre rendez-vous médical auprès de notre cabinet dentaire intelligent. Notre équipe de soins met tout en œuvre pour vous accueillir dans les meilleures conditions.
                  </p>
                  
                  <!-- Box Détails -->
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color:#f8fafc; border-radius:12px; border:1px solid #e2e8f0; margin-bottom:24px;">
                    <tr>
                      <td style="padding:20px;">
                        <table width="100%" border="0" cellspacing="0" cellpadding="0">
                          <tr>
                            <td style="padding-bottom:12px; border-bottom:1px solid #cbd5e1;">
                              <span style="font-size:12px; text-transform:uppercase; color:#64748b; font-weight:700; letter-spacing:0.05em;">Type de Soin</span><br>
                              <span style="font-size:15px; color:#0f172a; font-weight:600; margin-top:4px; display:inline-block;">${params.reason}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:12px 0; border-bottom:1px solid #cbd5e1;">
                              <span style="font-size:12px; text-transform:uppercase; color:#64748b; font-weight:700; letter-spacing:0.05em;">Date & Heure</span><br>
                              <span style="font-size:15px; color:#0f172a; font-weight:600; margin-top:4px; display:inline-block; capitalize">${formattedDate} à ${params.time}</span>
                            </td>
                          </tr>
                          ${params.meetLink ? `
                          <tr>
                            <td style="padding-top:12px;">
                              <span style="font-size:12px; text-transform:uppercase; color:#64748b; font-weight:700; letter-spacing:0.05em;">Téléconsultation Vidéo</span><br>
                              <a href="${params.meetLink}" style="font-size:15px; color:#2563eb; font-weight:700; text-decoration:none; margin-top:4px; display:inline-block;">
                                🎥 Rejoindre Google Meet &rarr;
                              </a>
                            </td>
                          </tr>` : ''}
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Réduction des No-Shows -->
                  <div style="background-color:#fffbeb; border:1px solid #fef3c7; border-radius:12px; padding:20px; margin-bottom:32px;">
                    <h4 style="margin:0 0 8px 0; color:#b45309; font-size:14px; font-weight:700; text-transform:uppercase; letter-spacing:0.025em;">⚠️ Politique de No-Show & Annulation</h4>
                    <p style="margin:0; font-size:13px; line-height:20px; color:#78350f;">
                      Afin de garantir un accès rapide aux soins d'urgence pour l'ensemble de nos patients :
                      <br><br>
                      1. Ce rendez-vous a automatiquement bloqué le planning de notre praticien.<br>
                      2. Toute demande de modification ou d'annulation doit être formulée au moins <strong>24 heures à l'avance</strong>.<br>
                      3. En cas d'imprévu, veuillez répondre à cet e-mail ou appeler notre secrétariat au <strong>${params.clinicPhone}</strong>.
                    </p>
                  </div>
                  
                  <p style="font-size:14px; line-height:20px; color:#64748b; margin:0; text-align:center;">
                    Nous vous remercions de votre confiance et vous souhaitons une excellente journée.
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color:#f8fafc; padding:24px; text-align:center; border-top:1px solid #e2e8f0;">
                  <p style="color:#94a3b8; font-size:12px; margin:0 0 4px 0;">${params.clinicName}</p>
                  <p style="color:#cbd5e1; font-size:11px; margin:0;">Ce message a été généré automatiquement par l'assistant IA AuraDental.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    `
  ];

  const emailRaw = emailLines.join('\r\n');

  if (isDemo || !token) {
    console.log('[Demo Mode] Sending confirmation email via Gmail:', params);
    return true;
  }

  try {
    const base64Safe = btoa(unescape(encodeURIComponent(emailRaw)))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await fetch('https://gmail.googleapis.com/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: base64Safe,
      }),
    });

    if (!response.ok) {
      const errTxt = await response.text();
      console.error('Gmail send failed:', errTxt);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error sending confirmation email via Gmail:', err);
    return false;
  }
}

/**
 * Helper to add minutes to HH:MM time string and return new HH:MM string.
 */
function addMinutesToTime(timeStr: string, minutes: number): string {
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10);
  let m = parseInt(mStr, 10);
  m += minutes;
  if (m >= 60) {
    h += Math.floor(m / 60);
    m = m % 60;
  }
  h = h % 24;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}
