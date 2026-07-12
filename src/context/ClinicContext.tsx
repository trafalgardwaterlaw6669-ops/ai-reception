import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { db } from '@/lib/firebase';
import { collection, writeBatch, doc, query, where, getDocs } from 'firebase/firestore';

export interface Clinic {
  id: string;
  name: string;
  city: string;
  address: string;
  phone: string;
  color: string;
  activePatients: number;
  monthlyRevenue: number;
  staffCount: number;
  aiVoicemailBypassCount: number;
}

export interface DemoSettings {
  dentistName: string;
  clinicName: string;
  phoneNumber: string;
  city: string;
}

interface ClinicContextType {
  currentClinic: Clinic | null; // null means 'All Clinics (Unified)'
  clinics: Clinic[];
  isSyncing: boolean;
  lastSynced: string;
  setCurrentClinicById: (id: string) => void;
  triggerGlobalSync: () => Promise<void>;
  conflictAlertsCount: number;
  syncLogs: Array<{ time: string; message: string; clinic: string; type: 'info' | 'success' | 'alert' }>;
  demoSettings: DemoSettings;
  updateDemoSettings: (settings: Partial<DemoSettings>) => void;
  isDemoModeActive: boolean;
  toggleDemoMode: (active: boolean) => Promise<void>;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export function ClinicProvider({ children }: { children: React.ReactNode }) {
  const [currentClinicId, setCurrentClinicId] = useState<string>('all');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<string>(new Date().toLocaleTimeString());
  const [conflictAlertsCount, setConflictAlertsCount] = useState<number>(0);
  const [syncLogs, setSyncLogs] = useState<Array<{ time: string; message: string; clinic: string; type: 'info' | 'success' | 'alert' }>>([
    { time: '05:30:12', message: 'Maârif schedule scanned. Cross-clinic drift: 0ms.', clinic: 'Casablanca', type: 'success' },
    { time: '05:30:15', message: 'Agdal calendar indexed. 3 duplicate records synchronized.', clinic: 'Rabat', type: 'success' },
    { time: '05:31:00', message: 'Guéliz active logs pulled. Zero scheduling conflicts.', clinic: 'Marrakech', type: 'info' },
  ]);

  const [demoSettings, setDemoSettingsState] = useState<DemoSettings>(() => {
    const saved = localStorage.getItem('aura_dental_demo_settings');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return {
      dentistName: 'Dr. El Alami',
      clinicName: 'AuraDental Clinique',
      phoneNumber: '+212 5 22 99 88 77',
      city: 'Casablanca'
    };
  });

  const updateDemoSettings = (newSettings: Partial<DemoSettings>) => {
    setDemoSettingsState(prev => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('aura_dental_demo_settings', JSON.stringify(updated));
      return updated;
    });
  };

  const clinics: Clinic[] = [
    {
      id: 'maarif',
      name: demoSettings.clinicName,
      city: demoSettings.city,
      address: `Boulevard El Massira Al Khadra, Maârif, ${demoSettings.city}`,
      phone: demoSettings.phoneNumber,
      color: '#2563eb', // Blue-600
      activePatients: 1420,
      monthlyRevenue: 48000,
      staffCount: 6,
      aiVoicemailBypassCount: 142
    },
    {
      id: 'agdal',
      name: 'Agdal Family Dental',
      city: 'Rabat',
      address: 'Avenue de France, Agdal, Rabat',
      phone: '+212 5 37 77 66 55',
      color: '#10b981', // Emerald-500
      activePatients: 980,
      monthlyRevenue: 32000,
      staffCount: 4,
      aiVoicemailBypassCount: 94
    },
    {
      id: 'gueliz',
      name: 'Guéliz Aesthetic Dental',
      city: 'Marrakech',
      address: 'Avenue Mohammed V, Guéliz, Marrakech',
      phone: '+212 5 24 44 33 22',
      color: '#ec4899', // Pink-500
      activePatients: 740,
      monthlyRevenue: 25000,
      staffCount: 3,
      aiVoicemailBypassCount: 58
    }
  ];

  const currentClinic = clinics.find(c => c.id === currentClinicId) || null;

