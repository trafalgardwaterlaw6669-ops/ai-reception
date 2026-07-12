export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  birthDate: string;
  medicalNotes: string;
  preferredLanguage: 'Darija' | 'French' | 'Arabic' | 'English';
  status: 'Active' | 'Inactive';
  createdAt: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  date: string; // ISO String
  durationMinutes: number;
  type: 'Checkup' | 'Cleaning' | 'Root Canal' | 'Consultation' | 'Emergency';
  status: 'Confirmed' | 'Unconfirmed' | 'Cancelled' | 'Completed' | 'No Show';
  notes?: string;
}

export interface CallLog {
  id: string;
  patientId?: string;
  date: string;
  durationSeconds: number;
  summary: string;
  transcript: string;
  status: 'Handled' | 'Missed' | 'Escalated';
  language: string;
}
