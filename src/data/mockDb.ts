import { Patient, Appointment } from '../types';

export const mockPatients: Patient[] = [
  {
    id: 'pat_1',
    firstName: 'Youssef',
    lastName: 'Benali',
    phone: '+212 6 00 11 22 33',
    email: 'youssef.b@example.com',
    birthDate: '1985-04-12',
    medicalNotes: 'Allergic to Penicillin. Mild hypertension.',
    preferredLanguage: 'Darija',
    status: 'Active',
    createdAt: '2023-01-15T10:00:00Z',
  },
  {
    id: 'pat_2',
    firstName: 'Sara',
    lastName: 'Ahmed',
    phone: '+212 6 99 88 77 66',
    email: 'sara.ahmed@example.com',
    birthDate: '1992-08-25',
    medicalNotes: 'No known allergies. History of cavities.',
    preferredLanguage: 'French',
    status: 'Active',
    createdAt: '2023-05-20T14:30:00Z',
  },
  {
    id: 'pat_3',
    firstName: 'Karim',
    lastName: 'Tazi',
    phone: '+212 6 11 22 33 44',
    email: 'karim.t@example.com',
    birthDate: '1978-11-05',
    medicalNotes: 'Diabetic (Type 2). Taking Metformin.',
    preferredLanguage: 'Arabic',
    status: 'Inactive',
    createdAt: '2022-11-10T09:15:00Z',
  },
  {
    id: 'pat_mother',
    firstName: 'Amina',
    lastName: 'Alami',
    phone: '+212 6 55 44 33 22',
    email: 'amina.alami@example.com',
    birthDate: '1988-02-14',
    medicalNotes: 'No allergies. Mother of Khalid Alami (husband) and Kenza Alami (daughter).',
    preferredLanguage: 'English',
    status: 'Active',
    createdAt: '2024-03-10T11:00:00Z',
  },
  {
    id: 'pat_husband',
    firstName: 'Khalid',
    lastName: 'Alami',
    phone: '+212 6 55 44 33 23',
    email: 'khalid.alami@example.com',
    birthDate: '1984-09-18',
    medicalNotes: 'Overdue for checkup by 8 months. Fear of dental needles.',
    preferredLanguage: 'English',
    status: 'Active',
    createdAt: '2024-03-10T11:05:00Z',
  },
  {
    id: 'pat_daughter',
    firstName: 'Kenza',
    lastName: 'Alami',
    phone: '+212 6 55 44 33 24',
    email: 'kenza.alami@example.com',
    birthDate: '2016-07-22',
    medicalNotes: 'Due for periodic cleaning (6-month dental hygiene block). Perfect teeth hygiene.',
    preferredLanguage: 'English',
    status: 'Active',
    createdAt: '2024-03-10T11:10:00Z',
  }
];

export const mockAppointments: Appointment[] = [
  {
    id: 'apt_1',
    patientId: 'pat_1',
    date: '2026-07-01T14:00:00Z',
    durationMinutes: 60,
    type: 'Root Canal',
    status: 'Confirmed',
    notes: 'Second session.'
  },
  {
    id: 'apt_2',
    patientId: 'pat_2',
    date: '2026-07-01T15:30:00Z',
    durationMinutes: 30,
    type: 'Checkup',
    status: 'Unconfirmed',
  },
  {
    id: 'apt_3',
    patientId: 'pat_1',
    date: '2025-12-15T10:00:00Z',
    durationMinutes: 45,
    type: 'Cleaning',
    status: 'Completed',
  }
];

export const mockMessages = [
  {
    id: 'msg_1',
    patientId: 'pat_2',
    timestamp: '2026-06-30T09:15:00Z',
    direction: 'inbound',
    content: 'Bonjour, je voudrais prendre un rendez-vous pour demain si possible.',
    status: 'delivered'
  },
  {
    id: 'msg_2',
    patientId: 'pat_2',
    timestamp: '2026-06-30T09:15:10Z',
    direction: 'outbound',
    content: 'Bonjour ! Je suis l\'assistante virtuelle du Dr. Smith. Je regarde nos disponibilités pour demain. Avez-vous une préférence pour le matin ou l\'après-midi ?',
    status: 'read'
  },
  {
    id: 'msg_3',
    patientId: 'pat_2',
    timestamp: '2026-06-30T09:20:00Z',
    direction: 'inbound',
    content: 'Plutôt l\'après midi vers 15h.',
    status: 'delivered'
  },
  {
    id: 'msg_4',
    patientId: 'pat_2',
    timestamp: '2026-06-30T09:20:15Z',
    direction: 'outbound',
    content: 'Parfait. J\'ai une disponibilité demain à 15h30. Est-ce que cela vous convient pour un contrôle ?',
    status: 'read'
  }
];

export const mockCalls = [
  { id: 'call_1', patientId: 'pat_1', timestamp: '2026-06-30T10:30:00Z', durationSeconds: 145, summary: 'Patient called to confirm tomorrow\'s root canal appointment.', status: 'Handled', language: 'Darija', transcript: '...' },
  { id: 'call_2', patientId: 'pat_3', timestamp: '2026-06-29T16:45:00Z', durationSeconds: 0, summary: 'Missed call. AI sent a WhatsApp follow-up message.', status: 'Missed', language: 'Unknown', transcript: '' },
  { id: 'call_3', patientId: 'pat_2', timestamp: '2026-06-29T11:15:00Z', durationSeconds: 85, summary: 'Patient asked for clinic hours. AI answered.', status: 'Handled', language: 'French', transcript: '...' },
  { id: 'call_4', patientId: 'pat_1', timestamp: '2026-06-28T09:30:00Z', durationSeconds: 210, summary: 'Patient booked a checkup.', status: 'Handled', language: 'Darija', transcript: '...' },
  { id: 'call_5', patientId: 'pat_2', timestamp: '2026-06-27T14:20:00Z', durationSeconds: 0, summary: 'Missed call.', status: 'Missed', language: 'Unknown', transcript: '' },
  { id: 'call_6', patientId: 'pat_3', timestamp: '2026-06-26T10:05:00Z', durationSeconds: 120, summary: 'Asked about prices for whitening.', status: 'Handled', language: 'Arabic', transcript: '...' },
  { id: 'call_7', patientId: 'pat_1', timestamp: '2026-06-25T15:50:00Z', durationSeconds: 60, summary: 'Changed appointment time.', status: 'Handled', language: 'Darija', transcript: '...' },
  { id: 'call_8', patientId: 'pat_2', timestamp: '2026-06-25T09:10:00Z', durationSeconds: 0, summary: 'Missed call.', status: 'Missed', language: 'Unknown', transcript: '' },
];