  const setCurrentClinicById = (id: string) => {
    setCurrentClinicId(id);
    const selectedName = id === 'all' ? 'All Clinics (Unified)' : clinics.find(c => c.id === id)?.name;
    toast.success(`Switched dashboard scope to: ${selectedName}`);
  };

  const triggerGlobalSync = async () => {
    setIsSyncing(true);
    toast.loading("Initiating master sync across Casablanca, Rabat & Marrakech...", { id: 'globalsync' });

    // Simulate cross-clinic real-time data ingestion and scheduling reconciliation
    await new Promise(resolve => setTimeout(resolve, 1800));

    setIsSyncing(false);
    const nowStr = new Date().toLocaleTimeString();
    setLastSynced(nowStr);

    setSyncLogs(prev => [
      {
        time: nowStr,
        message: 'Synchronized patient indexes, active voicemails, and WhatsApp confirmation bots across all 3 nodes.',
        clinic: 'System Master',
        type: 'success'
      },
      ...prev
    ]);

    toast.success("All 3 clinics fully synchronized with central AI model!", { id: 'globalsync' });
  };

  // Auto-synchronize simulation every 45 seconds to keep the state looking fresh and alive
  useEffect(() => {
    const interval = setInterval(() => {
      const nowStr = new Date().toLocaleTimeString();
      setLastSynced(nowStr);
      setSyncLogs(prev => [
        {
          time: nowStr,
          message: 'Silent background sync: resolved doctor travel blocks & verified WhatsApp priority list.',
          clinic: 'Universal AI Sync',
          type: 'info'
        },
        ...prev.slice(0, 15) // Keep last 15 logs
      ]);
    }, 45000);

    return () => clearInterval(interval);
  }, []);

  // === DEMO MODE ENGINE ===
  const [isDemoModeActive, setIsDemoModeActive] = useState<boolean>(() => {
    return localStorage.getItem('aura_dental_demo_mode_active') === 'true';
  });

  const demoPatientsList = [
    {
      id: 'demo_pat_1',
      firstName: 'Fatiha',
      lastName: 'El Mansouri',
      phone: '+212 6 61 23 45 67',
      email: 'fatiha.mansouri@example.com',
      birthDate: '1981-04-12',
      preferredLanguage: 'Darija',
      status: 'Active',
      medicalNotes: 'Acouphènes, allergie à la codéine. Historique de gingivite chronique.',
      createdAt: new Date().toISOString(),
      isDemo: true
    },
    {
      id: 'demo_pat_2',
      firstName: 'Mohamed',
      lastName: 'Amraoui',
      phone: '+212 6 62 34 56 78',
      email: 'm.amraoui@example.com',
      birthDate: '1994-08-25',
      preferredLanguage: 'Darija',
      status: 'Active',
      medicalNotes: 'Patient extrêmement anxieux. Préfère les séances courtes. Hypertension légère.',
      createdAt: new Date().toISOString(),
      isDemo: true
    },
    {
      id: 'demo_pat_3',
      firstName: 'Souad',
      lastName: 'Benchakroun',
      phone: '+212 6 63 45 67 89',
      email: 'souad.b@example.com',
      birthDate: '1998-11-05',
      preferredLanguage: 'French',
      status: 'Active',
      medicalNotes: 'Porteuse d\'un appareil orthodontique (suivi régulier). Excellente hygiène.',
      createdAt: new Date().toISOString(),
      isDemo: true
    },
    {
      id: 'demo_pat_4',
      firstName: 'Adil',
      lastName: 'Jabri',
      phone: '+212 6 64 56 78 90',
      email: 'adil.jabri@example.com',
      birthDate: '1976-02-14',
      preferredLanguage: 'Arabic',
      status: 'Active',
      medicalNotes: 'Diabétique de type 1. Risque de récession gingivale. Sensibilité accrue.',
      createdAt: new Date().toISOString(),
      isDemo: true
    },
    {
      id: 'demo_pat_5',
      firstName: 'Yasmina',
      lastName: 'Tazi',
      phone: '+212 6 65 67 89 01',
      email: 'yasmina.t@example.com',
      birthDate: '2007-06-18',
      preferredLanguage: 'French',
      status: 'Active',
      medicalNotes: 'Demande de blanchiment dentaire. Pas d\'allergies connues.',
      createdAt: new Date().toISOString(),
      isDemo: true
    },
    {
      id: 'demo_pat_6',
      firstName: 'Tariq',
      lastName: 'Sekkat',
      phone: '+212 6 66 78 90 12',
      email: 't.sekkat@example.com',
      birthDate: '1988-09-30',
      preferredLanguage: 'English',
      status: 'Active',
      medicalNotes: 'Expatrié anglophone. Demande des devis détaillés pour sa mutuelle internationale.',
      createdAt: new Date().toISOString(),
      isDemo: true
    },
    {
      id: 'demo_pat_7',
      firstName: 'Meriem',
      lastName: 'Chraibi',
      phone: '+212 6 67 89 01 23',
      email: 'meriem.chraibi@example.com',
      birthDate: '1991-05-15',
      preferredLanguage: 'French',
      status: 'Active',
      medicalNotes: 'Enceinte (3ème trimestre). Éviter les anesthésies fortes et radiographies.',
      createdAt: new Date().toISOString(),
      isDemo: true
    }
  ];

