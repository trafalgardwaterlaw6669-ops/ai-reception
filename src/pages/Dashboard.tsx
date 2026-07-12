import { useState, useEffect } from 'react';
import { 
  Calendar, 
  PhoneMissed, 
  TrendingUp, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  PhoneCall,
  MessageSquare,
  ShieldCheck,
  Moon,
  Sun,
  Zap,
  Brain,
  ArrowRight,
  Building2,
  RefreshCw,
  Globe,
  Radio,
  Check,
  Volume2,
  Flame,
  Sparkles,
  AlertTriangle,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GoogleTasksWidget } from "@/components/GoogleTasksWidget";
import { useClinics } from "@/context/ClinicContext";
import { SyncCenter } from "@/components/SyncCenter";
import { toast } from 'sonner';
import { Link } from 'react-router';
import { db } from '@/lib/firebase';
import { collection, onSnapshot } from 'firebase/firestore';

const chartData = [
  { name: 'Mon', calls: 4 },
  { name: 'Tue', calls: 7 },
  { name: 'Wed', calls: 5 },
  { name: 'Thu', calls: 8 },
  { name: 'Fri', calls: 12 },
  { name: 'Sat', calls: 3 },
  { name: 'Sun', calls: 2 },
];

export function Dashboard() {
  const [isClinicClosed, setIsClinicClosed] = useState(false);
  const { currentClinic, clinics, isSyncing, lastSynced, triggerGlobalSync, syncLogs } = useClinics();

  const [patients, setPatients] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [callLogs, setCallLogs] = useState<any[]>([]);
  const [isTriageRunning, setIsTriageRunning] = useState(false);

  // Real-time subscriptions for the Triage Queue
  useEffect(() => {
    const unsubPatients = onSnapshot(collection(db, 'patients'), (snap) => {
      setPatients(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubMessages = onSnapshot(collection(db, 'messages'), (snap) => {
      setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    const unsubCalls = onSnapshot(collection(db, 'callLogs'), (snap) => {
      setCallLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubPatients();
      unsubMessages();
      unsubCalls();
    };
  }, []);

  const handleRunBulkTriage = async () => {
    setIsTriageRunning(true);
    toast.loading("Analyse sémantique et triage par Gemini en cours...", { id: 'bulk-triage' });
    try {
      const res = await fetch('/api/triage/classify-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Triage complété ! ${data.classifiedCount} éléments triés avec succès.`, { id: 'bulk-triage' });
      } else {
        toast.error("Échec du triage.", { id: 'bulk-triage' });
      }
    } catch (err) {
      console.error(err);
      toast.error("Impossible de joindre le serveur de triage.", { id: 'bulk-triage' });
    } finally {
      setIsTriageRunning(false);
    }
  };

  const handleMarkAsHandled = async (item: any) => {
    const { doc, updateDoc } = await import("firebase/firestore");
    try {
      const collectionName = item.type === 'message' ? 'messages' : 'callLogs';
      const docRef = doc(db, collectionName, item.id);
      await updateDoc(docRef, {
        triageHandled: true
      });
      toast.success("Demande marquée comme traitée ! Retirée de la file d'attente.");
    } catch (err) {
      console.error(err);
      toast.error("Erreur de mise à jour.");
    }
  };

  const getTriageQueue = () => {
    const queue: any[] = [];

    // 1. Inbound messages
    messages.forEach(msg => {
      if (msg.direction === 'inbound' && !msg.triageHandled) {
        const patient = patients.find(p => p.id === msg.patientId);
        queue.push({
          id: msg.id,
          type: 'message',
          patientId: msg.patientId,
          patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Patient Inconnu',
          patientPhone: patient ? patient.phone : '',
          timestamp: msg.timestamp,
          content: msg.content,
          triageCategory: msg.triageCategory || null,
          triageReason: msg.triageReason || null,
          status: msg.status
        });
      }
    });

    // 2. Call logs
    callLogs.forEach(call => {
      if (!call.triageHandled) {
        const patient = patients.find(p => p.id === call.patientId);
        queue.push({
          id: call.id,
          type: 'call',
          patientId: call.patientId,
          patientName: patient ? `${patient.firstName} ${patient.lastName}` : (call.patientName || 'Appelant Inconnu'),
          patientPhone: patient ? patient.phone : (call.phone || ''),
          timestamp: call.date,
          content: call.summary || 'Appel vocal traité par l\'IA',
          triageCategory: call.triageCategory || null,
          triageReason: call.triageReason || null,
          status: call.status
        });
      }
    });

    return queue.sort((a, b) => {
      const priorityMap: Record<string, number> = {
        'Urgent/Emergency': 3,
        'Routine': 2,
        'General Inquiry': 1,
      };

      const priorityA = a.triageCategory ? (priorityMap[a.triageCategory] || 0) : -1;
      const priorityB = b.triageCategory ? (priorityMap[b.triageCategory] || 0) : -1;

      if (priorityA !== priorityB) {
        return priorityB - priorityA;
      }

      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  };

  const triageQueue = getTriageQueue();

  // Dynamic clinic-specific statistics calculation
  const getStats = () => {
    if (currentClinic) {
      const todayCount = currentClinic.id === 'maarif' ? 3 : currentClinic.id === 'agdal' ? 2 : 1;
      return [
        { name: "Rendez-vous du jour", value: todayCount.toString(), icon: Calendar, change: 'Synchro active', changeType: 'increase' },
        { name: 'Taux de réponse IA', value: '100%', icon: ShieldCheck, change: '0 manqué', changeType: 'increase' },
        { name: 'Messages vocaux évités', value: currentClinic.aiVoicemailBypassCount.toString(), icon: PhoneCall, change: '100% sauvés', changeType: 'increase' },
        { name: 'Revenu mensuel estimé', value: `${currentClinic.monthlyRevenue.toLocaleString()} $`, icon: TrendingUp, change: `Site ${currentClinic.city}`, changeType: 'increase' },
      ];
    }

    // Aggregated All-Clinic Unified Stats
    const totalVoicemails = clinics.reduce((acc, c) => acc + c.aiVoicemailBypassCount, 0);
    const totalRevenue = clinics.reduce((acc, c) => acc + c.monthlyRevenue, 0);
    const totalAppointments = 6; // Casablanca: 3 + Rabat: 2 + Marrakech: 1

    return [
      { name: "Rendez-vous unifiés", value: totalAppointments.toString(), icon: Calendar, change: '+6 multisites', changeType: 'increase' },
      { name: 'Taux de réponse IA unifié', value: '100%', icon: ShieldCheck, change: 'Sur 3 nœuds', changeType: 'increase' },
      { name: 'Messagerie vocale contournée', value: totalVoicemails.toString(), icon: PhoneCall, change: 'Toutes lignes actives', changeType: 'increase' },
      { name: 'Revenu du groupe unifié', value: `${totalRevenue.toLocaleString()} $`, icon: TrendingUp, change: 'Maârif + Agdal + Guéliz', changeType: 'increase' },
    ];
  };

  const stats = getStats();
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {currentClinic ? `${currentClinic.name}` : "Groupe de Pratiques Centralisé"}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {currentClinic ? `Nœud de ${currentClinic.city} • Flux d'IA local` : "Tableau de bord unifié • 3 cliniques synchronisées"}
          </p>
        </div>
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            <span className="mr-1.5 h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
            Réceptionniste IA Active (24h/24, 7j/7)
          </span>
        </div>
      </div>

      {/* Premium Onboarding Express Launcher Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white rounded-2xl p-5 shadow-sm border border-blue-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 text-white font-extrabold px-2 py-0.5 rounded text-[9px] uppercase tracking-wider inline-flex items-center gap-1">
              🚀 AUCUN DÉVELOPPEUR REQUIS
            </span>
            <span className="text-xs font-semibold text-blue-100">Configurez tout en moins de 30 minutes !</span>
          </div>
          <h2 className="text-base font-bold">Lancez votre réceptionniste dentaire autonome 24h/24 & 7j/7</h2>
          <p className="text-xs text-blue-100 max-w-2xl leading-relaxed">
            Créez votre compte, saisissez les détails de la clinique, définissez vos horaires, connectez WhatsApp et le routage téléphonique, importez votre calendrier et commencez à recevoir des réservations en temps réel.
          </p>
        </div>
        <Link
          to="/onboarding"
          className="flex-none inline-flex items-center gap-1.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 px-4.5 py-2.5 text-xs font-extrabold shadow-sm transition-all active:scale-95 whitespace-nowrap cursor-pointer"
        >
          Démarrer l'assistant d'intégration <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div key={item.name} className="overflow-hidden rounded-xl bg-white px-4 py-5 shadow-sm border border-slate-200 sm:p-6 transition-all hover:shadow-md">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md bg-blue-50 p-3">
                <item.icon className="h-6 w-6 text-blue-600" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="truncate text-sm font-medium text-slate-500">{item.name}</dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-slate-900">{item.value}</div>
                    <div className={cn(
                      item.changeType === 'increase' ? 'text-green-600' : 'text-red-600',
                      'ml-2 flex items-baseline text-sm font-semibold'
                    )}>
                      {item.change}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* High-priority Dentist Voice Notes Quick Alert */}
      <div className="bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-2xl p-5 shadow-lg border border-red-400 relative overflow-hidden animate-pulse">
        <div className="absolute right-0 top-0 bottom-0 opacity-15 flex items-center justify-center pointer-events-none pr-8">
          <Volume2 className="h-44 w-44 rotate-12 text-white" />
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="bg-white/20 text-white font-extrabold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider inline-flex items-center gap-1">
                <Flame className="h-3 w-3 text-yellow-300 fill-yellow-300 animate-bounce" /> INTERCEPTION D'URGENCE PRIORITAIRE
              </span>
              <span className="text-xs font-semibold text-rose-100 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-yellow-300 animate-ping" />
                Préparé à l'instant par la Réceptionniste IA
              </span>
            </div>
            <h3 className="text-lg font-bold">Briefing vocal de 10 secondes prêt : Jean-Pierre Dupont</h3>
            <p className="text-xs text-rose-100 max-w-3xl leading-relaxed">
              <strong>Patient :</strong> Douleur intense molaire supérieure • <strong>Horaire :</strong> Demain après-midi • <strong>Allergies :</strong> Alerte Pénicilline enregistrée • <strong>Préfère :</strong> Français
            </p>
          </div>
          <Link
            to="/dentist-voice-notes"
            className="flex-none inline-flex items-center gap-2 rounded-xl bg-white text-rose-700 hover:bg-rose-50 px-4.5 py-3 text-xs font-bold shadow-md transition-all active:scale-95 whitespace-nowrap cursor-pointer"
          >
            <Volume2 className="h-4 w-4 animate-bounce" /> Écouter le résumé (10s)
          </Link>
        </div>
      </div>

      {/* AI Automatic Waitlist Quick Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 to-indigo-500/10 border border-amber-500/20 rounded-2xl p-5 shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1 text-left">
            <div className="flex items-center gap-2">
              <span className="bg-amber-100 text-amber-800 border border-amber-200 font-extrabold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider inline-flex items-center gap-1">
                <Zap className="h-3 w-3 text-amber-600 fill-amber-500" /> Dispatch Liste d'Attente Active
              </span>
              <span className="text-xs font-semibold text-indigo-700">Rempli instantanément en cas d'annulation</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">Remplisseur Automatique d'Annulations</h3>
            <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
              Lorsqu'un créneau est annulé, l'IA analyse les profils des candidats (préférences, gravité) et lance une attribution simultanée premier-arrivé, premier-servi.
            </p>
          </div>
          <Link
            to="/waitlist"
            className="flex-none inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 text-xs font-bold shadow-sm transition-all active:scale-95 whitespace-nowrap cursor-pointer"
          >
            Simuler la liste d'attente <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* AI Clinic Intelligence Insights Banner */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-100">
                <Brain className="mr-1.5 h-4 w-4 text-blue-600 animate-pulse" />
                Alerte de l'Analyste IA en Chef
              </span>
              <span className="text-xs font-medium text-slate-500">"Analyse rarement faite par des humains."</span>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900">Résumé Hebdomadaire d'Intelligence Clinique</h3>
              <p className="text-sm text-slate-500 max-w-4xl">
                Notre système a évalué les créneaux planifiés, les marges de procédure et les goulets d'étranglement pour révéler des optimisations stratégiques.
              </p>
            </div>

            {/* Core Insights List */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-1">
              <div className="p-3 bg-red-50/50 rounded-xl border border-red-100 text-left">
                <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block mb-1">Friction du Lundi</span>
                <p className="text-xs font-bold text-slate-900">"La plupart des annulations ont lieu le lundi."</p>
              </div>
              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-left">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block mb-1">Marges Procédures</span>
                <p className="text-xs font-bold text-slate-900">"Les implants génèrent 40 % des revenus."</p>
              </div>
              <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 text-left">
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block mb-1">Coût des Absences</span>
                <p className="text-xs font-bold text-slate-900">"Vous perdez 17 heures/mois en rendez-vous non honorés."</p>
              </div>
              <div className="p-3 bg-green-50/50 rounded-xl border border-green-100 text-left">
                <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider block mb-1">Demande Latente</span>
                <p className="text-xs font-bold text-slate-900">"Vous devriez prolonger les heures du jeudi."</p>
              </div>
            </div>
          </div>

          <div className="shrink-0 w-full lg:w-auto self-stretch lg:self-auto flex items-center">
            <Link 
              to="/analytics" 
              className="w-full text-center inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm px-5 py-3.5 shadow-sm transition-all active:scale-95"
            >
              Analyser les recommandations
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* 24/7 AI Receptionist & Voicemail Bypass Banner */}
      <div className={cn(
        "rounded-2xl border p-6 transition-all duration-300 shadow-sm",
        isClinicClosed 
          ? "bg-slate-950 text-white border-slate-800" 
          : "bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100 text-slate-900"
      )}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <span className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wider uppercase",
                isClinicClosed ? "bg-indigo-500/20 text-indigo-300" : "bg-blue-100 text-blue-800"
              )}>
                <span className="relative flex h-2 w-2 mr-1.5">
                  <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", isClinicClosed ? "bg-indigo-400" : "bg-blue-500")} />
                  <span className={cn("relative inline-flex rounded-full h-2 w-2", isClinicClosed ? "bg-indigo-400" : "bg-blue-500")} />
                </span>
                {isClinicClosed ? "Mode Autopilote (En dehors des heures)" : "Mode Assistant (Heures de bureau)"}
              </span>
              <span className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                isClinicClosed ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20" : "bg-green-50 text-green-700 ring-green-600/20"
              )}>
                <ShieldCheck className="h-3 w-3 animate-pulse" /> Appels manqués : 0%
              </span>
            </div>
            <h2 className={cn("text-xl font-bold tracking-tight", isClinicClosed ? "text-white" : "text-slate-900")}>
              Les appels manqués n'existent plus.
            </h2>
            <p className={cn("text-sm max-w-2xl leading-relaxed", isClinicClosed ? "text-slate-300" : "text-slate-600")}>
              {isClinicClosed 
                ? "La clinique physique est actuellement fermée. L'agent IA de Google (Gemini) du Dr Smith répond activement aux appels entrants, traite les demandes des patients et réserve des rendez-vous en temps réel. La messagerie vocale est complètement évitée pour que les patients n'entendent jamais de bip."
                : "Votre clinique physique est ouverte et accueille les patients. L'agent IA reste en attente sur les lignes secondaires pour intercepter les débordements, les signaux d'occupation ou les appels manqués, y répondant en moins d'une sonnerie. Votre accueil affiche un taux de réponse parfait de 100%."
              }
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
            {/* Simulation Switcher */}
            <div className={cn(
              "flex items-center justify-between gap-3 p-2.5 rounded-xl border",
              isClinicClosed ? "bg-slate-900 border-slate-800" : "bg-white border-blue-200"
            )}>
              <div className="text-left pr-4">
                <span className={cn("text-[10px] font-bold uppercase tracking-wider block", isClinicClosed ? "text-slate-400" : "text-slate-500")}>
                  Statut Clinique
                </span>
                <span className="text-xs font-semibold">
                  {isClinicClosed ? "Fermé (Nuit/Weekend)" : "Ouvert (Heures de bureau)"}
                </span>
              </div>
              <button 
                type="button"
                onClick={() => {
                  const newClosed = !isClinicClosed;
                  setIsClinicClosed(newClosed);
                  toast.success(newClosed ? "La clinique est maintenant FERMÉE. L'IA est passée en mode Autopilote 24h/24 & 7j/7 !" : "La clinique est maintenant OUVERTE. L'IA est passée en mode Assistant !");
                }}
                className={cn(
                  "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                  isClinicClosed ? "bg-indigo-600" : "bg-slate-200"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out flex items-center justify-center",
                    isClinicClosed ? "translate-x-5" : "translate-x-0"
                  )}
                >
                  {isClinicClosed ? <Moon className="h-3 w-3 text-indigo-600" /> : <Sun className="h-3 w-3 text-amber-500" />}
                </span>
              </button>
            </div>

            {/* Test Call Trigger CTA */}
            <button
              onClick={() => {
                toast.info("Utilisez le bouton vert 'Démarrer l'appel IA' en bas à droite pour simuler un appel entrant !");
              }}
              className={cn(
                "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-sm transition-all active:scale-95",
                isClinicClosed 
                  ? "bg-white text-slate-900 hover:bg-slate-50" 
                  : "bg-blue-600 text-white hover:bg-blue-500"
              )}
            >
              <Zap className="h-4 w-4 text-amber-400 fill-amber-400 animate-bounce" />
              Simuler un appel 24/7
            </button>
          </div>
        </div>
      </div>

      {/* Automated Triage Priority Queue (Gemini-Powered) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md text-left">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Activity className="h-5 w-5 text-red-500 animate-pulse" />
              File de Triage IA Prioritaire
              <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700 ring-1 ring-inset ring-indigo-700/10 gap-1">
                <Sparkles className="h-3 w-3 text-indigo-500 fill-indigo-400" /> Powered by Gemini
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Analyse et priorise automatiquement les messages patients et appels entrants pour optimiser le temps clinique.
            </p>
          </div>
          <button
            onClick={handleRunBulkTriage}
            disabled={isTriageRunning}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 text-xs font-bold transition-all active:scale-95 disabled:opacity-50 cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isTriageRunning && "animate-spin")} />
            Lancer le Triage Global
          </button>
        </div>

        {triageQueue.length === 0 ? (
          <div className="py-10 text-center flex flex-col items-center justify-center text-slate-500">
            <CheckCircle2 className="h-12 w-12 text-green-400 mb-3" />
            <p className="font-semibold text-slate-800 text-sm">Toutes les urgences sont traitées !</p>
            <p className="text-xs text-slate-400 mt-1">La file d'attente de triage est actuellement vide.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead>
                <tr className="text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Patient / Canal</th>
                  <th className="pb-3 font-semibold">Message ou Synthèse</th>
                  <th className="pb-3 font-semibold">Statut Triage IA</th>
                  <th className="pb-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {triageQueue.map((item) => {
                  const dateStr = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const isUrgent = item.triageCategory === 'Urgent/Emergency';
                  const isRoutine = item.triageCategory === 'Routine';
                  const isGeneral = item.triageCategory === 'General Inquiry';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                      {/* Patient / Channel */}
                      <td className="py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "p-2 rounded-xl shrink-0",
                            item.type === 'message' ? "bg-emerald-50 text-emerald-600" : "bg-blue-50 text-blue-600"
                          )}>
                            {item.type === 'message' ? (
                              <MessageSquare className="h-4.5 w-4.5" />
                            ) : (
                              <PhoneCall className="h-4.5 w-4.5" />
                            )}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">{item.patientName}</div>
                            <div className="text-xs text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                              <span>{item.patientPhone}</span>
                              <span>•</span>
                              <span>{dateStr}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Content / Snippet */}
                      <td className="py-4 pr-4 max-w-md">
                        <p className="text-sm text-slate-700 font-medium line-clamp-1">{item.content}</p>
                        {item.triageReason && (
                          <p className="text-xs text-slate-500 font-medium mt-1 italic flex items-center gap-1">
                            <Brain className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                            <span>Analyse : "{item.triageReason}"</span>
                          </p>
                        )}
                      </td>

                      {/* Triage Category */}
                      <td className="py-4 whitespace-nowrap">
                        {item.triageCategory ? (
                          <span className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold border gap-1.5",
                            isUrgent && "bg-red-50 text-red-700 border-red-200/60",
                            isRoutine && "bg-indigo-50 text-indigo-700 border-indigo-200/60",
                            isGeneral && "bg-slate-50 text-slate-700 border-slate-200/60"
                          )}>
                            {isUrgent && (
                              <>
                                <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse shrink-0"></span>
                                Urgent / Urgence
                              </>
                            )}
                            {isRoutine && "Soins Routiniers"}
                            {isGeneral && "Renseignement Général"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-200 animate-pulse gap-1.5">
                            <RefreshCw className="h-3 w-3 animate-spin shrink-0" />
                            Analyse en cours...
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={item.type === 'message' ? "/messages" : "/calls"}
                            className="inline-flex items-center justify-center rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs px-3 py-1.5 hover:bg-slate-100 transition-all cursor-pointer"
                          >
                            Prendre la main
                          </Link>
                          <button
                            onClick={() => handleMarkAsHandled(item)}
                            className="inline-flex items-center justify-center rounded-lg bg-green-50 border border-green-200 text-green-700 font-bold text-xs px-3 py-1.5 hover:bg-green-100 transition-all cursor-pointer"
                            title="Marquer comme traité"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl bg-white shadow-sm border border-slate-200">
          <div className="border-b border-slate-200 px-4 py-5 sm:px-6">
            <h3 className="text-base font-semibold leading-6 text-slate-900">Volume d'appels hebdomadaire (géré par l'IA)</h3>
          </div>
          <div className="px-4 py-5 sm:p-6 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCalls" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#0f172a', fontWeight: 500 }}
                />
                <Area type="monotone" dataKey="calls" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorCalls)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl bg-white shadow-sm border border-slate-200">
          <div className="border-b border-slate-200 px-4 py-5 sm:px-6">
            <h3 className="text-base font-semibold leading-6 text-slate-900">Activité IA Récente</h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <ul className="space-y-4">
              <li className="flex gap-4">
                <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                  <PhoneCall className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Appel traité : Sara Ahmed</p>
                  <p className="text-sm text-slate-500">A réservé une consultation pour demain à 10h00. S'est exprimée en Darija marocain.</p>
                  <p className="text-xs text-slate-400 mt-1">Il y a 10 min</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                  <MessageSquare className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Message WhatsApp envoyé</p>
                  <p className="text-sm text-slate-500">Rappel envoyé à 5 patients pour leurs rendez-vous de demain.</p>
                  <p className="text-xs text-slate-400 mt-1">Il y a 45 min</p>
                </div>
              </li>
              <li className="flex gap-4">
                <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900">Annulation gérée</p>
                  <p className="text-sm text-slate-500">Karim a annulé son créneau de 14h00. L'IA a proposé le créneau à la liste d'attente.</p>
                  <p className="text-xs text-slate-400 mt-1">Il y a 2 heures</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Multi-clinic Central Sync Board */}
        <div className="lg:col-span-3">
          <SyncCenter />
        </div>

        {/* Google Tasks */}
        <div className="lg:col-span-3">
          <GoogleTasksWidget />
        </div>

        {/* Upcoming Appointments */}
        <div className="rounded-xl bg-white shadow-sm border border-slate-200 lg:col-span-3">
          <div className="border-b border-slate-200 px-4 py-5 sm:px-6 flex justify-between items-center bg-slate-50/30">
            <div>
              <h3 className="text-base font-semibold leading-6 text-slate-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                Prochains Rendez-vous
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Mesures de risque d'absence calculées pour les rendez-vous à venir.</p>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/predictions" className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 border border-blue-100 hover:bg-blue-100 transition-colors">
                <Brain className="h-3.5 w-3.5" />
                Gérer le prédicteur de No-Show
              </Link>
              <button className="text-sm text-slate-500 hover:text-slate-700 font-medium">Voir le calendrier</button>
            </div>
          </div>

          {/* AI Interception Alert Banner */}
          <div className="px-4 py-3 bg-amber-50 border-b border-amber-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <span>Alerte IA : Risque élevé de non-présentation détecté sur 2 créneaux à venir (Sara Ahmed à 83% & Karim Tazi à 91%).</span>
            </div>
            <div className="inline-flex items-center gap-1.5 bg-green-100 text-green-800 px-2 py-0.5 rounded font-bold uppercase tracking-wide">
              Re-confirmation auto active
            </div>
          </div>

          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { type: 'Traitement de canal', date: '2026-07-01T14:00:00Z', status: 'Confirmé', patient: 'Youssef Benali', risk: 4 },
                { type: 'Consultation', date: '2026-07-01T15:30:00Z', status: 'Non-confirmé', patient: 'Sara Ahmed', risk: 83 },
                { type: 'Détartrage', date: '2026-07-02T10:00:00Z', status: 'Non-confirmé', patient: 'Karim Tazi', risk: 91 }
              ].map((apt, i) => (
                <div key={i} className="flex flex-col justify-between border border-slate-200 rounded-lg p-4 hover:shadow-sm transition-all bg-slate-50/50 gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="text-sm font-bold text-slate-700 w-12">{new Date(apt.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{apt.patient}</p>
                        <p className="text-xs text-slate-500">{apt.type}</p>
                      </div>
                    </div>
                    <div>
                      {apt.status === 'Confirmé' ? (
                        <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                          <CheckCircle2 className="mr-1 h-3 w-3" /> Confirmé
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-md bg-yellow-50 px-2 py-0.5 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                          <Clock className="mr-1 h-3 w-3" /> Non-confirmé
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* No-show Prediction probability bar */}
                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                      <Brain className="h-3 w-3 text-blue-500" /> Risque de No-Show :
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-slate-200/60 rounded-full h-1.5 overflow-hidden">
                        <div className={cn(
                          "h-full",
                          apt.risk > 70 ? "bg-red-500" : apt.risk > 40 ? "bg-yellow-500" : "bg-green-500"
                        )} style={{ width: `${apt.risk}%` }} />
                      </div>
                      <span className={cn(
                        "text-xs font-extrabold",
                        apt.risk > 70 ? "text-red-600" : apt.risk > 40 ? "text-yellow-600" : "text-green-600"
                      )}>{apt.risk}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
