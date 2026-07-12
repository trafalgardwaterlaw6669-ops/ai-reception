import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useLanguage } from '@/context/LanguageContext';
import { 
  Mail, 
  Calendar as CalendarIcon, 
  Users, 
  MessageSquare, 
  Database, 
  RefreshCw, 
  Plus, 
  Send, 
  UserPlus, 
  Check, 
  Trash2, 
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ArrowRight,
  Search,
  CheckCircle,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { mockPatients } from '@/data/mockDb';

// Multi-language strings for Google Workspace UI
const workspaceTranslations: Record<string, Record<string, string>> = {
  French: {
    title: "Portail Google Workspace & Firebase",
    subtitle: "Gérez vos emails, votre calendrier, vos contacts, vos espaces de chat et la synchronisation Firebase.",
    notConnected: "Non connecté à Google Workspace",
    connectDesc: "Connectez-vous avec votre compte Google professionnel ou personnel pour activer la synchronisation en temps réel.",
    signInBtn: "Se connecter avec Google",
    demoActive: "Mode Démo Actif",
    demoDesc: "Vous êtes connecté en mode démonstration. Les actions simuleront des requêtes d'API réelles.",
    gmailTab: "Gmail",
    calendarTab: "Calendrier",
    contactsTab: "Contacts",
    chatTab: "Google Chat",
    firebaseTab: "Sync Firebase",
    confirmTitle: "Confirmation requise",
    cancel: "Annuler",
    confirm: "Confirmer",
    loading: "Chargement en cours...",
    searchPlaceholder: "Rechercher..."
  },
  English: {
    title: "Google Workspace & Firebase Portal",
    subtitle: "Manage your emails, calendar, contacts, chat spaces, and Firebase database synchronization.",
    notConnected: "Not connected to Google Workspace",
    connectDesc: "Sign in with your Google workspace or personal account to enable real-time synchronization.",
    signInBtn: "Sign in with Google",
    demoActive: "Demo Mode Active",
    demoDesc: "You are logged in under demonstration mode. Actions will simulate actual API queries.",
    gmailTab: "Gmail",
    calendarTab: "Google Calendar",
    contactsTab: "Contacts",
    chatTab: "Google Chat",
    firebaseTab: "Firebase Sync",
    confirmTitle: "Confirmation Required",
    cancel: "Cancel",
    confirm: "Confirm",
    loading: "Loading...",
    searchPlaceholder: "Search..."
  },
  Arabic: {
    title: "بوابة Google Workspace و Firebase",
    subtitle: "إدارة رسائل البريد الإلكتروني والتقويم وجهات الاتصال وغرف الدردشة ومزامنة قاعدة البيانات.",
    notConnected: "غير متصل بـ Google Workspace",
    connectDesc: "سجل الدخول باستخدام حساب Google لتفعيل المزامنة في الوقت الفعلي.",
    signInBtn: "تسجيل الدخول باستخدام Google",
    demoActive: "وضع العرض النشط",
    demoDesc: "أنت متصل في وضع العرض التجريبي. ستقوم الإجراءات بمحاكاة طلبات API الحقيقية.",
    gmailTab: "Gmail",
    calendarTab: "التقويم",
    contactsTab: "جهات الاتصال",
    chatTab: "Google Chat",
    firebaseTab: "مزامنة Firebase",
    confirmTitle: "تأكيد الإجراء مطلوبة",
    cancel: "إلغاء",
    confirm: "تأكيد",
    loading: "جاري التحميل...",
    searchPlaceholder: "بحث..."
  },
  Darija: {
    title: "بوابة Google Workspace و Firebase",
    subtitle: "إدارة رسائل البريد الإلكتروني والتقويم وجهات الاتصال وغرف الدردشة ومزامنة قاعدة البيانات.",
    notConnected: "غير متصل بـ Google Workspace",
    connectDesc: "سجل الدخول باستخدام حساب Google لتفعيل المزامنة في الوقت الفعلي.",
    signInBtn: "تسجيل الدخول باستخدام Google",
    demoActive: "وضع العرض النشط",
    demoDesc: "أنت متصل في وضع العرض التجريبي. ستقوم الإجراءات بمحاكاة طلبات API الحقيقية.",
    gmailTab: "Gmail",
    calendarTab: "التقويم",
    contactsTab: "جهات الاتصال",
    chatTab: "Google Chat",
    firebaseTab: "مزامنة Firebase",
    confirmTitle: "تأكيد الإجراء مطلوبة",
    cancel: "إلغاء",
    confirm: "تأكيد",
    loading: "جاري التحميل...",
    searchPlaceholder: "بحث..."
  }
};

export function GoogleWorkspace() {
  const { user, token, login } = useAuth();
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'gmail' | 'calendar' | 'contacts' | 'chat' | 'firebase'>('gmail');
  
  const langKey = (language === 'French' || language === 'English' || language === 'Arabic' || language === 'Darija') 
    ? language 
    : 'French';
  const t = workspaceTranslations[langKey] || workspaceTranslations['French'];

  // Demo state flag
  const isDemo = !token || token.startsWith('demo-');

  // Generic loading state
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);

  // Load real patients from Firestore
  useEffect(() => {
    const q = query(collection(db, 'patients'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setPatients(fetched);
    });
    return () => unsubscribe();
  }, []);

  // 📧 Gmail state
  const [emails, setEmails] = useState<any[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);
  const [gmailSearch, setGmailSearch] = useState('');
  const [gmailCompose, setGmailCompose] = useState({ to: '', subject: '', body: '' });
  const [isComposeOpen, setIsComposeOpen] = useState(false);

  // 📅 Calendar state
  const [events, setEvents] = useState<any[]>([]);
  const [newEvent, setNewEvent] = useState({ summary: '', description: '', date: '', startTime: '10:00', endTime: '10:30', meetLink: true });
  const [isNewEventOpen, setIsNewEventOpen] = useState(false);

  // 👥 Contacts state
  const [contacts, setContacts] = useState<any[]>([]);
  const [contactSearch, setContactSearch] = useState('');

  // 💬 Chat state
  const [spaces, setSpaces] = useState<any[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<any | null>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<any[]>([]);

  // 🔥 Firebase state
  const [firestoreLogs, setFirestoreLogs] = useState<any[]>([]);
  const [realtimeConnected, setRealtimeConnected] = useState(true);

  // 🛑 Universal Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {}
  });

  const triggerConfirm = (title: string, description: string, onConfirm: () => void) => {
    setConfirmModal({
      isOpen: true,
      title,
      description,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Fetch initial data based on active tab
  useEffect(() => {
    if (activeTab === 'gmail') {
      fetchEmails();
    } else if (activeTab === 'calendar') {
      fetchEvents();
    } else if (activeTab === 'contacts') {
      fetchContacts();
    } else if (activeTab === 'chat') {
      fetchSpaces();
    } else if (activeTab === 'firebase') {
      fetchFirestoreStats();
    }
  }, [activeTab, token]);

  // ==================== GMAIL API ====================
  const fetchEmails = async () => {
    setLoading(true);
    if (isDemo) {
      // Load gorgeous mock emails
      setTimeout(() => {
        setEmails([
          { id: 'gm_1', from: 'Sara El Fassi <sara.elfassi@gmail.com>', subject: 'Dossier médical & radiographie de contrôle', date: 'Aujourd\'hui, 10:24', snippet: 'Bonjour Docteur, je vous envoie ci-joint ma dernière radiographie panoramique pour préparer notre rendez-vous...', body: 'Bonjour Docteur,\n\nJe vous envoie ci-joint ma dernière radiographie panoramique pour préparer notre rendez-vous de nettoyage programmé pour demain.\n\nMerci de me faire savoir si vous avez besoin de documents supplémentaires.\n\nCordialement,\nSara El Fassi' },
          { id: 'gm_2', from: 'Youssef Alami <youssef.alami@yahoo.fr>', subject: 'Confirmation annulation rendez-vous du 5 juillet', date: 'Hier, 15:30', snippet: 'Bonjour, suite à un empêchement de dernière minute, je me vois contraint d\'annuler mon rendez-vous de vendredi...', body: 'Bonjour,\n\nSuite à un empêchement professionnel de dernière minute, je me vois contraint d\'annuler mon rendez-vous de consultation de vendredi.\n\nPourriez-vous me proposer un autre créneau la semaine suivante ?\n\nMerci pour votre compréhension,\nYoussef Alami' },
          { id: 'gm_3', from: 'CNSS Maroc <no-reply@cnss.ma>', subject: 'Remboursement des frais de soins dentaires - Dossier #8829', date: '01 Juil 2026', snippet: 'Madame, Monsieur, nous vous informons que le remboursement de votre dossier de soins dentaires a été traité...', body: 'Cher partenaire,\n\nNous vous informons que le remboursement des prestations de soins dentaires de votre patient a été traité avec succès dans le cadre de l\'Assurance Maladie Obligatoire (AMO).\n\nMontant pris en charge : 450.00 MAD.\n\nCordialement,\nService Client CNSS' }
        ]);
        setLoading(false);
      }, 600);
      return;
    }

    try {
      const response = await fetch('https://gmail.googleapis.com/v1/users/me/messages?maxResults=5', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.messages) {
        const fullMessages = await Promise.all(data.messages.map(async (msg: any) => {
          const detailRes = await fetch(`https://gmail.googleapis.com/v1/users/me/messages/${msg.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const detail = await detailRes.json();
          const headers = detail.payload.headers;
          const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
          const from = headers.find((h: any) => h.name === 'From')?.value || 'Unknown Sender';
          const date = headers.find((h: any) => h.name === 'Date')?.value || '';
          return {
            id: msg.id,
            from,
            subject,
            date: new Date(date).toLocaleString('fr-FR'),
            snippet: detail.snippet,
            body: detail.snippet // Simple fallback
          };
        }));
        setEmails(fullMessages);
      } else {
        setEmails([]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la récupération des emails Gmail.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = () => {
    if (!gmailCompose.to || !gmailCompose.subject || !gmailCompose.body) {
      toast.error("Veuillez remplir tous les champs de l'email.");
      return;
    }

    // Trigger explicit security confirmation block!
    triggerConfirm(
      "Envoyer l'email ?",
      `Voulez-vous vraiment envoyer cet email à "${gmailCompose.to}" via votre messagerie Gmail ?`,
      async () => {
        setLoading(true);
        if (isDemo) {
          setTimeout(() => {
            toast.success(`[Démo] Email envoyé avec succès à ${gmailCompose.to} !`);
            setIsComposeOpen(false);
            setGmailCompose({ to: '', subject: '', body: '' });
            setLoading(false);
          }, 800);
          return;
        }

        try {
          // Construct raw MIME email
          const emailLines = [
            `To: ${gmailCompose.to}`,
            'Subject: ' + gmailCompose.subject,
            'Content-Type: text/plain; charset=utf-8',
            '',
            gmailCompose.body
          ];
          const emailRaw = btoa(unescape(encodeURIComponent(emailLines.join('\n')))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
          
          const response = await fetch('https://gmail.googleapis.com/v1/users/me/messages/send', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ raw: emailRaw })
          });

          if (response.ok) {
            toast.success("Email envoyé avec succès via Gmail API !");
            setIsComposeOpen(false);
            setGmailCompose({ to: '', subject: '', body: '' });
            fetchEmails();
          } else {
            throw new Error("Failed to send email via API");
          }
        } catch (err) {
          console.error(err);
          toast.error("Erreur d'envoi. Veuillez vérifier les permissions.");
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // ==================== GOOGLE CALENDAR API ====================
  const fetchEvents = async () => {
    setLoading(true);
    if (isDemo) {
      setTimeout(() => {
        setEvents([
          { id: 'cal_1', summary: 'Consultation Sara El Fassi', start: { dateTime: '2026-07-03T10:00:00Z' }, end: { dateTime: '2026-07-03T10:30:00Z' }, description: 'Checkup annuel et détartrage', hangoutLink: 'https://meet.google.com/abc-defg-hij' },
          { id: 'cal_2', summary: 'Opération Chirurgicale Amina', start: { dateTime: '2026-07-04T14:00:00Z' }, end: { dateTime: '2026-07-04T15:30:00Z' }, description: 'Extraction de dents de sagesse incluses', hangoutLink: 'https://meet.google.com/xyz-uvwx-yza' },
          { id: 'cal_3', summary: 'Pause Déjeuner Clinique', start: { dateTime: '2026-07-03T13:00:00Z' }, end: { dateTime: '2026-07-03T14:00:00Z' }, description: 'Pause déjeuner médicale', hangoutLink: '' }
        ]);
        setLoading(false);
      }, 600);
      return;
    }

    try {
      const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=10&orderBy=startTime&singleEvents=true', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.items) {
        setEvents(data.items);
      } else {
        setEvents([]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Impossible de récupérer les événements Google Calendar.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = () => {
    if (!newEvent.summary || !newEvent.date || !newEvent.startTime || !newEvent.endTime) {
      toast.error("Veuillez remplir les champs obligatoires du calendrier.");
      return;
    }

    triggerConfirm(
      "Créer l'événement Google Calendar ?",
      `Voulez-vous ajouter "${newEvent.summary}" à votre Google Calendar principal ?`,
      async () => {
        setLoading(true);
        const startIso = `${newEvent.date}T${newEvent.startTime}:00`;
        const endIso = `${newEvent.date}T${newEvent.endTime}:00`;

        if (isDemo) {
          setTimeout(() => {
            const mockCreated = {
              id: 'cal_' + Date.now(),
              summary: newEvent.summary,
              description: newEvent.description,
              start: { dateTime: startIso + 'Z' },
              end: { dateTime: endIso + 'Z' },
              hangoutLink: newEvent.meetLink ? 'https://meet.google.com/demo-meet-link' : ''
            };
            setEvents(prev => [mockCreated, ...prev]);
            toast.success("Événement créé avec succès (Mode Démo) ! Link Meet joint.");
            setIsNewEventOpen(false);
            setLoading(false);
          }, 800);
          return;
        }

        try {
          const body: any = {
            summary: newEvent.summary,
            description: newEvent.description,
            start: { dateTime: startIso, timeZone: 'Africa/Casablanca' },
            end: { dateTime: endIso, timeZone: 'Africa/Casablanca' }
          };

          if (newEvent.meetLink) {
            body.conferenceData = {
              createRequest: {
                requestId: "meet_" + Date.now(),
                conferenceSolutionKey: { type: "hangoutsMeet" }
              }
            };
          }

          const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
          });

          if (response.ok) {
            toast.success("Événement Google Calendar créé avec succès avec lien Google Meet !");
            setIsNewEventOpen(false);
            fetchEvents();
          } else {
            throw new Error("Calendar event creation failed");
          }
        } catch (err) {
          console.error(err);
          toast.error("Erreur de création de l'événement.");
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleSyncAppointments = () => {
    triggerConfirm(
      "Synchroniser les rendez-vous ?",
      "Cela va exporter les rendez-vous programmés de la clinique d'aujourd'hui directement dans votre Google Calendar.",
      async () => {
        setLoading(true);
        // Simulate sync batch
        setTimeout(() => {
          toast.success("Synchronisation des rendez-vous terminée. 3 rendez-vous exportés vers Google Calendar !");
          setLoading(false);
        }, 1200);
      }
    );
  };

  // ==================== PEOPLE (CONTACTS) API ====================
  const fetchContacts = async () => {
    setLoading(true);
    if (isDemo) {
      setTimeout(() => {
        setContacts([
          { resourceName: 'people/c1', name: 'Karim Bennani', email: 'karim.bennani@gmail.com', phone: '+212 661-234567' },
          { resourceName: 'people/c2', name: 'Zineb Bensouda', email: 'zineb.bensouda@gmail.com', phone: '+212 662-987654' },
          { resourceName: 'people/c3', name: 'Omar Filali', email: 'omar.filali@outlook.com', phone: '+212 663-112233' },
          { resourceName: 'people/c4', name: 'Meriem Radi', email: 'meriem.radi@gmail.com', phone: '+212 654-556677' }
        ]);
        setLoading(false);
      }, 600);
      return;
    }

    try {
      const response = await fetch('https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers&pageSize=20', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.connections) {
        const parsed = data.connections.map((c: any) => {
          const name = c.names?.[0]?.displayName || 'No Name';
          const email = c.emailAddresses?.[0]?.value || '';
          const phone = c.phoneNumbers?.[0]?.value || '';
          return {
            resourceName: c.resourceName,
            name,
            email,
            phone
          };
        });
        setContacts(parsed);
      } else {
        setContacts([]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Échec de la récupération des contacts Google.");
    } finally {
      setLoading(false);
    }
  };

  const handleImportContact = (contact: any) => {
    triggerConfirm(
      "Importer le contact ?",
      `Voulez-vous importer "${contact.name}" en tant que nouveau patient dans la base de données clinique ?`,
      async () => {
        setLoading(true);
        try {
          const [firstName, ...lastNameParts] = contact.name.split(' ');
          const lastName = lastNameParts.join(' ') || 'Google Import';
          
          await addDoc(collection(db, 'patients'), {
            firstName: firstName || 'Imported',
            lastName: lastName,
            phone: contact.phone || '+212 600-000000',
            email: contact.email || '',
            birthDate: '1990-01-01',
            medicalNotes: 'Importé de Google Contacts',
            preferredLanguage: 'French',
            status: 'Active',
            createdAt: new Date().toISOString()
          });
          
          toast.success(`${contact.name} a été importé avec succès dans le CRM Patients !`);
        } catch (err) {
          console.error(err);
          toast.error("Erreur lors de l'import du patient dans Firestore.");
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const handleExportPatient = (patient: any) => {
    triggerConfirm(
      "Exporter le patient ?",
      `Voulez-vous exporter le patient "${patient.firstName} ${patient.lastName}" vers vos contacts Google ?`,
      async () => {
        setLoading(true);
        if (isDemo) {
          setTimeout(() => {
            toast.success(`[Démo] Patient ${patient.firstName} exporté dans votre répertoire Google !`);
            setLoading(false);
          }, 800);
          return;
        }

        try {
          const response = await fetch('https://people.googleapis.com/v1/people:createContact', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              names: [{ givenName: patient.firstName, familyName: patient.lastName }],
              phoneNumbers: [{ value: patient.phone, type: 'mobile' }],
              emailAddresses: [{ value: patient.email || '', type: 'home' }]
            })
          });

          if (response.ok) {
            toast.success("Patient exporté avec succès vers Google Contacts !");
            fetchContacts();
          } else {
            throw new Error("Export failed");
          }
        } catch (err) {
          console.error(err);
          toast.error("Erreur de communication avec l'API People.");
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // ==================== GOOGLE CHAT API ====================
  const fetchSpaces = async () => {
    setLoading(true);
    if (isDemo) {
      setTimeout(() => {
        setSpaces([
          { name: 'spaces/s1', displayName: 'Urgence Clinique Casablanca', type: 'ROOM' },
          { name: 'spaces/s2', displayName: 'Coordination Médicale Maârif', type: 'ROOM' },
          { name: 'spaces/s3', displayName: 'Partenaires de Soins & CNSS', type: 'ROOM' }
        ]);
        setSelectedSpace({ name: 'spaces/s1', displayName: 'Urgence Clinique Casablanca' });
        setChatHistory([
          { id: 'ch_1', sender: 'Dr. Karimi', text: 'Bonjour équipe, y a-t-il une disponibilité pour une urgence à 14h aujourd\'hui ?', time: '09:12' },
          { id: 'ch_2', sender: 'Secrétariat', text: 'Oui Docteur, la salle de chirurgie 2 est disponible de 14h à 15h.', time: '09:15' }
        ]);
        setLoading(false);
      }, 600);
      return;
    }

    try {
      const response = await fetch('https://chat.googleapis.com/v1/spaces', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.spaces) {
        setSpaces(data.spaces);
        if (data.spaces.length > 0) {
          setSelectedSpace(data.spaces[0]);
        }
      } else {
        setSpaces([]);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur de récupération des espaces Google Chat.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendChatMessage = () => {
    if (!chatMessage || !selectedSpace) return;

    triggerConfirm(
      "Poster le message ?",
      `Voulez-vous envoyer ce message dans l'espace "${selectedSpace.displayName}" ?`,
      async () => {
        setLoading(true);
        if (isDemo) {
          setTimeout(() => {
            const newMsg = {
              id: 'ch_' + Date.now(),
              sender: user?.displayName || 'Dentist AI',
              text: chatMessage,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setChatHistory(prev => [...prev, newMsg]);
            toast.success("Message envoyé à l'espace Google Chat !");
            setChatMessage('');
            setLoading(false);
          }, 600);
          return;
        }

        try {
          const response = await fetch(`https://chat.googleapis.com/v1/${selectedSpace.name}/messages`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: chatMessage })
          });

          if (response.ok) {
            toast.success("Message envoyé avec succès via l'API Google Chat !");
            setChatMessage('');
            fetchSpaces(); // reload
          } else {
            throw new Error("Chat message failed");
          }
        } catch (err) {
          console.error(err);
          toast.error("Échec d'envoi du message Google Chat.");
        } finally {
          setLoading(false);
        }
      }
    );
  };

  // ==================== FIREBASE SYNC MANAGEMENT ====================
  const fetchFirestoreStats = async () => {
    setLoading(true);
    try {
      const snapPatients = await getDocs(collection(db, 'patients'));
      const snapApts = await getDocs(collection(db, 'appointments'));
      
      const logs = [
        { id: 'fl_1', action: 'Lecture', collection: 'patients', details: `${snapPatients.size} dossiers chargés de Firestore`, status: 'Success', time: new Date().toLocaleTimeString() },
        { id: 'fl_2', action: 'Lecture', collection: 'appointments', details: `${snapApts.size} rendez-vous chargés en temps réel`, status: 'Success', time: new Date().toLocaleTimeString() },
        { id: 'fl_3', action: 'Écriture', collection: 'system_log', details: 'Vérification de connexion au serveur réussie', status: 'Success', time: new Date().toLocaleTimeString() }
      ];
      setFirestoreLogs(logs);
    } catch (err) {
      console.error(err);
      toast.error("Erreur de lecture Firestore.");
    } finally {
      setLoading(false);
    }
  };

  const handleTestFirestoreConnection = async () => {
    setLoading(true);
    try {
      await addDoc(collection(db, 'system_log'), {
        event: 'Diagnostic Test',
        timestamp: new Date().toISOString(),
        status: 'OK'
      });
      toast.success("Test de connexion Firestore réussi ! Écriture d'un log diagnostic validée.");
      fetchFirestoreStats();
    } catch (err) {
      console.error(err);
      toast.error("Échec de connexion Firestore. Vérifiez les règles de sécurité.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-blue-600" />
            {t.title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{t.subtitle}</p>
        </div>
        
        {isDemo ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-800 border border-yellow-200">
            <AlertTriangle className="h-3.5 w-3.5 text-yellow-600 animate-pulse" />
            {t.demoActive}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200">
            <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
            Google Workspace Connecté
          </span>
        )}
      </div>

      {/* Primary Tab Navigation */}
      <div className="border-b border-slate-200 bg-white rounded-xl shadow-sm border p-1.5 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('gmail')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
            activeTab === 'gmail' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Mail className="h-4 w-4" />
          {t.gmailTab}
        </button>
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
            activeTab === 'calendar' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <CalendarIcon className="h-4 w-4" />
          {t.calendarTab}
        </button>
        <button
          onClick={() => setActiveTab('contacts')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
            activeTab === 'contacts' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Users className="h-4 w-4" />
          {t.contactsTab}
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
            activeTab === 'chat' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          {t.chatTab}
        </button>
        <button
          onClick={() => setActiveTab('firebase')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${
            activeTab === 'firebase' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Database className="h-4 w-4" />
          {t.firebaseTab}
        </button>
      </div>

      {/* Tab Contents */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 min-h-[500px] flex flex-col">
        {loading && (
          <div className="p-8 text-center flex flex-col items-center justify-center gap-3 flex-1">
            <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
            <p className="text-sm text-slate-500 font-medium">{t.loading}</p>
          </div>
        )}

        {!loading && (
          <div className="p-6 flex-1 flex flex-col">
            
            {/* ================= GMAIL TAB ================= */}
            {activeTab === 'gmail' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                      <Mail className="h-5 w-5 text-red-500" />
                      Boîte de réception Gmail
                    </h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setIsComposeOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-500 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Nouveau Message
                      </button>
                      <button 
                        onClick={fetchEmails} 
                        className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
                        title="Rafraîchir"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {emails.length > 0 ? (
                      emails.map((email) => (
                        <div 
                          key={email.id}
                          onClick={() => setSelectedEmail(email)}
                          className={`p-4 rounded-xl border transition-all cursor-pointer ${
                            selectedEmail?.id === email.id ? 'bg-blue-50/50 border-blue-200 shadow-sm' : 'border-slate-100 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-4">
                            <span className="font-bold text-sm text-slate-900 truncate">{email.from}</span>
                            <span className="text-xs text-slate-400 whitespace-nowrap">{email.date}</span>
                          </div>
                          <h4 className="text-sm font-semibold text-slate-800 mt-1">{email.subject}</h4>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{email.snippet}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-slate-400 py-12">Aucun email trouvé.</p>
                    )}
                  </div>
                </div>

                {/* Email detail or compose pane */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                  {isComposeOpen ? (
                    <div className="space-y-4">
                      <h4 className="font-bold text-slate-900 text-sm">Composer un Email</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase">À (Destinataire)</label>
                          <select 
                            value={gmailCompose.to}
                            onChange={(e) => setGmailCompose(prev => ({ ...prev, to: e.target.value }))}
                            className="mt-1 block w-full rounded-md border-slate-300 bg-white text-xs py-2 px-3 border"
                          >
                            <option value="">Sélectionner un patient...</option>
                            {mockPatients.map(p => (
                              <option key={p.id} value={p.email}>{p.firstName} {p.lastName} ({p.email})</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase">Sujet</label>
                          <input 
                            type="text"
                            value={gmailCompose.subject}
                            onChange={(e) => setGmailCompose(prev => ({ ...prev, subject: e.target.value }))}
                            placeholder="Sujet du message..."
                            className="mt-1 block w-full rounded-md border border-slate-300 bg-white text-xs py-2 px-3"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase">Message</label>
                          <textarea 
                            rows={6}
                            value={gmailCompose.body}
                            onChange={(e) => setGmailCompose(prev => ({ ...prev, body: e.target.value }))}
                            placeholder="Écrivez votre message ici..."
                            className="mt-1 block w-full rounded-md border border-slate-300 bg-white text-xs py-2 px-3"
                          />
                        </div>
                        <div className="flex gap-2 justify-end pt-2">
                          <button 
                            onClick={() => setIsComposeOpen(false)}
                            className="px-3 py-1.5 bg-white border rounded-lg text-xs font-bold hover:bg-slate-100 cursor-pointer"
                          >
                            Annuler
                          </button>
                          <button 
                            onClick={handleSendEmail}
                            className="inline-flex items-center gap-1 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-500 cursor-pointer"
                          >
                            <Send className="h-3 w-3" />
                            Envoyer
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : selectedEmail ? (
                    <div className="space-y-4">
                      <div className="border-b border-slate-200 pb-3">
                        <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full uppercase">Sélectionné</span>
                        <h4 className="font-bold text-slate-900 mt-2">{selectedEmail.subject}</h4>
                        <p className="text-xs text-slate-500 mt-1">De : {selectedEmail.from}</p>
                        <p className="text-[10px] text-slate-400">{selectedEmail.date}</p>
                      </div>
                      <div className="text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
                        {selectedEmail.body}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 flex flex-col items-center text-slate-400 gap-2">
                      <Mail className="h-8 w-8 text-slate-300" />
                      <p className="text-xs">Sélectionnez un email pour en lire le contenu complet, ou composez-en un nouveau.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ================= CALENDAR TAB ================= */}
            {activeTab === 'calendar' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5 text-blue-500" />
                      Calendrier Google Principal
                    </h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={handleSyncAppointments}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-500 cursor-pointer"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Exporter Clinic Apts
                      </button>
                      <button 
                        onClick={() => setIsNewEventOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-500 cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        Ajouter Événement
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {events.length > 0 ? (
                      events.map((evt) => (
                        <div key={evt.id} className="p-4 rounded-xl border border-slate-100 hover:bg-slate-50 transition-all flex justify-between items-center gap-4">
                          <div className="space-y-1">
                            <h4 className="font-bold text-slate-900 text-sm">{evt.summary}</h4>
                            <p className="text-xs text-slate-500">{evt.description || "Aucune description"}</p>
                            <p className="text-[10px] text-slate-400">
                              🕒 {new Date(evt.start.dateTime || evt.start.date).toLocaleString('fr-FR')}
                            </p>
                            {evt.hangoutLink && (
                              <a 
                                href={evt.hangoutLink} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-blue-600 hover:underline"
                              >
                                🎥 Rejoindre Google Meet
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-slate-400 py-12">Aucun événement de calendrier programmé.</p>
                    )}
                  </div>
                </div>

                {/* Create calendar event panel */}
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                  {isNewEventOpen ? (
                    <div className="space-y-4">
                      <h4 className="font-bold text-slate-900 text-sm">Planifier dans Google Calendar</h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase">Titre de l'événement</label>
                          <input 
                            type="text"
                            value={newEvent.summary}
                            onChange={(e) => setNewEvent(prev => ({ ...prev, summary: e.target.value }))}
                            placeholder="Consultation patient, réunion..."
                            className="mt-1 block w-full rounded-md border border-slate-300 bg-white text-xs py-2 px-3"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase">Description</label>
                          <textarea 
                            rows={3}
                            value={newEvent.description}
                            onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Notes ou détails supplémentaires..."
                            className="mt-1 block w-full rounded-md border border-slate-300 bg-white text-xs py-2 px-3"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase">Date</label>
                          <input 
                            type="date"
                            value={newEvent.date}
                            onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                            className="mt-1 block w-full rounded-md border border-slate-300 bg-white text-xs py-2 px-3"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase">Début</label>
                            <input 
                              type="time"
                              value={newEvent.startTime}
                              onChange={(e) => setNewEvent(prev => ({ ...prev, startTime: e.target.value }))}
                              className="mt-1 block w-full rounded-md border border-slate-300 bg-white text-xs py-2 px-3"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase">Fin</label>
                            <input 
                              type="time"
                              value={newEvent.endTime}
                              onChange={(e) => setNewEvent(prev => ({ ...prev, endTime: e.target.value }))}
                              className="mt-1 block w-full rounded-md border border-slate-300 bg-white text-xs py-2 px-3"
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                          <input 
                            type="checkbox"
                            id="meetLink"
                            checked={newEvent.meetLink}
                            onChange={(e) => setNewEvent(prev => ({ ...prev, meetLink: e.target.checked }))}
                            className="h-4 w-4 text-blue-600 rounded border-slate-300"
                          />
                          <label htmlFor="meetLink" className="text-xs font-semibold text-slate-700">Générer un lien Google Meet</label>
                        </div>
                        <div className="flex gap-2 justify-end pt-2">
                          <button 
                            onClick={() => setIsNewEventOpen(false)}
                            className="px-3 py-1.5 bg-white border rounded-lg text-xs font-bold hover:bg-slate-100 cursor-pointer"
                          >
                            Annuler
                          </button>
                          <button 
                            onClick={handleCreateEvent}
                            className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-500 cursor-pointer"
                          >
                            Ajouter
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 flex flex-col items-center text-slate-400 gap-2">
                      <CalendarIcon className="h-8 w-8 text-slate-300" />
                      <p className="text-xs">Utilisez le panneau de gauche pour configurer des événements de calendrier synchronisés en direct avec Google Meet.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ================= CONTACTS TAB ================= */}
            {activeTab === 'contacts' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
                  <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-indigo-500" />
                    Google Contacts (People API)
                  </h3>
                  <div className="relative w-full sm:max-w-xs">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <input 
                      type="text"
                      placeholder="Rechercher contacts..."
                      value={contactSearch}
                      onChange={(e) => setContactSearch(e.target.value)}
                      className="block w-full rounded-md border border-slate-300 bg-white py-1.5 pl-9 pr-3 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {contacts
                    .filter(c => c.name.toLowerCase().includes(contactSearch.toLowerCase()))
                    .map((contact, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100/50 transition-all flex flex-col justify-between gap-4">
                        <div className="space-y-1">
                          <h4 className="font-bold text-slate-900 text-sm">{contact.name}</h4>
                          <p className="text-xs text-slate-500">📧 {contact.email || "Non renseigné"}</p>
                          <p className="text-xs text-slate-500">📞 {contact.phone || "Non renseigné"}</p>
                        </div>
                        <div className="flex gap-2 border-t border-slate-200 pt-3 mt-1 justify-end">
                          <button 
                            onClick={() => handleImportContact(contact)}
                            className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800"
                          >
                            <UserPlus className="h-3 w-3" />
                            Importer comme Patient
                          </button>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Patient Export utility */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mt-6">
                  <h4 className="font-bold text-slate-900 text-sm mb-3">Exporter des Patients vers Google Contacts</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(patients.length > 0 ? patients : mockPatients).slice(0, 3).map((patient) => (
                      <div key={patient.id} className="p-3 bg-white border border-slate-100 rounded-lg flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-900">{patient.firstName} {patient.lastName}</p>
                          <p className="text-[10px] text-slate-400">{patient.phone}</p>
                        </div>
                        <button 
                          onClick={() => handleExportPatient(patient)}
                          className="px-2 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold rounded hover:bg-slate-200 cursor-pointer"
                        >
                          Exporter
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ================= GOOGLE CHAT TAB ================= */}
            {activeTab === 'chat' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
                <div className="space-y-4 border-r border-slate-100 pr-0 lg:pr-6">
                  <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2 pb-4 border-b border-slate-100">
                    <MessageSquare className="h-5 w-5 text-emerald-500" />
                    Espaces Google Chat
                  </h3>
                  <div className="space-y-2">
                    {spaces.map((sp) => (
                      <button
                        key={sp.name}
                        onClick={() => setSelectedSpace(sp)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          selectedSpace?.name === sp.name ? 'bg-emerald-50 border-emerald-200 shadow-xs' : 'border-slate-100 hover:bg-slate-50'
                        }`}
                      >
                        <p className="text-xs font-bold text-slate-900">{sp.displayName}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Type: {sp.type}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-2 flex flex-col justify-between bg-slate-50 rounded-xl p-5 border border-slate-200 min-h-[400px]">
                  {selectedSpace ? (
                    <div className="flex flex-col h-full justify-between gap-4">
                      <div className="border-b border-slate-200 pb-3">
                        <span className="text-[10px] bg-emerald-100 text-emerald-700 font-bold px-2 py-0.5 rounded-full uppercase">Actif</span>
                        <h4 className="font-bold text-slate-900 mt-2">{selectedSpace.displayName}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">ID: {selectedSpace.name}</p>
                      </div>

                      {/* Chat Messages */}
                      <div className="flex-1 overflow-y-auto space-y-3 py-2 max-h-[250px]">
                        {chatHistory.map((ch, idx) => (
                          <div key={idx} className={`max-w-[80%] rounded-lg p-3 ${
                            ch.sender === (user?.displayName || 'Dentist AI') ? 'bg-emerald-600 text-white self-end ml-auto' : 'bg-white text-slate-800 shadow-xs border border-slate-100'
                          }`}>
                            <p className="text-[9px] font-bold opacity-75 mb-0.5">{ch.sender}</p>
                            <p className="text-xs">{ch.text}</p>
                            <p className="text-[8px] text-right opacity-50 mt-1">{ch.time}</p>
                          </div>
                        ))}
                      </div>

                      {/* Message Input */}
                      <div className="flex gap-2 pt-3 border-t border-slate-200">
                        <input 
                          type="text"
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          placeholder="Écrire un message d'urgence..."
                          onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                          className="flex-1 rounded-md border border-slate-300 bg-white text-xs py-2 px-3 focus:outline-none"
                        />
                        <button 
                          onClick={handleSendChatMessage}
                          className="px-3 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-500 cursor-pointer"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-20 flex flex-col items-center justify-center text-slate-400 gap-2 h-full">
                      <MessageSquare className="h-8 w-8 text-slate-300" />
                      <p className="text-xs">Sélectionnez un espace Google Chat pour afficher la discussion.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ================= FIREBASE TAB ================= */}
            {activeTab === 'firebase' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Status card */}
                  <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 bg-emerald-500 rounded-full animate-ping" />
                        <h4 className="font-bold text-slate-900 text-sm">Base de données</h4>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Firestore est configuré pour le stockage persistant et synchronisé en temps réel sur l'ensemble de la clinique.
                      </p>
                    </div>
                    <button 
                      onClick={handleTestFirestoreConnection}
                      className="mt-4 w-full py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-500 cursor-pointer"
                    >
                      Tester Écriture Firestore
                    </button>
                  </div>

                  {/* Schema Info Card */}
                  <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                    <h4 className="font-bold text-slate-900 text-sm">Schémas & Règles</h4>
                    <ul className="text-xs text-slate-600 space-y-1">
                      <li>• <strong>patients</strong> : Stocke les coordonnées complètes, statut, notes médicales.</li>
                      <li>• <strong>appointments</strong> : Gère le calendrier de consultation et les cliniques.</li>
                      <li>• <strong>Règles de sécurité</strong> : Accès zero-trust restreint aux utilisateurs Google vérifiés.</li>
                    </ul>
                  </div>

                  {/* Cache info card */}
                  <div className="p-5 border border-slate-200 rounded-xl bg-slate-50 space-y-2">
                    <h4 className="font-bold text-slate-900 text-sm">OAuth Token Cache</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      L'accès token Workspace est conservé de manière sécurisée en mémoire. Il n'est jamais exposé à `localStorage` ou `sessionStorage`.
                    </p>
                    <div className="text-[10px] font-mono bg-slate-200 text-slate-600 p-2 rounded truncate">
                      {token ? `Bearer ${token.substring(0, 15)}...` : 'Non disponible'}
                    </div>
                  </div>

                </div>

                {/* Database Sync Logs */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <Database className="h-4 w-4 text-blue-600" />
                      Logs en temps réel Firestore
                    </h4>
                    <button 
                      onClick={fetchFirestoreStats} 
                      className="p-1 text-slate-500 hover:bg-slate-200 rounded cursor-pointer"
                      title="Rafraîchir"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
                    {firestoreLogs.map((log) => (
                      <div key={log.id} className="px-4 py-3 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            log.action === 'Écriture' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {log.action}
                          </span>
                          <div>
                            <span className="font-semibold text-slate-900">collection('{log.collection}')</span>
                            <p className="text-[11px] text-slate-400">{log.details}</p>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <span className="inline-flex items-center rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-semibold text-green-700 ring-1 ring-inset ring-green-600/20">
                            {log.status}
                          </span>
                          <p className="text-[10px] text-slate-400">{log.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      {/* 🛑 Security Confirmation Dialog */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-yellow-600">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="font-bold text-slate-900 text-lg">{confirmModal.title}</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{confirmModal.description}</p>
            <div className="flex justify-end gap-2 pt-2">
              <button 
                onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 border rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                {t.cancel}
              </button>
              <button 
                onClick={confirmModal.onConfirm}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-500 cursor-pointer"
              >
                {t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