  const getDemoAppointments = (today: Date) => {
    const formatYMD = (d: Date) => d.toISOString().split('T')[0];
    const todayStr = formatYMD(today);
    const yesterdayStr = formatYMD(new Date(today.getTime() - 86400000));
    const tomorrowStr = formatYMD(new Date(today.getTime() + 86400000));

    return [
      {
        patientId: 'demo_pat_1',
        patientName: 'Fatiha El Mansouri',
        phone: '+212 6 61 23 45 67',
        date: todayStr,
        time: '09:00',
        reason: 'Root Canal',
        status: 'Confirmed',
        notes: 'Dernière séance d\'obturation.',
        clinicId: 'maarif',
        createdAt: new Date().toISOString(),
        isDemo: true
      },
      {
        patientId: 'demo_pat_2',
        patientName: 'Mohamed Amraoui',
        phone: '+212 6 62 34 56 78',
        date: todayStr,
        time: '10:30',
        reason: 'Cleaning',
        status: 'Unconfirmed',
        notes: 'Détartrage & Polissage (patient anxieux).',
        clinicId: 'maarif',
        createdAt: new Date().toISOString(),
        isDemo: true
      },
      {
        patientId: 'demo_pat_3',
        patientName: 'Souad Benchakroun',
        phone: '+212 6 63 45 67 89',
        date: todayStr,
        time: '14:00',
        reason: 'Orthodontic check',
        status: 'Confirmed',
        notes: 'Resserrement de l\'arc supérieur.',
        clinicId: 'agdal',
        createdAt: new Date().toISOString(),
        isDemo: true
      },
      {
        patientId: 'demo_pat_5',
        patientName: 'Yasmina Tazi',
        phone: '+212 6 65 67 89 01',
        date: todayStr,
        time: '16:00',
        reason: 'Whitening',
        status: 'Confirmed',
        notes: 'Première séance de blanchiment au laser.',
        clinicId: 'gueliz',
        createdAt: new Date().toISOString(),
        isDemo: true
      },
      {
        patientId: 'demo_pat_4',
        patientName: 'Adil Jabri',
        phone: '+212 6 64 56 78 90',
        date: yesterdayStr,
        time: '11:00',
        reason: 'Checkup',
        status: 'Completed',
        notes: 'Bilan complet, recommandation de parodontologie.',
        clinicId: 'maarif',
        createdAt: new Date().toISOString(),
        isDemo: true
      },
      {
        patientId: 'demo_pat_6',
        patientName: 'Tariq Sekkat',
        phone: '+212 6 66 78 90 12',
        date: tomorrowStr,
        time: '10:00',
        reason: 'Crown fitting',
        status: 'Confirmed',
        notes: 'Pose de couronne céramo-céramique définitive.',
        clinicId: 'gueliz',
        createdAt: new Date().toISOString(),
        isDemo: true
      },
      {
        patientId: 'demo_pat_7',
        patientName: 'Meriem Chraibi',
        phone: '+212 6 67 89 01 23',
        date: tomorrowStr,
        time: '13:00',
        reason: 'Checkup',
        status: 'Unconfirmed',
        notes: 'Visite de routine du deuxième trimestre.',
        clinicId: 'maarif',
        createdAt: new Date().toISOString(),
        isDemo: true
      }
    ];
  };

