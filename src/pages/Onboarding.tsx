import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { 
  Building2, 
  Clock, 
  Calendar as CalendarIcon, 
  Globe, 
  Phone, 
  MessageSquare, 
  Play, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  QrCode, 
  Smartphone, 
  Upload, 
  User, 
  Volume2, 
  PhoneCall,
  Loader2,
  Lock,
  Plus,
  Trash2,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, doc, setDoc } from 'firebase/firestore';
// Definition of steps
const ONBOARDING_STEPS = [
  { id: 1, title: 'Compte & Profil', subtitle: 'Créer un compte dentiste', icon: User },
  { id: 2, title: 'Cabinet Dentaire', subtitle: 'Informations cliniques', icon: Building2 },
  { id: 3, title: 'Horaires d\'Ouverture', subtitle: 'Définir les plages de garde', icon: Clock },
  { id: 4, title: 'Planning Patients', subtitle: 'Importer vos rendez-vous', icon: CalendarIcon },
  { id: 5, title: 'Langues Assistées', subtitle: 'Darija, Français, Anglais...', icon: Globe },
  { id: 6, title: 'Numéro de Téléphone', subtitle: 'Routage automatique', icon: Phone },
  { id: 7, title: 'WhatsApp Business', subtitle: 'Messagerie & Rappels', icon: MessageSquare },
  { id: 8, title: 'Lancement de l\'IA', subtitle: 'Prêt à recevoir des appels', icon: Play }
];

