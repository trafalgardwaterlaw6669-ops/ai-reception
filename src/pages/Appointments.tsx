import React from "react";
import { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Plus,
  MoreHorizontal,
  MapPin,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Mail,
  Video,
  Trash2,
  CheckCircle2,
  Info
} from 'lucide-react';
import { format, addDays, startOfToday, parseISO, isSameDay } from 'date-fns';
import { mockAppointments, mockPatients } from '@/data/mockDb';
import { cn } from '@/lib/utils';
import { Appointment, Patient } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { useClinics } from '@/context/ClinicContext';
import { toast } from 'sonner';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, addDoc, where, doc, writeBatch, deleteDoc } from 'firebase/firestore';
import { useAuth } from '@/components/AuthProvider';
import { 
  syncAppointmentToGoogleCalendar, 
  deleteAppointmentFromGoogleCalendar, 
  fetchGoogleCalendarBlockedSlots, 
  sendGmailAppointmentConfirmation 
} from '@/lib/gcalSync';

const timeSlots = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
];

export function Appointments() {
  const [selectedDate, setSelectedDate] = useState(startOfToday());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [realAppointments, setRealAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const { currentClinic, clinics } = useClinics();

  const { user, token } = useAuth();
  const isDemo = !token || token.startsWith('demo-');

  const [blockedSlots, setBlockedSlots] = useState<any[]>([]);
  const [isLoadingBlockedSlots, setIsLoadingBlockedSlots] = useState(false);
  const [selectedModalPatientId, setSelectedModalPatientId] = useState('');
  const [isSyncActive, setIsSyncActive] = useState(true);
  const [isSendingGmailActive, setIsSendingGmailActive] = useState(true);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Fetch blocked slots from Google Calendar
  useEffect(() => {
    let isMounted = true;
    const loadBlocked = async () => {
      setIsLoadingBlockedSlots(true);
      try {
        const dateYmd = format(selectedDate, 'yyyy-MM-dd');
        const slots = await fetchGoogleCalendarBlockedSlots(dateYmd, token, isDemo);
        if (isMounted) {
          setBlockedSlots(slots);
        }
      } catch (err) {
        console.error("Failed to load Google Calendar events:", err);
      } finally {
        if (isMounted) {
          setIsLoadingBlockedSlots(false);
        }
      }
    };
    loadBlocked();
    return () => { isMounted = false; };
  }, [selectedDate, token, isDemo]);

  // Load patients from Firestore
  useEffect(() => {
    const q = query(collection(db, 'patients'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Patient[];
      setPatients(fetched);
    });
    return () => unsubscribe();
  }, []);

  // Auto-seed default appointments if collection is empty
  const handleSeedAppointments = async () => {
    try {
      const batch = writeBatch(db);
      const appointmentsCol = collection(db, 'appointments');

      const seedData = [
        {
          patientId: 'pat_1',
          patientName: 'Youssef Benali',
          phone: '+212 6 00 11 22 33',
          patientEmail: 'youssef.benali@gmail.com',
          date: '2026-07-01',
          time: '14:00',
          reason: 'Root Canal',
          status: 'Confirmed',
          notes: 'Second session.',
          clinicId: 'maarif',
          createdAt: new Date().toISOString()
        },
        {
          patientId: 'pat_2',
          patientName: 'Sara Ahmed',
          phone: '+212 6 99 88 77 66',
          patientEmail: 'sara.ahmed@gmail.com',
          date: '2026-07-01',
          time: '15:30',
          reason: 'Checkup',
          status: 'Unconfirmed',
          notes: 'Visite de routine.',
          clinicId: 'agdal',
          createdAt: new Date().toISOString()
        },
        {
          patientId: 'pat_1',
          patientName: 'Youssef Benali',
          phone: '+212 6 00 11 22 33',
          patientEmail: 'youssef.benali@gmail.com',
          date: '2025-12-15',
          time: '10:00',
          reason: 'Cleaning',
          status: 'Completed',
          notes: 'Détartrage périodique.',
          clinicId: 'maarif',
          createdAt: new Date().toISOString()
        }
      ];

      seedData.forEach(apt => {
        const docRef = doc(appointmentsCol);
        batch.set(docRef, apt);
      });

      await batch.commit();
      console.log("Appointments collection auto-seeded!");
    } catch (err) {
      console.error("Error seeding appointments: ", err);
    }
  };

  // Load appointments from Firestore
  useEffect(() => {
    const q = query(collection(db, 'appointments'), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        handleSeedAppointments();
        return;
      }
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRealAppointments(fetched);
    });

    return () => unsubscribe();
  }, []);

  // Map appointments to visual component models
  const combinedAppointments = realAppointments.map(a => {
    const matchingPatient = patients.find(p => p.id === a.patientId || p.phone === a.phone || `${p.firstName} ${p.lastName}` === a.patientName);
    const dateStr = a.date.includes('T') ? a.date : `${a.date}T${a.time || '10:00'}:00Z`;
    return {
      id: a.id,
      patientId: a.patientId || 'unknown',
      date: dateStr,
      type: a.reason || a.type || 'Consultation',
      status: a.status || 'Confirmed',
      durationMinutes: a.durationMinutes || 30,
      notes: a.notes || '',
      clinicId: a.clinicId || 'maarif',
      gcalEventId: a.gcalEventId || null,
      meetLink: a.meetLink || null,
      patient: matchingPatient ? {
        firstName: matchingPatient.firstName,
        lastName: matchingPatient.lastName,
        phone: matchingPatient.phone,
        email: matchingPatient.email
      } : {
        firstName: a.patientName || 'Patient',
        lastName: '',
        phone: a.phone || '',
        email: a.patientEmail || ''
      }
    };
  });

  // Filter daily appointments based on date, then by clinic if a specific one is active
  const dailyAppointments = combinedAppointments
    .filter(apt => isSameDay(parseISO(apt.date), selectedDate) || (apt.date.startsWith(format(selectedDate, 'yyyy-MM-dd'))))
    .filter(apt => {
      if (!currentClinic) return true; // Show all if All Clinics is selected
      return apt.clinicId === currentClinic.id;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Merge with Google Calendar blocked slots
  const mergedSchedule = [
    ...dailyAppointments.map(apt => ({
      ...apt,
      isBlockedSlot: false,
      sortKey: format(parseISO(apt.date), 'HH:mm')
    })),
    ...blockedSlots.map(slot => ({
      id: slot.id,
      patientId: 'blocked',
      date: `${format(selectedDate, 'yyyy-MM-dd')}T${slot.time}:00`,
      type: slot.summary,
      status: 'Blocked',
      durationMinutes: slot.duration,
      notes: '',
      clinicId: 'all',
      isBlockedSlot: true,
      summary: slot.summary,
      sortKey: slot.time,
      gcalEventId: slot.id,
      meetLink: null,
      patient: {
        firstName: slot.summary,
        lastName: '',
        phone: '',
        email: ''
      }
    }))
  ].sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  const previousDay = () => setSelectedDate(addDays(selectedDate, -1));
  const nextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const goToToday = () => setSelectedDate(startOfToday());

  const handleDeleteAppointment = async (id: string, gcalEventId?: string | null) => {
    toast.loading("Annulation du rendez-vous...", { id: 'delete_process' });
    try {
      await deleteDoc(doc(db, 'appointments', id));
      if (gcalEventId) {
        await deleteAppointmentFromGoogleCalendar(gcalEventId, token, isDemo);
      }
      toast.success("Rendez-vous annulé et synchronisé avec Google Calendar !", { id: 'delete_process' });
    } catch (err) {
      console.error(err);
      toast.error("Échec de l'annulation du rendez-vous.", { id: 'delete_process' });
    }
  };

  const handleBook = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const date = formData.get('date') as string;
    const time = formData.get('time') as string;
    const type = formData.get('type') as string;
    const notes = formData.get('notes') as string;
    const patientId = formData.get('patient') as string;
    const formClinicId = formData.get('clinicId') as string || (currentClinic ? currentClinic.id : 'maarif');
    
    let patientName = "";
    let phone = "";
    let email = "";
    
    if (patientId) {
       const p = patients.find(p => p.id === patientId);
       if (p) {
         patientName = `${p.firstName} ${p.lastName}`;
         phone = p.phone;
         email = p.email || "";
       }
    } else {
       patientName = (formData.get('guestName') as string) || "Réservation Invité";
       phone = (formData.get('guestPhone') as string) || "";
       email = (formData.get('guestEmail') as string) || "";
    }

    // Check for collision with Google Calendar blocked slots
    const isOverlapping = blockedSlots.some(slot => slot.time === time);
    if (isOverlapping) {
      const conflictingSlot = blockedSlots.find(s => s.time === time);
      const proceed = window.confirm(
        `Attention: Ce créneau horaire (${time}) entre en conflit avec une indisponibilité Google Calendar : "${conflictingSlot?.summary}". Voulez-vous forcer la réservation ?`
      );
      if (!proceed) return;
    }

    toast.loading("Création du rendez-vous...", { id: 'booking_process' });

    try {
      let gcalEventId = null;
      let meetLink = null;

      // 1. Outbound Sync to Google Calendar
      if (isSyncActive) {
        try {
          const syncRes = await syncAppointmentToGoogleCalendar(
            {
              patientName,
              phone,
              patientEmail: email || undefined,
              date,
              time,
              reason: type,
              notes,
              clinicId: formClinicId
            },
            token,
            isDemo
          );
          gcalEventId = syncRes.gcalEventId;
          meetLink = syncRes.meetLink;
        } catch (syncErr) {
          console.error("Error during Google Calendar Sync:", syncErr);
        }
      }

      // 2. Add to Firestore
      const newAptRef = await addDoc(collection(db, 'appointments'), {
        date,
        time,
        patientName,
        phone,
        patientId: patientId || 'unknown',
        patientEmail: email,
        reason: type,
        notes,
        clinicId: formClinicId,
        status: 'Confirmed',
        gcalEventId,
        meetLink,
        createdAt: new Date().toISOString()
      });

      // 3. Send Gmail confirmation to reduce no-shows
      if (isSendingGmailActive && email) {
        try {
          const activeClinic = clinics.find(c => c.id === formClinicId) || clinics[0];
          await sendGmailAppointmentConfirmation(
            {
              patientName,
              patientEmail: email,
              date,
              time,
              reason: type,
              meetLink,
              clinicName: activeClinic.name,
              clinicPhone: activeClinic.phone
            },
            token,
            isDemo
          );
        } catch (gmailErr) {
          console.error("Error sending Gmail confirmation:", gmailErr);
        }
      }

      setIsAddModalOpen(false); 
      setSelectedModalPatientId('');
      toast.success(
        isSyncActive 
          ? "Rendez-vous réservé, synchronisé sur Google Calendar et e-mail de confirmation envoyé !"
          : "Rendez-vous réservé avec succès !", 
        { id: 'booking_process' }
      );
    } catch(err) {
      console.error(err);
      toast.error("Échec de la réservation du rendez-vous.", { id: 'booking_process' });
    }
  };


  return (
    <div className="flex h-full flex-col">
      <header className="flex flex-none items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Calendrier</h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">Gérez vos rendez-vous cliniques et votre planning d'indisponibilités Google Calendar.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center rounded-md shadow-sm">
            <button
              onClick={previousDay}
              className="flex items-center justify-center rounded-l-md border border-slate-300 bg-white py-2 pl-3 pr-4 text-slate-500 hover:bg-slate-50 focus:relative md:w-9 md:px-2 cursor-pointer"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              onClick={goToToday}
              className="hidden border-y border-slate-300 bg-white px-3.5 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-50 focus:relative md:block cursor-pointer"
            >
              Aujourd'hui
            </button>
            <button
              onClick={nextDay}
              className="flex items-center justify-center rounded-r-md border border-slate-300 bg-white py-2 pl-4 pr-3 text-slate-500 hover:bg-slate-50 focus:relative md:w-9 md:px-2 cursor-pointer"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="hidden md:flex md:items-center">
            <div className="h-6 w-px bg-slate-300 mx-2" aria-hidden="true" />
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-blue-500 cursor-pointer active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4" />
              Nouveau Rendez-vous
            </button>
          </div>
        </div>
      </header>

      {/* Google Calendar Real-Time Sync Status Banner */}
      <div className="mt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-2xl border bg-gradient-to-r from-blue-50/50 to-indigo-50/30 border-blue-100 shadow-sm text-left">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-sm shrink-0">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">Moteur de Synchronisation Google Calendar</h2>
              {isDemo ? (
                <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-inset ring-amber-600/20">
                  Mode Démo
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700 ring-1 ring-inset ring-green-600/20 gap-1">
                  <ShieldCheck className="h-3 w-3" /> Connecté & Synchro Live
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {isDemo 
                ? "Connecté en session de démonstration. Les rendez-vous créés simuleront l'exportation et les rappels e-mail de no-shows."
                : `Synchronisé en temps réel sur ${user?.email || 'votre compte professionnel'}. Les indisponibilités du calendrier bloquent automatiquement le scheduler.`
              }
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl px-3 py-1.5 cursor-pointer shadow-sm select-none">
            <input 
              type="checkbox" 
              checked={isSyncActive} 
              onChange={(e) => setIsSyncActive(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
            />
            Exporter sur GCal
          </label>
          <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl px-3 py-1.5 cursor-pointer shadow-sm select-none">
            <input 
              type="checkbox" 
              checked={isSendingGmailActive} 
              onChange={(e) => setIsSendingGmailActive(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
            />
            Rappels No-Show Gmail
          </label>
          <button 
            onClick={async () => {
              const dateYmd = format(selectedDate, 'yyyy-MM-dd');
              toast.promise(
                fetchGoogleCalendarBlockedSlots(dateYmd, token, isDemo).then(slots => {
                  setBlockedSlots(slots);
                  return slots.length;
                }),
                {
                  loading: 'Interrogation de l\'API Google Calendar...',
                  success: (count) => `Planning actualisé ! ${count} créneaux d'indisponibilité synchronisés.`,
                  error: 'Erreur d\'interrogation API.'
                }
              );
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3 py-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Vérifier Dispos
          </button>
        </div>
      </div>

      {/* Add Appointment Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Nouveau Rendez-vous">
        <form className="space-y-4 text-left" onSubmit={handleBook}>
          <div>
            <label htmlFor="clinicId" className="block text-sm font-medium leading-6 text-slate-900">Emplacement du Cabinet</label>
            <div className="mt-2">
              <select 
                id="clinicId" 
                name="clinicId" 
                defaultValue={currentClinic ? currentClinic.id : 'maarif'} 
                className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              >
                {clinics.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.city})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="patient" className="block text-sm font-medium leading-6 text-slate-900">Patient CRM</label>
            <div className="mt-2">
              <select 
                id="patient" 
                name="patient" 
                value={selectedModalPatientId}
                onChange={(e) => setSelectedModalPatientId(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              >
                <option value="">-- Nouveau patient / Saisie manuelle --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                ))}
              </select>
            </div>
          </div>

          {selectedModalPatientId === '' && (
            <div className="space-y-4 p-4 rounded-xl border border-slate-100 bg-slate-50/50">
              <h4 className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">Informations du Patient Invité</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="guestName" className="block text-xs font-semibold text-slate-700">Nom Complet</label>
                  <input 
                    type="text" 
                    name="guestName" 
                    id="guestName" 
                    placeholder="ex: Rachid El Amrani"
                    required={selectedModalPatientId === ''}
                    className="mt-1 block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 text-xs"
                  />
                </div>
                <div>
                  <label htmlFor="guestPhone" className="block text-xs font-semibold text-slate-700">Téléphone</label>
                  <input 
                    type="text" 
                    name="guestPhone" 
                    id="guestPhone" 
                    placeholder="ex: +212 600-000000"
                    required={selectedModalPatientId === ''}
                    className="mt-1 block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 text-xs"
                  />
                </div>
                <div>
                  <label htmlFor="guestEmail" className="block text-xs font-semibold text-slate-700">Email (No-Show Rappels)</label>
                  <input 
                    type="email" 
                    name="guestEmail" 
                    id="guestEmail" 
                    placeholder="ex: rachid@gmail.com"
                    required={selectedModalPatientId === ''}
                    className="mt-1 block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 text-xs"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="date" className="block text-sm font-medium leading-6 text-slate-900">Date</label>
              <div className="mt-2">
                <input type="date" name="date" id="date" defaultValue={format(selectedDate, 'yyyy-MM-dd')} className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6" />
              </div>
            </div>
            <div>
              <label htmlFor="time" className="block text-sm font-medium leading-6 text-slate-900">Heure</label>
              <div className="mt-2">
                <select id="time" name="time" className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6">
                  {timeSlots.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div>
            <label htmlFor="type" className="block text-sm font-medium leading-6 text-slate-900">Type de consultation</label>
            <div className="mt-2">
              <select id="type" name="type" className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6">
                <option>Contrôle</option>
                <option>Détartrage</option>
                <option>Traitement de canal</option>
                <option>Consultation générale</option>
                <option>Urgence</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium leading-6 text-slate-900">Notes (Optionnel)</label>
            <div className="mt-2">
              <textarea id="notes" name="notes" rows={2} className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6" />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-slate-200 mt-6">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">Annuler</button>
            <button type="submit" className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">Réserver le Rendez-vous</button>
          </div>
        </form>
      </Modal>

      <div className="mt-6 flex flex-auto overflow-hidden bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="flex w-full flex-col">
          {/* Day Header */}
          <div className="grid grid-cols-7 gap-px border-b border-slate-200 bg-slate-50 text-center text-sm font-semibold leading-6 text-slate-700">
            <div className="flex flex-col py-3">
              <span className="text-slate-500 capitalize">{format(selectedDate, 'EEEE')}</span>
              <span className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white mx-auto font-bold">
                {format(selectedDate, 'd')}
              </span>
            </div>
            {/* Keeping it simple for day view focus, but structure allows week view expansion */}
            <div className="col-span-6 bg-white flex items-center px-6">
              <div className="text-left">
                <p className="text-sm font-bold text-slate-800">Gestion active des horaires par l'IA & Google Workspace</p>
                <p className="text-xs text-slate-500 font-medium">Les créneaux marqués comme occupés sur votre Google Calendar personnel bloquent automatiquement les prises de rendez-vous cliniques.</p>
              </div>
            </div>
          </div>

          <div className="flex flex-auto overflow-y-auto">
            <div className="w-full max-w-3xl mx-auto py-6 px-4 sm:px-6">
              {isLoadingBlockedSlots ? (
                <div className="text-center py-20">
                  <RefreshCw className="mx-auto h-8 w-8 text-blue-600 animate-spin" />
                  <p className="mt-2 text-sm text-slate-500 font-medium">Récupération du planning Google Calendar...</p>
                </div>
              ) : mergedSchedule.length > 0 ? (
                <div className="space-y-4">
                  {mergedSchedule.map((item) => {
                    if (item.isBlockedSlot) {
                      // Render a Google Calendar blocked block
                      return (
                        <div 
                          key={item.id}
                          className="relative flex flex-col sm:flex-row gap-4 p-5 rounded-2xl border bg-slate-50/70 border-rose-100 shadow-sm transition-all text-left"
                        >
                          <div className="flex sm:flex-col items-center sm:items-start justify-between sm:w-32 shrink-0 border-b sm:border-b-0 sm:border-r border-rose-100 pb-4 sm:pb-0 sm:pr-4">
                            <div className="text-lg font-extrabold text-rose-600">
                              {item.sortKey}
                            </div>
                            <div className="text-xs font-bold text-slate-500 flex items-center gap-1 mt-1">
                              <Clock className="h-3.5 w-3.5" /> {item.durationMinutes} min
                            </div>
                          </div>
                          <div className="flex-1 flex items-center justify-between">
                            <div>
                              <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                                <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 ring-1 ring-inset ring-rose-600/20 gap-1">
                                  <AlertTriangle className="h-3 w-3" /> Bloqué (Google Calendar Sync)
                                </span>
                              </h3>
                              <p className="text-xs text-slate-500 font-bold mt-1.5">{item.summary}</p>
                            </div>
                            <div className="text-rose-400 p-2">
                              <Info className="h-5 w-5" />
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Render a standard clinic appointment
                    const isSynced = !!item.gcalEventId;
                    return (
                      <div 
                        key={item.id}
                        className={cn(
                          "relative flex flex-col sm:flex-row gap-4 p-5 rounded-2xl border shadow-sm transition-all hover:shadow-md text-left",
                          item.status === 'Confirmed' ? 'bg-white border-slate-200' :
                          item.status === 'Unconfirmed' ? 'bg-yellow-50/50 border-yellow-200' :
                          'bg-slate-50 border-slate-200'
                        )}
                      >
                        <div className="flex sm:flex-col items-center sm:items-start justify-between sm:w-32 shrink-0 border-b sm:border-b-0 sm:border-r border-slate-100 pb-4 sm:pb-0 sm:pr-4">
                          <div className="text-lg font-bold text-slate-900">
                            {item.sortKey}
                          </div>
                          <div className="text-sm font-medium text-slate-500 flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3" /> {item.durationMinutes} min
                          </div>
                        </div>
                        
                        <div className="flex-1 flex flex-col justify-center">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-lg font-semibold text-slate-900 flex flex-wrap items-center gap-2">
                                {item.patient?.firstName} {item.patient?.lastName}
                                <span className={cn(
                                  "text-xs px-2 py-0.5 rounded-full font-medium ring-1 ring-inset",
                                  item.status === 'Confirmed' ? "bg-green-50 text-green-700 ring-green-600/20" :
                                  "bg-yellow-50 text-yellow-700 ring-yellow-600/20"
                                )}>
                                  {item.status === 'Confirmed' ? 'Confirmé' : 'Non-confirmé'}
                                </span>
                                
                                {isSynced && (
                                  <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 ring-1 ring-inset ring-blue-600/20 gap-1" title="Synchronisé avec Google Calendar">
                                    <ShieldCheck className="h-3 w-3" /> GCal Synced
                                  </span>
                                )}

                                {item.patient?.email && (
                                  <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 ring-1 ring-inset ring-indigo-600/20 gap-1" title="Notification Gmail confirmée">
                                    <Mail className="h-3 w-3" /> Gmail
                                  </span>
                                )}
                                
                                {item.clinicId && (
                                  <span className={cn(
                                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border",
                                    item.clinicId === 'maarif' ? "bg-blue-50 text-blue-700 border-blue-200" :
                                    item.clinicId === 'agdal' ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                    "bg-pink-50 text-pink-700 border-pink-200"
                                  )}>
                                    <MapPin className="h-2.5 w-2.5" />
                                    {clinics.find(c => c.id === item.clinicId)?.city || 'Maârif'}
                                  </span>
                                )}
                              </h3>
                              <p className="text-sm text-slate-600 font-medium mt-1">{item.type}</p>
                            </div>

                            <div className="relative">
                              <button 
                                onClick={() => setActiveMenuId(activeMenuId === item.id ? null : item.id)}
                                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              >
                                <MoreHorizontal className="h-5 w-5" />
                              </button>
                              
                              {activeMenuId === item.id && (
                                <div className="absolute right-0 mt-1 w-48 rounded-xl bg-white shadow-lg ring-1 ring-black/5 z-20 p-1">
                                  {item.meetLink && (
                                    <a 
                                      href={item.meetLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                                      onClick={() => setActiveMenuId(null)}
                                    >
                                      <Video className="h-3.5 w-3.5" />
                                      Rejoindre Meet
                                    </a>
                                  )}
                                  <button 
                                    onClick={() => {
                                      handleDeleteAppointment(item.id, item.gcalEventId);
                                      setActiveMenuId(null);
                                    }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left cursor-pointer"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Annuler RDV
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {(item.notes || item.patient?.medicalNotes) && (
                            <div className="mt-3 bg-slate-50 rounded-md p-3 text-sm text-slate-600 border border-slate-100">
                              {item.notes && <p><span className="font-medium text-slate-700">Notes de RDV :</span> {item.notes}</p>}
                              {item.patient?.medicalNotes && <p className="mt-1"><span className="font-medium text-slate-700">Dossier médical :</span> {item.patient.medicalNotes}</p>}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-20">
                  <CalendarIcon className="mx-auto h-12 w-12 text-slate-300" />
                  <h3 className="mt-2 text-sm font-semibold text-slate-900">Aucun rendez-vous</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Votre emploi du temps est libre pour le {format(selectedDate, 'd MMMM yyyy')}.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