  const getDemoCallLogs = (today: Date) => {
    const getIsoTime = (offsetMs: number) => new Date(today.getTime() - offsetMs).toISOString();

    return [
      {
        patientId: 'demo_pat_1',
        date: getIsoTime(1000 * 60 * 15),
        durationSeconds: 180,
        summary: 'La patiente a appelé pour confirmer son rdv d\'obturation à 09h00 et poser des questions sur les douleurs post-opératoires.',
        status: 'Handled',
        language: 'Darija',
        transcript: 'IA: Ahlan bikom f clinic AuraDental dial Dr. El Alami, kifach nqdar n3awnk?\nPatient: Salam a khti, bghit n2akked lmawid diali dial lyoum m3a 9h dial l2obtobar.\nIA: Ahlan Lalla Fatiha. Oui, mrahba bik, lmawid dyalk m2akked m3a 09h00.\nPatient: Wakha a khti, chokran bezzaf. O bghit nsewwel s3a d l2alam b3d l3amal?\nIA: L2alam ghadi ikoun khfif o nqdro nktbo lik msekkin khfif bhal Paracétamol ssi drouri.\nPatient: Safi lah ihafdek, nchofkom m3a 9h.\nIA: Mrahba bik Lalla Fatiha, nhark mbarek!',
        triageCategory: 'Routine',
        triageReason: "Confirmation de rendez-vous de traitement de canal et questions sur la gestion normale de la douleur post-opératoire.",
        triageAnalyzedAt: new Date().toISOString(),
        isDemo: true
      },
      {
        patientId: 'demo_pat_2',
        date: getIsoTime(1000 * 60 * 45),
        durationSeconds: 110,
        summary: 'Le patient s\'est plaint d\'une rage de dents intense. L\'IA lui a proposé un créneau d\'urgence à 10h30.',
        status: 'Handled',
        language: 'Darija',
        transcript: 'IA: Ahlan bik f AuraDental, mrahba bik.\nPatient: Salam, 3ndi wahed l2alam f darsat l3qal sbe9 lia bzzaf, dwayan makatdir walo.\nIA: Salam si Mohamed. Kanfhm l2alam dyalk. 3ndi wahed créneau d\'urgence lyoum m3a 10h30, wach mnasb lik?\nPatient: Ah wakha mzyan, ghadi nji tma f Maârif f 10h30 dghia.\nIA: Safi m2akked, hna ghadi ntsnnawk f 10h30 f central Maârif. Allah ijib chifa!\nPatient: Chokran bezzaf a khti.',
        triageCategory: 'Urgent/Emergency',
        triageReason: "Rage de dents aiguë et intense au niveau de la molaire, résistante aux analgésiques standards.",
        triageAnalyzedAt: new Date().toISOString(),
        isDemo: true
      },
      {
        patientId: 'demo_pat_3',
        date: getIsoTime(1000 * 60 * 120),
        durationSeconds: 135,
        summary: 'La patiente Souad voulait décaler son rendez-vous d\'orthodontie de 14h à 15h. L\'IA a vérifié l\'agenda et l\'a reprogrammé.',
        status: 'Handled',
        language: 'Français',
        transcript: 'IA: Bonjour, bienvenue au cabinet AuraDental.\nPatient: Bonjour, j\'ai un rendez-vous d\'orthodontie à 14h today mais j\'ai un imprévu professionnel, est-il possible de décaler à 15h ?\nIA: Laissez-moi vérifier... À 15h le Docteur est complet, mais je peux vous proposer à 15h30 ou 16h30.\nPatient: 15h30 c\'est parfait pour moi !\nIA: Très bien, j\'ai modifié votre rendez-vous pour aujourd\'hui à 15h30 au cabinet d\'Agdal. Vous allez recevoir un SMS.\nPatient: Merci infiniment pour votre réactivité !',
        triageCategory: 'Routine',
        triageReason: "Demande de reprogrammation non urgente d'un ajustement orthodontique de routine.",
        triageAnalyzedAt: new Date().toISOString(),
        isDemo: true
      },
      {
        patientId: 'demo_pat_6',
        date: getIsoTime(1000 * 60 * 60 * 24),
        durationSeconds: 190,
        summary: 'The patient Tariq Sekkat (an English-speaking expat) requested a detailed cost estimate for international insurance approval.',
        status: 'Handled',
        language: 'English',
        transcript: 'IA: Hello and welcome to AuraDental Clinic. How can I help you today?\nPatient: Hi! I have a crown fitting scheduled for tomorrow, but my international insurance provider requires a detailed cost breakdown in English beforehand. Can you send me that?\nIA: Hello Mr. Sekkat! Absolutely. I will generate the detailed estimate in English and email it to you right away at t.sekkat@example.com.\nPatient: That is fantastic! You saved me a lot of hassle. Thank you so much.\nIA: You are very welcome! We look forward to seeing you tomorrow at 10:00 AM.',
        triageCategory: 'General Inquiry',
        triageReason: "Demande de devis financier et de documentation administrative pour le remboursement d'une mutuelle.",
        triageAnalyzedAt: new Date().toISOString(),
        isDemo: true
      },
      {
        patientId: 'demo_pat_4',
        date: getIsoTime(1000 * 60 * 60 * 30),
        durationSeconds: 0,
        summary: 'Appel manqué. L\'IA a envoyé une relance WhatsApp pour proposer une consultation d\'urgence.',
        status: 'Missed',
        language: 'Inconnu',
        triageCategory: 'Routine',
        triageReason: "Relance suite à un appel manqué pour planifier un examen bucco-dentaire général.",
        triageAnalyzedAt: new Date().toISOString(),
        isDemo: true
      }
    ];
  };

