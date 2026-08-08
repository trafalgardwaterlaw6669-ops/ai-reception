import React, { useState, useEffect, useRef } from 'react';
import { 
  Brain, 
  Bot, 
  Sparkles, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Volume2, 
  MessageSquare, 
  Calendar, 
  User, 
  Check, 
  Zap, 
  Search, 
  Smile, 
  Heart,
  CalendarDays,
  FileText,
  Clock,
  ArrowRight,
  Shield,
  Send,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { mockPatients } from '@/data/mockDb';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, addDoc, doc, deleteDoc, setDoc, writeBatch } from 'firebase/firestore';

interface MemoryPreference {
  id: string;
  patientId: string;
  patientName: string;
  preferenceText: string;
  category: 'Scheduling' | 'Communication' | 'Clinical/Care' | 'Special Needs' | 'Family';
  extractedFrom: string; 
  confidenceScore: number; 
  timestamp: string;
}

export function AiMemory() {
  const [memories, setMemories] = useState<MemoryPreference[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');

  // Form states
  const [newPatientId, setNewPatientId] = useState('');
  const [newPreferenceText, setNewPreferenceText] = useState('');
  const [newCategory, setNewCategory] = useState<'Scheduling' | 'Communication' | 'Clinical/Care' | 'Special Needs' | 'Family'>('Scheduling');
  const [newExtractedFrom, setNewExtractedFrom] = useState('Note saisie par le personnel');

  // Simulator states
  const [simPatientId, setSimPatientId] = useState('pat_1'); 
  const [simAction, setSimAction] = useState<'schedule_morning' | 'send_sms' | 'schedule_standard' | 'call_patient'>('schedule_morning');
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<{
    status: 'blocked' | 'adapted' | 'passed';
    message: string;
    actionTaken: string;
    details: string;
  } | null>(null);

  // AI Extraction Sandbox states
  const [sandboxTranscript, setSandboxTranscript] = useState(
    "Patient : \"Écoutez, mon audition n'est pas très bonne. De plus, mon fils m'accompagne toujours à ces rendez-vous parce que je m'embrouille un peu tout seul. Oh, et s'il vous plaît, appelez-moi au lieu de m'envoyer des SMS. De toute façon, je ne regarde jamais mon téléphone.\""
  );
  const [extractionState, setExtractionState] = useState<'idle' | 'processing' | 'completed'>('idle');
  const [extractedItems, setExtractedItems] = useState<{ text: string; cat: string; conf: number }[]>([]);

  // Seed default preferences if database is empty
  const handleSeedMemories = async () => {
    try {
      setLoading(true);
      const batch = writeBatch(db);
      const memoriesCol = collection(db, 'aiMemories');

      const seedData: Omit<MemoryPreference, 'id'>[] = [
        {
          patientId: 'pat_1',
          patientName: 'Youssef Benali',
          preferenceText: 'Je déteste les rendez-vous le matin.',
          category: 'Scheduling',
          extractedFrom: 'Transcription d\'appel IA (28 Juin)',
          confidenceScore: 99,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
        },
        {
          patientId: 'pat_1',
          patientName: 'Youssef Benali',
          preferenceText: "Mon audition n'est pas très bonne.",
          category: 'Special Needs',
          extractedFrom: 'Reconnaissance vocale interactive',
          confidenceScore: 95,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
        },
        {
          patientId: 'pat_2',
          patientName: 'Sara Ahmed',
          preferenceText: 'S\'il vous plaît, appelez au lieu d\'envoyer des SMS.',
          category: 'Communication',
          extractedFrom: 'Moteur d\'extraction automatique de SMS',
          confidenceScore: 98,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString()
        },
        {
          patientId: 'pat_2',
          patientName: 'Sara Ahmed',
          preferenceText: 'Mon fils m\'accompagne toujours.',
          category: 'Family',
          extractedFrom: 'Chat de consultation WhatsApp',
          confidenceScore: 97,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
        },
        {
          patientId: 'pat_husband',
          patientName: 'Khalid Alami',
          preferenceText: 'Mon anxiété est très élevée.',
          category: 'Clinical/Care',
          extractedFrom: 'Note d\'accueil clinique du cabinet',
          confidenceScore: 94,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
        }
      ];

      seedData.forEach(data => {
        const docRef = doc(memoriesCol);
        batch.set(docRef, data);
      });

      await batch.commit();
      console.log("Registre de mémoire IA pré-rempli automatiquement !");
    } catch (err) {
      console.error("Error seeding AI memories: ", err);
    } finally {
      setLoading(false);
    }
  };

  // Listen to Firestore memories
  useEffect(() => {
    const q = query(collection(db, 'aiMemories'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setMemories([]);
        setLoading(false);
        return;
      }
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MemoryPreference[];
      
      fetched.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setMemories(fetched);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching AI memories: ", error);
      toast.error("Échec du chargement des mémoires IA.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientId) {
      toast.error("Veuillez sélectionner un patient");
      return;
    }
    if (!newPreferenceText.trim()) {
      toast.error("Le texte de préférence ne peut pas être vide");
      return;
    }

    const patient = mockPatients.find(p => p.id === newPatientId);
    if (!patient) return;

    try {
      const memoryData: Omit<MemoryPreference, 'id'> = {
        patientId: newPatientId,
        patientName: `${patient.firstName} ${patient.lastName}`,
        preferenceText: newPreferenceText.trim(),
        category: newCategory,
        extractedFrom: newExtractedFrom,
        confidenceScore: 95,
        timestamp: new Date().toISOString()
      };

      await addDoc(collection(db, 'aiMemories'), memoryData);
      toast.success(`Mémoire IA enregistrée pour ${patient.firstName} !`);
      setNewPreferenceText('');
    } catch (err) {
      console.error("Error adding AI Memory:", err);
      toast.error("Échec de l'enregistrement de la mémoire.");
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'aiMemories', id));
      toast.info("Mémoire IA supprimée avec succès.");
    } catch (err) {
      console.error("Error deleting AI Memory:", err);
      toast.error("Échec de la suppression.");
    }
  };

  // Run preference alert simulator (Never Ask Twice)
  const handleRunSimulation = () => {
    const patient = mockPatients.find(p => p.id === simPatientId);
    if (!patient) return;

    setSimulating(true);
    setSimulationLogs([]);
    setSimulationResult(null);

    const patientMemories = memories.filter(m => m.patientId === simPatientId);

    setTimeout(() => {
      setSimulationLogs(prev => [...prev, `[INIT] Agent IA principal chargé pour le patient : ${patient.firstName} ${patient.lastName}`]);
    }, 300);

    setTimeout(() => {
      setSimulationLogs(prev => [...prev, `[CRITICAL] Analyse du registre de mémoire IA... ${patientMemories.length} préférences actives trouvées.`]);
    }, 1000);

    setTimeout(() => {
      let status: 'blocked' | 'adapted' | 'passed' = 'passed';
      let message = '';
      let actionTaken = '';
      let details = '';

      if (simAction === 'schedule_morning') {
        const morningPref = patientMemories.find(m => 
          m.preferenceText.toLowerCase().includes('matin') || 
          m.preferenceText.toLowerCase().includes('morning') || 
          m.preferenceText.toLowerCase().includes('déteste le matin')
        );
        if (morningPref) {
          status = 'blocked';
          message = `Garde-fou IA activé : ${patient.firstName} refuse catégoriquement les créneaux du matin.`;
          actionTaken = 'REPLANIFICATION AUTOMATIQUE EN APRÈS-MIDI (14h30)';
          details = `Règle enfreinte : "${morningPref.preferenceText}". Politique : Ne jamais demander deux fois. Créneau réorganisé instantanément.`;
        } else {
          status = 'passed';
          message = "Aucune restriction de planification matinale trouvée. Créneau approuvé.";
          actionTaken = 'PLANIFIÉ À 9h00';
          details = 'Rendez-vous confirmé avec succès sans chevauchement de préférence.';
        }
      } else if (simAction === 'send_sms') {
        const communicationPref = patientMemories.find(m => 
          m.preferenceText.toLowerCase().includes('appel') || 
          m.preferenceText.toLowerCase().includes('call') || 
          m.preferenceText.toLowerCase().includes('texting') || 
          m.preferenceText.toLowerCase().includes('sms')
        );
        if (communicationPref) {
          status = 'adapted';
          message = `Moteur de communication IA : Le patient exige des appels téléphoniques directs.`;
          actionTaken = 'RE-ROUTAGE AUTOMATIQUE VERS APPEL VOCAL INTERACTIF';
          details = `Consigne détectée : "${communicationPref.preferenceText}". Pour éviter d'irriter le patient, le système génère un appel automatique par synthèse vocale plutôt qu'un SMS.`;
        } else {
          status = 'passed';
          message = "Envoi de SMS approuvé. Message WhatsApp standard expédié.";
          actionTaken = 'SMS WHATSAPP EXPÉDIÉ';
          details = 'Délivré à la passerelle de messagerie.';
        }
      } else if (simAction === 'call_patient') {
        const hearingPref = patientMemories.find(m => 
          m.preferenceText.toLowerCase().includes('audition') || 
          m.preferenceText.toLowerCase().includes('hearing') || 
          m.preferenceText.toLowerCase().includes('malentendant')
        );
        if (hearingPref) {
          status = 'adapted';
          message = "Le standard IA a détecté des contraintes d'audition spéciales. Paramètres de l'appel modifiés.";
          actionTaken = 'DÉBIT VOCAL RALENTI (-15%) & AMPLIFICATION AUDIO (+4dB)';
          details = `Alerte sécurité : "${hearingPref.preferenceText}". Le synthétiseur vocal IA ralentit automatiquement la diction et envoie en parallèle un récapitulatif textuel complet par WhatsApp.`;
        } else {
          status = 'passed';
          message = "Appel lancé. Débit de parole standard appliqué.";
          actionTaken = 'APPEL IA COMPOSÉ';
          details = 'Connecté avec les paramètres d\'élocution normaux.';
        }
      } else if (simAction === 'schedule_standard') {
        const anxietyPref = patientMemories.find(m => 
          m.preferenceText.toLowerCase().includes('anxiété') || 
          m.preferenceText.toLowerCase().includes('anxiety') || 
          m.preferenceText.toLowerCase().includes('peur')
        );
        if (anxietyPref) {
          status = 'adapted';
          message = "Alerte Anxiété Clinique : Le patient présente une anxiété sévère.";
          actionTaken = 'PROTOCOLE D\'APAISEMENT & TEMPS DOUBLE ALLOUÉ';
          details = `Consigne clinique : "${anxietyPref.preferenceText}". Attribution automatique d'un double créneau pour soins en douceur, signalement au Dr. Smith et activation du diffuseur d'arômes relaxants à la lavande dans la salle.`;
        } else {
          status = 'passed';
          message = "Réservation standard confirmée.";
          actionTaken = 'SOIN STANDARD ENREGISTRÉ';
          details = 'Protocole clinique ordinaire validé.';
        }
      }

      setSimulationLogs(prev => [
        ...prev,
        `[EVAL] Action tentée : ${simAction.toUpperCase()}`,
        status === 'blocked' ? `[BLOQUÉ 🚨] Intercepté par les garde-fous de mémoire !` :
        status === 'adapted' ? `[ADAPTÉ ⚙️] L'IA a transformé l'opération pour respecter la préférence.` :
        `[APPROUVÉ ✅] Conforme à l'historique de mémoire.`
      ]);

      setSimulationResult({ status, message, actionTaken, details });
      setSimulating(false);
      
      if (status === 'blocked') {
        toast.error("Garde-fou IA activé ! Action bloquée.", { icon: <AlertTriangle className="text-red-500" /> });
      } else if (status === 'adapted') {
        toast.success("Préférence respectée ! Action adaptée intelligemment.", { icon: <Bot className="text-emerald-500" /> });
      } else {
        toast.success("Action approuvée et exécutée.");
      }
    }, 1800);
  };

  // Run AI sandbox transcript extraction
  const handleSandboxExtract = () => {
    setExtractionState('processing');
    setExtractedItems([]);

    setTimeout(() => {
      const items: { text: string; cat: string; conf: number }[] = [];
      
      if (sandboxTranscript.toLowerCase().includes("audition") || sandboxTranscript.toLowerCase().includes("hearing")) {
        items.push({ text: "Mon audition n'est pas très bonne.", cat: "Special Needs", conf: 98 });
      }
      if (sandboxTranscript.toLowerCase().includes("fils m'accompagne") || sandboxTranscript.toLowerCase().includes("son") || sandboxTranscript.toLowerCase().includes("fils")) {
        items.push({ text: "Mon fils m'accompagne toujours pour m'aider.", cat: "Family", conf: 96 });
      }
      if (sandboxTranscript.toLowerCase().includes("appelez-moi") || sandboxTranscript.toLowerCase().includes("call") || sandboxTranscript.toLowerCase().includes("texting") || sandboxTranscript.toLowerCase().includes("sms")) {
        items.push({ text: "S'il vous plaît, appelez-moi au lieu d'envoyer des SMS.", cat: "Communication", conf: 99 });
      }
      if (sandboxTranscript.toLowerCase().includes("matin") || sandboxTranscript.toLowerCase().includes("déteste le matin")) {
        items.push({ text: "Je déteste les rendez-vous le matin.", cat: "Scheduling", conf: 97 });
      }
      if (sandboxTranscript.toLowerCase().includes("anxiété") || sandboxTranscript.toLowerCase().includes("peur") || sandboxTranscript.toLowerCase().includes("stress")) {
        items.push({ text: "Mon anxiété est très élevée.", cat: "Clinical/Care", conf: 95 });
      }

      if (items.length === 0) {
        items.push({ text: "Préférence personnalisée extraite : " + sandboxTranscript.slice(0, 40) + "...", cat: "Clinical/Care", conf: 82 });
      }

      setExtractedItems(items);
      setExtractionState('completed');
      toast.success(`L'IA a extrait ${items.length} préférence(s) à partir du texte !`);
    }, 2000);
  };

  const handleSaveSandboxItem = async (text: string, cat: any) => {
    const patient = mockPatients.find(p => p.id === 'pat_2'); // Save to Sara Ahmed as sandbox default
    if (!patient) return;

    try {
      if (memories.some(m => m.preferenceText === text && m.patientId === patient.id)) {
        toast.warning("Cette consigne est déjà enregistrée dans la mémoire active de ce patient.");
        return;
      }

      const memoryData: Omit<MemoryPreference, 'id'> = {
        patientId: patient.id,
        patientName: `${patient.firstName} ${patient.lastName}`,
        preferenceText: text,
        category: cat,
        extractedFrom: 'Espace d\'extraction conversationnelle IA',
        confidenceScore: 98,
        timestamp: new Date().toISOString()
      };

      await addDoc(collection(db, 'aiMemories'), memoryData);
      toast.success(`Sauvegardé dans la mémoire de ${patient.firstName} !`);
    } catch (err) {
      console.error("Error saving:", err);
      toast.error("Échec de l'enregistrement de la préférence.");
    }
  };

  const categories = ['Tous', 'Scheduling', 'Communication', 'Clinical/Care', 'Special Needs', 'Family'];

  const categoryNameFr = (cat: string) => {
    switch (cat) {
      case 'Tous': return 'Tous';
      case 'Scheduling': return 'Planification';
      case 'Communication': return 'Communication';
      case 'Clinical/Care': return 'Soin/Clinique';
      case 'Special Needs': return 'Besoins Spécifiques';
      case 'Family': return 'Famille';
      default: return cat;
    }
  };

  const filteredMemories = memories.filter(m => {
    const matchesSearch = m.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.preferenceText.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Tous' || m.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 text-slate-800">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div className="text-left">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Brain className="h-6 w-6 text-blue-600 fill-blue-500" />
            Centre de Mémoire Active de l'IA
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Extraction intelligente et protection en temps réel des préférences critiques des patients. Ne demandez jamais deux fois, adaptez-vous toujours.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          {memories.length > 0 && (
            <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1 text-xs font-bold animate-fade-in">
              ● Garde-fous IA Actifs ({memories.length})
            </span>
          )}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left column: Quick Actions & Intercept Simulator ("Never Ask Twice") */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* AI Memory Intercept Guardrail Simulator */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 text-white rounded-xl border border-slate-800 shadow-lg overflow-hidden text-left">
            <div className="p-4 bg-slate-900/50 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400">
                <Bot className="h-5 w-5" />
                <span className="font-extrabold text-xs uppercase tracking-wider">Simulateur de Garde-fous : Ne jamais demander deux fois</span>
              </div>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Testez comment les préférences du patient interceptent automatiquement les actions du personnel pour éviter les impairs (ex: envoyer un SMS à un patient malentendant qui a demandé des appels vocaux).
              </p>

              {/* Selector */}
              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Sélectionner un Patient</label>
                  <select
                    value={simPatientId}
                    onChange={(e) => setSimPatientId(e.target.value)}
                    className="w-full rounded-md border-slate-800 bg-slate-900 text-slate-100 focus:ring-indigo-500 text-xs font-semibold p-2.5"
                  >
                    {mockPatients.map(p => (
                      <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Tenter une Opération de Cabinet</label>
                  <select
                    value={simAction}
                    onChange={(e) => setSimAction(e.target.value as any)}
                    className="w-full rounded-md border-slate-800 bg-slate-900 text-slate-100 focus:ring-indigo-500 text-xs font-semibold p-2.5"
                  >
                    <option value="schedule_morning">🗓️ Planifier le matin (9h00)</option>
                    <option value="send_sms">📲 Envoyer une relance par SMS standard</option>
                    <option value="call_patient">📞 Lancer un appel vocal interactif</option>
                    <option value="schedule_standard">🦷 Réserver une séance de soins ordinaire</option>
                  </select>
                </div>

                <button
                  onClick={handleRunSimulation}
                  disabled={simulating}
                  className={cn(
                    "w-full inline-flex items-center justify-center gap-2 rounded-lg text-white font-black py-2.5 text-xs shadow-md transition-all active:scale-95 cursor-pointer",
                    simulating ? "bg-slate-700 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-500"
                  )}
                >
                  {simulating ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Analyse des garde-fous IA en cours...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 text-yellow-300 fill-yellow-300" />
                      Exécuter l'action et tester la mémoire
                    </>
                  )}
                </button>
              </div>

              {/* Log stream */}
              {simulationLogs.length > 0 && (
                <div className="bg-black/50 rounded-lg p-3 font-mono text-[10px] text-slate-300 border border-slate-800 space-y-1 max-h-32 overflow-y-auto">
                  {simulationLogs.map((log, idx) => (
                    <div key={idx}>&gt; {log}</div>
                  ))}
                </div>
              )}

              {/* Guardrail Result Visual Card */}
              {simulationResult && (
                <div className={cn(
                  "p-4 rounded-lg border text-xs space-y-2 animate-in slide-in-from-bottom-2 duration-300",
                  simulationResult.status === 'blocked' ? "bg-red-950/40 border-red-500/30 text-red-200" :
                  simulationResult.status === 'adapted' ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-200" :
                  "bg-slate-900 border-slate-800 text-slate-300"
                )}>
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider">
                    {simulationResult.status === 'blocked' && <AlertTriangle className="h-4 w-4 text-red-400" />}
                    {simulationResult.status === 'adapted' && <Sparkles className="h-4 w-4 text-emerald-400 animate-bounce" />}
                    {simulationResult.status === 'passed' && <CheckCircle2 className="h-4 w-4 text-indigo-400" />}
                    <span>{simulationResult.message}</span>
                  </div>
                  
                  <div className="pt-1.5 border-t border-slate-800/80">
                    <span className="text-[9px] text-slate-400 uppercase font-bold block mb-1">Correction automatique de l'IA :</span>
                    <span className="font-extrabold text-[11px] font-mono tracking-tight text-white block">{simulationResult.actionTaken}</span>
                  </div>

                  <p className="text-[10px] text-slate-300 leading-relaxed italic pt-1 border-t border-slate-800/40">
                    {simulationResult.details}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick manual entry form */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 text-left space-y-4">
            <h4 className="font-bold text-slate-950 text-sm">Ajouter une Règle de Préférence</h4>
            <form onSubmit={handleAddMemory} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Sélectionner un Patient</label>
                <select
                  value={newPatientId}
                  onChange={(e) => setNewPatientId(e.target.value)}
                  className="w-full rounded-md border-slate-200 focus:ring-blue-500 text-xs font-semibold text-slate-800"
                >
                  <option value="">Sélectionner un patient...</option>
                  {mockPatients.map(p => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Consigne de Préférence</label>
                <input
                  type="text"
                  placeholder="Ex: Refuse les créneaux du matin."
                  value={newPreferenceText}
                  onChange={(e) => setNewPreferenceText(e.target.value)}
                  className="w-full rounded-md border-slate-200 focus:ring-blue-500 text-xs font-semibold text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Catégorie</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full rounded-md border-slate-200 focus:ring-blue-500 text-xs font-semibold text-slate-800"
                  >
                    <option value="Scheduling">Planification</option>
                    <option value="Communication">Communication</option>
                    <option value="Clinical/Care">Soin/Clinique</option>
                    <option value="Special Needs">Besoins Spécifiques</option>
                    <option value="Family">Famille</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Source d'Extraction</label>
                  <input
                    type="text"
                    value={newExtractedFrom}
                    onChange={(e) => setNewExtractedFrom(e.target.value)}
                    className="w-full rounded-md border-slate-200 focus:ring-blue-500 text-xs font-semibold text-slate-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 text-xs transition-all cursor-pointer"
              >
                Sauvegarder la consigne active
              </button>
            </form>
          </div>

        </div>

        {/* Middle and Right: Preferences Ledger & Conversational extraction terminal */}
        <div className="lg:col-span-2 space-y-6 text-left">
          
          {/* AI Sandbox Extraction Terminal */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden text-left">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-600 animate-spin-slow" />
                <h3 className="font-extrabold text-slate-900 text-xs sm:text-sm uppercase tracking-wider">Bac à sable d'extraction de mémoire conversationnelle</h3>
              </div>
              <span className="text-[10px] bg-indigo-50 border border-indigo-200 rounded-full px-2.5 py-1 text-indigo-700 font-bold">
                Démo d'analyse IA
              </span>
            </div>

            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Collez un extrait brut d'appel téléphonique ou de chat ci-dessous. Le modèle IA scanne la sémantique de la conversation pour isoler et identifier les réelles préférences sous-jacentes du patient en un clic.
              </p>

              {/* Transcript textbox */}
              <div className="space-y-2">
                <textarea
                  rows={3}
                  value={sandboxTranscript}
                  onChange={(e) => setSandboxTranscript(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3.5 text-xs text-slate-700 font-medium focus:ring-indigo-500 leading-relaxed bg-slate-50 text-left"
                  placeholder="Coller la transcription ou le chat de discussion..."
                />

                <div className="flex flex-wrap gap-2 justify-between items-center">
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => setSandboxTranscript('Patient : "Je déteste les rendez-vous de bonne heure le matin. De plus, mon fils m\'accompagne toujours pour m\'aider lors des soins."')}
                      className="bg-slate-100 hover:bg-slate-200 text-[10px] text-slate-600 font-semibold px-2 py-1 rounded cursor-pointer"
                    >
                      Exemple A (Matin & Fils)
                    </button>
                    <button
                      onClick={() => setSandboxTranscript('Patient : "Docteur, s\'il vous plaît, appelez-moi directement plutôt que de m\'envoyer des SMS car mon audition n\'est pas formidable. Je suis très stressée par la chirurgie dentaire."')}
                      className="bg-slate-100 hover:bg-slate-200 text-[10px] text-slate-600 font-semibold px-2 py-1 rounded cursor-pointer"
                    >
                      Exemple B (Appel & Stress)
                    </button>
                  </div>
                  
                  <button
                    onClick={handleSandboxExtract}
                    disabled={extractionState === 'processing'}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 text-xs font-bold shadow-sm transition-all cursor-pointer"
                  >
                    <Bot className="h-3.5 w-3.5" />
                    {extractionState === 'processing' ? "Analyse sémantique..." : "Extraire les consignes par l'IA"}
                  </button>
                </div>
              </div>

              {/* Output items */}
              {extractionState === 'completed' && extractedItems.length > 0 && (
                <div className="bg-indigo-50/50 rounded-xl border border-indigo-100 p-4 space-y-3.5 animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="h-3 w-3 fill-indigo-600" /> Préférences extraites par le modèle sémantique
                    </span>
                    <span className="text-[10px] text-slate-500">Patient d'affectation : <strong>Sara Ahmed</strong></span>
                  </div>

                  <div className="space-y-2 text-left">
                    {extractedItems.map((item, i) => (
                      <div key={i} className="bg-white p-3 rounded-lg border border-indigo-100/60 flex items-center justify-between gap-4 text-left">
                        <div className="space-y-1 text-left">
                          <span className="bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase">
                            {categoryNameFr(item.cat)}
                          </span>
                          <p className="text-xs font-bold text-slate-900 italic">"{item.text}"</p>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-green-600 font-semibold font-mono">{item.conf}% Confiance</span>
                          <button
                            onClick={() => handleSaveSandboxItem(item.text, item.cat)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="h-3 w-3" /> Enregistrer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Core Memories Table */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden text-left">
            
            {/* Filter segments */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-2.5 py-1 text-xs font-bold rounded-md transition-all cursor-pointer whitespace-nowrap",
                      selectedCategory === cat 
                        ? "bg-slate-900 text-white" 
                        : "bg-white hover:bg-slate-100 text-slate-600 border border-slate-200"
                    )}
                  >
                    {categoryNameFr(cat)}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative w-full sm:w-60">
                <Search className="absolute left-2.5 top-2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher une préférence..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-md border-slate-200 pl-8 py-1 text-xs font-semibold text-slate-800 text-left"
                />
              </div>
            </div>

            {/* Memories List */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm text-left">
                <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th scope="col" className="px-5 py-3">Patient</th>
                    <th scope="col" className="px-3 py-3 text-left">Consigne IA en mémoire</th>
                    <th scope="col" className="px-3 py-3">Catégorie</th>
                    <th scope="col" className="px-3 py-3 text-left">Origine d'extraction</th>
                    <th scope="col" className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-500 mb-2" />
                        Analyse du registre des mémoires IA en cours...
                      </td>
                    </tr>
                  ) : filteredMemories.map(item => {
                    const getCategoryColor = (cat: string) => {
                      switch (cat) {
                        case 'Scheduling': return 'bg-amber-50 text-amber-800 border-amber-200';
                        case 'Communication': return 'bg-sky-50 text-sky-800 border-sky-200';
                        case 'Clinical/Care': return 'bg-purple-50 text-purple-800 border-purple-200';
                        case 'Special Needs': return 'bg-rose-50 text-rose-800 border-rose-200';
                        default: return 'bg-teal-50 text-teal-800 border-teal-200';
                      }
                    };

                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-[10px]">
                              {item.patientName[0]}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900">{item.patientName}</div>
                              <span className="text-[9px] text-slate-400">ID : {item.patientId}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4 text-left">
                          <p className="font-extrabold text-slate-900 text-xs text-left">"{item.preferenceText}"</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 text-left">Fiabilité : {item.confidenceScore}%</p>
                        </td>
                        <td className="px-3 py-4">
                          <span className={cn(
                            "px-2 py-0.5 rounded border font-bold text-[9px] uppercase",
                            getCategoryColor(item.category)
                          )}>
                            {categoryNameFr(item.category)}
                          </span>
                        </td>
                        <td className="px-3 py-4 text-slate-500 font-medium max-w-[150px] truncate text-left" title={item.extractedFrom}>
                          {item.extractedFrom}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => handleDeleteMemory(item.id)}
                            className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                            title="Supprimer définitivement"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {!loading && filteredMemories.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        Aucun registre de préférence ne correspond à ce filtre.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