export function Onboarding() {
  const { user, login } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // STEP 1: Account
  const [accountData, setAccountData] = useState({
    dentistName: user?.displayName || 'Dr. El Alami',
    email: user?.email || 'cabinet.alami@gmail.com',
    specialty: 'Chirurgien Dentiste / Implantologue'
  });

  // STEP 2: Clinic Information
  const [clinicData, setClinicData] = useState({
    clinicName: 'Clinique Dentaire Maârif',
    city: 'Casablanca',
    address: 'Avenue Massira Khadra, Maârif, Casablanca',
    postalCode: '20100',
    about: 'Cabinet dentaire moderne spécialisé dans la pose d\'implants et l\'esthétique du sourire.'
  });

  // STEP 3: Working Hours
  const [workingDays, setWorkingDays] = useState({
    monday: { active: true, start: '09:00', end: '18:00' },
    tuesday: { active: true, start: '09:00', end: '18:00' },
    wednesday: { active: true, start: '09:00', end: '18:00' },
    thursday: { active: true, start: '09:00', end: '18:00' },
    friday: { active: true, start: '09:00', end: '17:00' },
    saturday: { active: false, start: '09:00', end: '13:00' },
    sunday: { active: false, start: '09:00', end: '13:00' }
  });

  // STEP 4: Appointment Schedule
  const [importMethod, setImportMethod] = useState<'google' | 'upload' | 'manual'>('google');
  const [isScheduleImported, setIsScheduleImported] = useState(false);
  const [importedEvents, setImportedEvents] = useState<any[]>([
    { patient: 'Youssef Benali', time: '10:00', date: '2026-07-03', service: 'Consultation' },
    { patient: 'Amina Mansouri', time: '11:30', date: '2026-07-03', service: 'Détartrage' }
  ]);
  const [fileName, setFileName] = useState('');

  // STEP 5: Choose Languages
  const [languages, setLanguages] = useState({
    darija: true,
    french: true,
    arabic: true,
    english: false
  });

  // STEP 6: Connect Phone Number
  const [phoneNumber, setPhoneNumber] = useState('+212 5 22 12 34 56');
  const [isLineRedirected, setIsLineRedirected] = useState(false);
  const [routingTestState, setRoutingTestState] = useState<'idle' | 'calling' | 'success'>('idle');

  // STEP 7: Connect WhatsApp
  const [whatsappNumber, setWhatsappNumber] = useState('+212 6 61 98 76 54');
  const [whatsappStatus, setWhatsappStatus] = useState<'disconnected' | 'pairing' | 'connected'>('disconnected');
  const [enableAutoReminders, setEnableAutoReminders] = useState(true);

  // STEP 8: Start Receiving Calls state
  const [liveLog, setLiveLog] = useState<string[]>([
    '🤖 Système d\'IA initialisé...',
    '📱 Module Téléphonique connecté au réseau marocain',
    '💬 Canal de confirmation WhatsApp couplé',
    '📡 En attente de signaux d\'appel...'
  ]);
  const [testPatientName, setTestPatientName] = useState('');
  const [testPatientTime, setTestPatientTime] = useState('');
  const [isReceivingCall, setIsReceivingCall] = useState(false);

  // Load wizard state from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('dentist_onboarding_wizard');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.currentStep) setCurrentStep(parsed.currentStep);
        if (parsed.accountData) setAccountData(parsed.accountData);
        if (parsed.clinicData) setClinicData(parsed.clinicData);
        if (parsed.workingDays) setWorkingDays(parsed.workingDays);
        if (parsed.languages) setLanguages(parsed.languages);
        if (parsed.phoneNumber) setPhoneNumber(parsed.phoneNumber);
        if (parsed.whatsappNumber) setWhatsappNumber(parsed.whatsappNumber);
        if (parsed.whatsappStatus) setWhatsappStatus(parsed.whatsappStatus);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Sync state to localstorage & Firestore as we proceed
  const saveStepProgress = async (nextStep: number) => {
    const statePayload = {
      currentStep: nextStep,
      accountData,
      clinicData,
      workingDays,
      languages,
      phoneNumber,
      whatsappNumber,
      whatsappStatus
    };
    localStorage.setItem('dentist_onboarding_wizard', JSON.stringify(statePayload));

    // Save progress to Firestore for ultimate durability
    try {
      setSaving(true);
      await setDoc(doc(db, 'onboarding_records', user?.uid || 'anonymous_dentist'), {
        ...statePayload,
        updatedAt: new Date().toISOString(),
        dentistName: accountData.dentistName,
        clinicName: clinicData.clinicName
      });
    } catch (err) {
      console.error("Firestore persistence error (handled): ", err);
    } finally {
      setSaving(false);
    }

    setCurrentStep(nextStep);
  };

  const handleNext = () => {
    // Perform validations
    if (currentStep === 1 && !accountData.dentistName) {
      toast.error("Veuillez saisir votre nom complet.");
      return;
    }
    if (currentStep === 2 && (!clinicData.clinicName || !clinicData.city)) {
      toast.error("Veuillez saisir le nom de votre cabinet et la ville.");
      return;
    }
    if (currentStep === 6 && !phoneNumber) {
      toast.error("Veuillez saisir le numéro de téléphone de la clinique.");
      return;
    }
    if (currentStep === 7 && !whatsappNumber) {
      toast.error("Veuillez saisir votre numéro WhatsApp Business.");
      return;
    }

    if (currentStep < ONBOARDING_STEPS.length) {
      const next = currentStep + 1;
      saveStepProgress(next);
      toast.success(`Étape ${currentStep} complétée !`);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleWorkingDayChange = (day: string, field: 'active' | 'start' | 'end', value: any) => {
    setWorkingDays(prev => ({
      ...prev,
      [day]: {
        ...prev[day as keyof typeof workingDays],
        [field]: value
      }
    }));
  };

  // Import simulation
  const handleImportGoogleCalendar = () => {
    toast.loading("Connexion et synchronisation en cours avec Google Calendar...", { id: 'gcal_sync' });
    setTimeout(() => {
      setIsScheduleImported(true);
      toast.success("Importation réussie de Google Calendar ! 12 rendez-vous synchronisés.", { id: 'gcal_sync' });
    }, 1200);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      toast.loading(`Analyse de ${file.name}...`, { id: 'file_sync' });
      setTimeout(() => {
        setIsScheduleImported(true);
        toast.success("Fichier Excel/CSV analysé ! 8 rendez-vous importés.", { id: 'file_sync' });
      }, 1000);
    }
  };

  // Test routing simulation
  const startRoutingTest = () => {
    setRoutingTestState('calling');
    toast.info("Lancement de la simulation d'appel sur votre ligne...");
    setTimeout(() => {
      setRoutingTestState('success');
      setIsLineRedirected(true);
      toast.success("Ligne de routage couplée ! Tous les appels entrants seront interceptés par l'IA.");
    }, 2000);
  };

  // QR pair simulation
  const startPairingWhatsapp = () => {
    setWhatsappStatus('pairing');
    toast.info("Génération du code QR d'association Twilio WhatsApp...");
    setTimeout(() => {
      setWhatsappStatus('connected');
      toast.success("WhatsApp Business connecté avec succès ! Envoi automatique des messages de confirmation activé.");
    }, 3000);
  };

  // Simulate an incoming patient call
  const triggerSimulatedCall = () => {
    if (!testPatientName) {
      toast.error("Veuillez entrer un nom de patient pour le test.");
      return;
    }
    setIsReceivingCall(true);
    setLiveLog(prev => [
      `📞 Appel entrant de ${testPatientName}...`,
      ...prev
    ]);

    setTimeout(() => {
      const timeStr = testPatientTime || '14:30';
      setLiveLog(prev => [
        `🤖 IA : "Bonjour ${testPatientName}, bienvenue au cabinet ${clinicData.clinicName}. Je vois qu'une place est disponible à ${timeStr}. Voulez-vous que je la réserve ?"`,
        `👤 Patient : "Oui merci, parfait pour moi !"`,
        `✅ Rendez-vous enregistré dans Firestore pour ${testPatientName} à ${timeStr}`,
        `💬 WhatsApp envoyé à ${whatsappNumber} : "Votre RDV est confirmé pour demain à ${timeStr}"`,
        ...prev
      ]);
      setIsReceivingCall(false);
      toast.success("L'appel test a été traité avec succès par l'IA !");
    }, 3000);
  };

  const completeOnboarding = () => {
    toast.success("Félicitations ! Votre cabinet est maintenant entièrement configuré et l'assistant IA est en ligne.");
    // Clear wizard state or redirect
    localStorage.removeItem('dentist_onboarding_wizard');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-6 rounded-2xl shadow-md border border-blue-600">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="bg-white/20 text-white font-extrabold px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider inline-flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-yellow-300 animate-bounce" /> Assistant Autopilot v2
            </span>
            <h1 className="text-2xl font-bold tracking-tight">Onboarding Express Dentiste</h1>
            <p className="text-sm text-blue-100 max-w-2xl leading-relaxed">
              Configurez votre réception intelligente autonome sans aucun développeur. Soyez prêt à recevoir des appels et à envoyer des confirmations automatisées en moins de 30 minutes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-black/20 text-blue-200 px-3 py-1 rounded-xl font-bold">
              Étape {currentStep} de 8
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Side: Step Indicator */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-1 self-start lg:col-span-1">
          <h2 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider px-3 pb-2 border-b border-slate-100">Plan de déploiement</h2>
          <div className="space-y-1 pt-2">
            {ONBOARDING_STEPS.map((step) => {
              const Icon = step.icon;
              const isCompleted = step.id < currentStep;
              const isActive = step.id === currentStep;
              
              return (
                <div 
                  key={step.id} 
                  className={`flex items-center gap-3 p-2 rounded-lg text-left transition-all ${
                    isActive ? 'bg-blue-50 text-blue-700 font-semibold' : ''
                  } ${isCompleted ? 'text-emerald-600' : 'text-slate-500'}`}
                >
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                    isActive ? 'bg-blue-600 text-white border-blue-600' :
                    isCompleted ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'
                  }`}>
                    {isCompleted ? <CheckCircle2 className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                  </div>
                  <div className="hidden md:block">
                    <p className="text-xs font-bold leading-tight">{step.title}</p>
                    <p className="text-[10px] text-slate-400">{step.subtitle}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Step Content Area */}
        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between min-h-[500px]">
          <div className="flex-1">
            
            {/* STEP 1: COMPTE & PROFIL */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                    <User className="h-5 w-5 text-blue-600" />
                    Profil Dentiste Principal
                  </h3>
                  <p className="text-xs text-slate-500">Créez votre profil de praticien pour guider l'intelligence artificielle lors des conversations.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase">Nom Complet du Praticien</label>
                    <input 
                      type="text"
                      value={accountData.dentistName}
                      onChange={(e) => setAccountData(prev => ({ ...prev, dentistName: e.target.value }))}
                      placeholder="Dr. Youssef El Alami"
                      className="mt-1 block w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase">Adresse Email Professionnelle</label>
                    <input 
                      type="email"
                      value={accountData.email}
                      onChange={(e) => setAccountData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="alami.dentaire@gmail.com"
                      className="mt-1 block w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase">Spécialité Principale</label>
                    <input 
                      type="text"
                      value={accountData.specialty}
                      onChange={(e) => setAccountData(prev => ({ ...prev, specialty: e.target.value }))}
                      placeholder="Chirurgie dentaire, Orthodontie, Implantologie..."
                      className="mt-1 block w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100/50 text-xs text-blue-800 leading-relaxed">
                  💡 <strong>Comment l'IA utilise ceci :</strong> Lorsque les patients appellent, l'assistant dira par exemple : <em>"Bonjour, vous êtes bien en relation avec l'assistant virtuel du cabinet du {accountData.dentistName}..."</em>
                </div>
              </div>
            )}

            {/* STEP 2: CABINET DENTAIRE */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    Informations du Cabinet Dentaire
                  </h3>
                  <p className="text-xs text-slate-500">Ces détails serviront à donner des instructions précises de localisation et de description aux patients.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase">Nom de la Clinique / Cabinet</label>
                    <input 
                      type="text"
                      value={clinicData.clinicName}
                      onChange={(e) => setClinicData(prev => ({ ...prev, clinicName: e.target.value }))}
                      placeholder="Clinique Smile & Art"
                      className="mt-1 block w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase">Ville d'implantation</label>
                    <select 
                      value={clinicData.city}
                      onChange={(e) => setClinicData(prev => ({ ...prev, city: e.target.value }))}
                      className="mt-1 block w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-sm focus:outline-none border"
                    >
                      <option value="Casablanca">Casablanca</option>
                      <option value="Rabat">Rabat</option>
                      <option value="Marrakech">Marrakech</option>
                      <option value="Tanger">Tanger</option>
                      <option value="Agadir">Agadir</option>
                      <option value="Fès">Fès</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase">Adresse Physique Complète</label>
                    <input 
                      type="text"
                      value={clinicData.address}
                      onChange={(e) => setClinicData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="12 Boulevard de la Résistance, 3ème étage"
                      className="mt-1 block w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-sm focus:outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase">Description du cabinet ou consignes d'accès</label>
                    <textarea 
                      rows={3}
                      value={clinicData.about}
                      onChange={(e) => setClinicData(prev => ({ ...prev, about: e.target.value }))}
                      placeholder="Par exemple : À côté de la pharmacie du Maârif, code interphone 2026."
                      className="mt-1 block w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-sm focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: WORKING HOURS */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    Horaires d'Ouverture & Consultations
                  </h3>
                  <p className="text-xs text-slate-500">L'IA de réception s'assurera de proposer des créneaux de rendez-vous uniquement sur ces heures d'ouverture.</p>
                </div>

                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  {Object.entries(workingDays).map(([day, schedule]: [string, any]) => (
                    <div key={day} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 border-b border-slate-100 last:border-0">
                      <div className="flex items-center gap-3">
                        <input 
                          type="checkbox"
                          id={day}
                          checked={schedule.active}
                          onChange={(e) => handleWorkingDayChange(day, 'active', e.target.checked)}
                          className="h-4.5 w-4.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                        />
                        <label htmlFor={day} className="text-sm font-semibold text-slate-700 uppercase pr-4 w-24 block">
                          {day === 'monday' ? 'Lundi' :
                           day === 'tuesday' ? 'Mardi' :
                           day === 'wednesday' ? 'Mercredi' :
                           day === 'thursday' ? 'Jeudi' :
                           day === 'friday' ? 'Vendredi' :
                           day === 'saturday' ? 'Samedi' : 'Dimanche'}
                        </label>
                      </div>

                      {schedule.active ? (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">De</span>
                          <input 
                            type="time"
                            value={schedule.start}
                            onChange={(e) => handleWorkingDayChange(day, 'start', e.target.value)}
                            className="rounded-lg border border-slate-300 py-1.5 px-3 text-xs bg-white focus:outline-none focus:border-blue-500"
                          />
                          <span className="text-xs text-slate-500">à</span>
                          <input 
                            type="time"
                            value={schedule.end}
                            onChange={(e) => handleWorkingDayChange(day, 'end', e.target.value)}
                            className="rounded-lg border border-slate-300 py-1.5 px-3 text-xs bg-white focus:outline-none focus:border-blue-500"
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-red-500 font-bold uppercase tracking-wider bg-red-50 border border-red-100 px-2.5 py-0.5 rounded-md">Fermé</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4: UPLOAD OR IMPORT SCHEDULE */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-blue-600" />
                    Charger ou Importer le Calendrier de Consultations
                  </h3>
                  <p className="text-xs text-slate-500">Pour éviter les doubles réservations, synchronisez votre calendrier existant.</p>
                </div>

                <div className="flex border border-slate-200 rounded-xl overflow-hidden p-1 bg-slate-50 gap-1">
                  <button
                    onClick={() => setImportMethod('google')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg cursor-pointer ${
                      importMethod === 'google' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-600 hover:bg-white/50'
                    }`}
                  >
                    🚀 Google Calendar (Recommandé)
                  </button>
                  <button
                    onClick={() => setImportMethod('upload')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg cursor-pointer ${
                      importMethod === 'upload' ? 'bg-white text-blue-600 shadow-sm border border-slate-200' : 'text-slate-600 hover:bg-white/50'
                    }`}
                  >
                    📂 Fichier Excel / CSV
                  </button>
                </div>

                {importMethod === 'google' && (
                  <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 flex flex-col items-center justify-center gap-4">
                    <div className="bg-blue-100 p-3.5 rounded-full text-blue-600">
                      <CalendarIcon className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-slate-800">Synchroniser avec Google Workspace</h4>
                      <p className="text-xs text-slate-500 max-w-md">L'IA chargera et synchronisera en temps réel vos disponibilités pour proposer des créneaux libres sans aucun doublon.</p>
                    </div>
                    <button 
                      onClick={handleImportGoogleCalendar}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-500 cursor-pointer shadow-sm"
                    >
                      <RefreshCw className="h-3.5 w-3.5 animate-spin-slow" />
                      Coupler l'agenda Google principal
                    </button>
                  </div>
                )}

                {importMethod === 'upload' && (
                  <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 flex flex-col items-center justify-center gap-4 relative">
                    <input 
                      type="file" 
                      accept=".csv, .xlsx, .xls"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="bg-indigo-100 p-3.5 rounded-full text-indigo-600">
                      <FileSpreadsheet className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-sm text-slate-800">Fichier Excel ou CSV de planning</h4>
                      <p className="text-xs text-slate-500 max-w-md">Glissez-déposez le fichier d'export de votre ancien logiciel de secrétariat dentaire pour peupler la base instantanément.</p>
                      {fileName && <p className="text-xs font-bold text-emerald-600 mt-2">Fichier sélectionné : {fileName}</p>}
                    </div>
                    <button className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer shadow-sm">
                      <Upload className="h-3.5 w-3.5" />
                      Sélectionner le fichier
                    </button>
                  </div>
                )}

                {isScheduleImported && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" /> Importation Complétée
                    </h4>
                    <div className="mt-2 space-y-1">
                      {importedEvents.map((evt, index) => (
                        <div key={index} className="flex justify-between text-xs text-emerald-900 border-b border-emerald-100/50 pb-1 last:border-0 last:pb-0">
                          <span>Patient: {evt.patient} ({evt.service})</span>
                          <span className="font-bold">🕒 {evt.date} à {evt.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 5: CHOOSE LANGUAGES */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-600" />
                    Langues d'Accueil de l'Assistant Vocal IA
                  </h3>
                  <p className="text-xs text-slate-500">L'assistant parlera automatiquement et adaptera sa tonalité selon la langue parlée par le patient.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* DARIJA */}
                  <div 
                    onClick={() => setLanguages(prev => ({ ...prev, darija: !prev.darija }))}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      languages.darija ? 'bg-blue-50/50 border-blue-300 shadow-sm' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🇲🇦</span>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">Darija Marocaine</h4>
                        <p className="text-[10px] text-slate-500">Le dialecte local marocain pour un accueil naturel.</p>
                      </div>
                    </div>
                    <input 
                      type="checkbox"
                      checked={languages.darija}
                      readOnly
                      className="h-4.5 w-4.5 text-blue-600 rounded border-slate-300"
                    />
                  </div>

                  {/* FRENCH */}
                  <div 
                    onClick={() => setLanguages(prev => ({ ...prev, french: !prev.french }))}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      languages.french ? 'bg-blue-50/50 border-blue-300 shadow-sm' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🇫🇷</span>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">Français</h4>
                        <p className="text-[10px] text-slate-500">Français fluide et professionnel.</p>
                      </div>
                    </div>
                    <input 
                      type="checkbox"
                      checked={languages.french}
                      readOnly
                      className="h-4.5 w-4.5 text-blue-600 rounded border-slate-300"
                    />
                  </div>

                  {/* ARABIC */}
                  <div 
                    onClick={() => setLanguages(prev => ({ ...prev, arabic: !prev.arabic }))}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      languages.arabic ? 'bg-blue-50/50 border-blue-300 shadow-sm' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🇲🇦</span>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">Arabe Classique</h4>
                        <p className="text-[10px] text-slate-500">Arabe officiel standard.</p>
                      </div>
                    </div>
                    <input 
                      type="checkbox"
                      checked={languages.arabic}
                      readOnly
                      className="h-4.5 w-4.5 text-blue-600 rounded border-slate-300"
                    />
                  </div>

                  {/* ENGLISH */}
                  <div 
                    onClick={() => setLanguages(prev => ({ ...prev, english: !prev.english }))}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      languages.english ? 'bg-blue-50/50 border-blue-300 shadow-sm' : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">🇬🇧</span>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">Anglais</h4>
                        <p className="text-[10px] text-slate-500">Anglais international pour les patients étrangers.</p>
                      </div>
                    </div>
                    <input 
                      type="checkbox"
                      checked={languages.english}
                      readOnly
                      className="h-4.5 w-4.5 text-blue-600 rounded border-slate-300"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 6: CONNECT PHONE NUMBER */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                    <Phone className="h-5 w-5 text-blue-600" />
                    Coupler le Numéro de Téléphone de la Clinique
                  </h3>
                  <p className="text-xs text-slate-500">Nous fournissons un numéro de redirection virtuel. Redirigez simplement les appels occupés ou non répondus vers celui-ci.</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase">Numéro Actuel de la Clinique</label>
                    <input 
                      type="text"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="+212 5 22 12 34 56"
                      className="mt-1 block w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-sm focus:outline-none"
                    />
                  </div>

                  <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                      <Smartphone className="h-4 w-4 text-blue-600" />
                      Numéro de Redirection Assistant IA :
                    </h4>
                    <p className="text-sm font-extrabold text-blue-800 tracking-wider mt-2 bg-blue-50 border border-blue-200 rounded-lg py-2.5 px-4 text-center">
                      +212 5 20 88 99 00
                    </p>
                    <p className="text-[11px] text-slate-500 mt-2.5 leading-relaxed">
                      📞 <strong>Consigne de routage de ligne :</strong> Composez simplement <code>*61*+212520889900#</code> depuis votre poste fixe IAM/Inwi/Orange pour rediriger automatiquement la ligne lorsque vous êtes déjà en ligne ou absent.
                    </p>
                  </div>

                  <div className="flex gap-4 items-center pt-2">
                    <button
                      onClick={startRoutingTest}
                      disabled={routingTestState === 'calling'}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                    >
                      {routingTestState === 'calling' ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Appel test en cours...
                        </>
                      ) : (
                        <>
                          <Volume2 className="h-3.5 w-3.5" />
                          Tester le routage d'appel
                        </>
                      )}
                    </button>
                    {isLineRedirected && (
                      <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-bold">
                        <CheckCircle2 className="h-4 w-4" /> Routage Validé
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 7: CONNECT WHATSAPP */}
            {currentStep === 7 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-emerald-600" />
                    Coupler Votre Numéro WhatsApp Business
                  </h3>
                  <p className="text-xs text-slate-500">Permettez à l'IA d'envoyer automatiquement des confirmations de rendez-vous et des fiches d'information par WhatsApp.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase">Numéro WhatsApp Business Clinic</label>
                      <input 
                        type="text"
                        value={whatsappNumber}
                        onChange={(e) => setWhatsappNumber(e.target.value)}
                        placeholder="+212 6 61 98 76 54"
                        className="mt-1 block w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-sm focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox"
                        id="auto_rem"
                        checked={enableAutoReminders}
                        onChange={(e) => setEnableAutoReminders(e.target.checked)}
                        className="h-4.5 w-4.5 text-blue-600 rounded border-slate-300"
                      />
                      <label htmlFor="auto_rem" className="text-xs font-semibold text-slate-700">
                        Envoyer automatiquement une confirmation par WhatsApp lors de la prise de RDV par l'IA
                      </label>
                    </div>

                    {whatsappStatus === 'disconnected' && (
                      <button
                        onClick={startPairingWhatsapp}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer"
                      >
                        <QrCode className="h-4 w-4" />
                        Générer Code d'Appairage QR
                      </button>
                    )}

                    {whatsappStatus === 'pairing' && (
                      <div className="flex items-center gap-2 text-xs font-bold text-yellow-600">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Génération du QR Code d'appairage Twilio...
                      </div>
                    )}

                    {whatsappStatus === 'connected' && (
                      <div className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2 text-xs font-bold text-emerald-800">
                        <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600" />
                        WhatsApp Business Couplé (+212 661-987654)
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center gap-3">
                    <div className="bg-white p-3 rounded-lg border shadow-sm">
                      <QrCode className="h-28 w-28 text-slate-800 animate-pulse" />
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">SCANNEZ AVEC VOTRE APPLICATION WHATSAPP</span>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 8: START RECEIVING CALLS */}
            {currentStep === 8 && (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                    <Play className="h-5 w-5 text-blue-600 animate-pulse" />
                    Lancement & Test de Votre Secrétariat Virtuel
                  </h3>
                  <p className="text-xs text-slate-500">Félicitations, tout est couplé ! Vous pouvez maintenant lancer un appel test de démonstration pour valider le fonctionnement en conditions réelles.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Test call form */}
                  <div className="space-y-4">
                    <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Simuler un appel patient en direct</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase">Nom du Patient fictif</label>
                        <input 
                          type="text"
                          value={testPatientName}
                          onChange={(e) => setTestPatientName(e.target.value)}
                          placeholder="Mourad Benjelloun"
                          className="mt-1 block w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-sm focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase">Heure souhaitée du RDV</label>
                        <input 
                          type="time"
                          value={testPatientTime}
                          onChange={(e) => setTestPatientTime(e.target.value)}
                          className="mt-1 block w-full rounded-lg border border-slate-300 bg-white py-2 px-3 text-sm focus:outline-none"
                        />
                      </div>
                      <button
                        onClick={triggerSimulatedCall}
                        disabled={isReceivingCall}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                      >
                        {isReceivingCall ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Simulation de l'appel vocal en cours...
                          </>
                        ) : (
                          <>
                            <PhoneCall className="h-4 w-4" />
                            Simuler Appel Entrant Patient
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Real-time system log output */}
                  <div className="bg-slate-950 text-slate-200 p-5 rounded-xl border border-slate-800 font-mono text-xs space-y-2 h-[260px] overflow-y-auto">
                    <h4 className="font-bold text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800 pb-1.5 flex justify-between">
                      <span>CONSOLE DE RÉCEPTION IA</span>
                      <span className="text-emerald-500 animate-pulse">● LIVE</span>
                    </h4>
                    <div className="space-y-1.5 pt-1">
                      {liveLog.map((log, i) => (
                        <p key={i} className="leading-relaxed">{log}</p>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 flex justify-center">
                  <button
                    onClick={completeOnboarding}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-500 shadow-lg cursor-pointer"
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    Valider le Déploiement & Commencer
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Action buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-slate-100 mt-8">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className={`inline-flex items-center gap-1 px-4 py-2 bg-white border rounded-xl text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer ${
                currentStep === 1 ? 'opacity-30 cursor-not-allowed' : ''
              }`}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Précédent
            </button>

            {currentStep < ONBOARDING_STEPS.length ? (
              <button
                onClick={handleNext}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-blue-500 transition-all cursor-pointer"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    Étape Suivante
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            ) : null}
          </div>

        </div>
      </div>
    </div>
  );
}