  const getDemoMessages = (today: Date) => {
    const getIsoTime = (offsetMs: number) => new Date(today.getTime() - offsetMs).toISOString();

    return [
      {
        patientId: 'demo_pat_1',
        content: 'Salam alaykum, bghit n2akked lmawid dyali dial lyoum m3a 9h s\'il vous plaît.',
        direction: 'inbound',
        status: 'read',
        timestamp: getIsoTime(1000 * 60 * 30),
        triageCategory: 'Routine',
        triageReason: "Confirmation de rendez-vous régulier pour des soins d'obturation.",
        triageAnalyzedAt: new Date().toISOString(),
        isDemo: true
      },
      {
        patientId: 'demo_pat_1',
        content: 'Wa alaykum salam Lalla Fatiha. Oui, mrahba bik! Le rendez-vous pour votre traitement de canal est bien confirmé pour ce matin à 09h00. Nous vous attendons au cabinet de Maârif.',
        direction: 'outbound',
        status: 'read',
        timestamp: getIsoTime(1000 * 60 * 28),
        isDemo: true
      },
      {
        patientId: 'demo_pat_1',
        content: 'Chokran bezzaf a khti, rani f triq daba.',
        direction: 'inbound',
        status: 'read',
        timestamp: getIsoTime(1000 * 60 * 20),
        triageCategory: 'Routine',
        triageReason: "Le patient signale qu'il est en route vers le cabinet pour son rendez-vous.",
        triageAnalyzedAt: new Date().toISOString(),
        isDemo: true
      },
      {
        patientId: 'demo_pat_2',
        content: 'Bonjour, j\'ai une rage de dents insupportable depuis hier soir, vous avez de la place aujourd\'hui ?',
        direction: 'inbound',
        status: 'read',
        timestamp: getIsoTime(1000 * 60 * 60),
        triageCategory: 'Urgent/Emergency',
        triageReason: "Le patient signale une douleur aiguë intolérable (rage de dents) apparue la veille.",
        triageAnalyzedAt: new Date().toISOString(),
        isDemo: true
      },
      {
        patientId: 'demo_pat_2',
        content: 'Bonjour Monsieur Amraoui. Je comprends votre situation, c\'est douloureux. J\'ai un créneau d\'urgence disponible aujourd\'hui à 10h30. Est-ce que cela vous conviendrait ?',
        direction: 'outbound',
        status: 'read',
        timestamp: getIsoTime(1000 * 60 * 58),
        isDemo: true
      },
      {
        patientId: 'demo_pat_2',
        content: 'Oui c\'est parfait, merci beaucoup. Je viens tout de suite.',
        direction: 'inbound',
        status: 'read',
        timestamp: getIsoTime(1000 * 60 * 50),
        triageCategory: 'Urgent/Emergency',
        triageReason: "Le patient confirme qu'il se déplace immédiatement pour son créneau d'urgence.",
        triageAnalyzedAt: new Date().toISOString(),
        isDemo: true
      },
      {
        patientId: 'demo_pat_2',
        content: 'C\'est noté ! Le Docteur vous recevra dès votre arrivée. Bon courage.',
        direction: 'outbound',
        status: 'read',
        timestamp: getIsoTime(1000 * 60 * 48),
        isDemo: true
      }
    ];
  };

  const clearDemoData = async () => {
    const collections = ['patients', 'appointments', 'callLogs', 'messages'];
    for (const colName of collections) {
      try {
        const colRef = collection(db, colName);
        const q = query(colRef, where('isDemo', '==', true));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const batch = writeBatch(db);
          snapshot.docs.forEach(docSnap => {
            batch.delete(docSnap.ref);
          });
          await batch.commit();
        }
      } catch (e) {
        console.error(`Error clearing collection ${colName}:`, e);
      }
    }
  };

  const toggleDemoMode = async (active: boolean) => {
    setIsDemoModeActive(active);
    localStorage.setItem('aura_dental_demo_mode_active', active ? 'true' : 'false');

    if (active) {
      const toastId = toast.loading("Génération de l'environnement de démo...");
      try {
        // 1. Clear any stale demo data first
        await clearDemoData();

        // 2. Insert new demo data in batches
        const batch = writeBatch(db);
        const now = new Date();

        // Seed Patients
        const patientsCol = collection(db, 'patients');
        demoPatientsList.forEach(p => {
          batch.set(doc(patientsCol, p.id), p);
        });

        // Seed Appointments
        const appointmentsCol = collection(db, 'appointments');
        getDemoAppointments(now).forEach(apt => {
          batch.set(doc(appointmentsCol), apt);
        });

        // Seed Call Logs
        const callsCol = collection(db, 'callLogs');
        getDemoCallLogs(now).forEach(call => {
          batch.set(doc(callsCol), call);
        });

        // Seed Messages
        const messagesCol = collection(db, 'messages');
        getDemoMessages(now).forEach(msg => {
          batch.set(doc(messagesCol), msg);
        });

        await batch.commit();
        toast.success("Mode Démo activé ! Votre cabinet virtuel a été peuplé de données ultra-réalistes.", { id: toastId });
      } catch (err) {
        console.error("Error activating demo mode:", err);
        toast.error("Échec du peuplement des données du Mode Démo.", { id: toastId });
      }
    } else {
      const toastId = toast.loading("Nettoyage des données du Mode Démo...");
      try {
        await clearDemoData();
        toast.success("Mode Démo désactivé ! Les données de démonstration ont été nettoyées.", { id: toastId });
      } catch (err) {
        console.error("Error clearing demo mode:", err);
        toast.error("Échec du nettoyage des données de démonstration.", { id: toastId });
      }
    }
  };

  return (
    <ClinicContext.Provider value={{
      currentClinic,
      clinics,
      isSyncing,
      lastSynced,
      setCurrentClinicById,
      triggerGlobalSync,
      conflictAlertsCount,
      syncLogs,
      demoSettings,
      updateDemoSettings,
      isDemoModeActive,
      toggleDemoMode
    }}>
      {children}
    </ClinicContext.Provider>
  );
}

export function useClinics() {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinics must be used within a ClinicProvider');
  }
  return context;
}
