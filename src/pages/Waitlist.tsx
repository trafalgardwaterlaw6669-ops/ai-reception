import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Clock, 
  Trash2, 
  CheckCircle, 
  AlertCircle, 
  Play, 
  Bot, 
  Send, 
  Zap, 
  ArrowRight, 
  RefreshCw, 
  ShieldCheck, 
  Flame, 
  X,
  Sparkles,
  Check,
  Phone,
  MessageSquare,
  Clock3,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { mockPatients } from '@/data/mockDb';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { Patient } from '@/types';

interface WaitlistEntry {
  id: string;
  patientId: string;
  patientName: string;
  phone: string;
  reason: string;
  preference: 'Morning' | 'Afternoon' | 'Anytime';
  severity: 'High' | 'Medium' | 'Routine';
  joinedDate: string;
  status: 'Waiting' | 'Contacting' | 'Accepted' | 'Declined' | 'Bypassed';
  responseTimeSeconds?: number;
}

interface ActiveDispatch {
  isActive: boolean;
  cancelledSlot: {
    time: string;
    dentist: string;
    originalPatient: string;
  } | null;
  logs: string[];
  candidates: {
    id: string;
    name: string;
    status: 'idle' | 'notified' | 'responding' | 'accepted' | 'declined';
    msg: string;
    timeLabel?: string;
  }[];
  timeLeft: number;
  winnerId: string | null;
}

export function Waitlist() {
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([
    {
      id: 'wl_1',
      patientId: 'pat_husband',
      patientName: 'Khalid Alami',
      phone: '+212 6 55 44 33 23',
      reason: 'Traitement urgent de carie douloureuse',
      preference: 'Morning',
      severity: 'High',
      joinedDate: 'Hier, 16h00',
      status: 'Waiting'
    },
    {
      id: 'wl_2',
      patientId: 'pat_2',
      patientName: 'Sara Ahmed',
      phone: '+212 6 99 88 77 66',
      reason: 'Détartrage périodique et bilan d\'hygiène',
      preference: 'Afternoon',
      severity: 'Medium',
      joinedDate: 'Il y a 2 jours',
      status: 'Waiting'
    },
    {
      id: 'wl_3',
      patientId: 'pat_daughter',
      patientName: 'Kenza Alami',
      phone: '+212 6 55 44 33 24',
      reason: 'Contrôle de pédodontie semestriel',
      preference: 'Anytime',
      severity: 'Routine',
      joinedDate: 'Il y a 3 jours',
      status: 'Waiting'
    },
    {
      id: 'wl_4',
      patientId: 'pat_3',
      patientName: 'Karim Tazi',
      phone: '+212 6 11 22 33 44',
      reason: 'Suivi parodontal de patient diabétique',
      preference: 'Anytime',
      severity: 'High',
      joinedDate: 'Il y a 4 jours',
      status: 'Waiting'
    }
  ]);

  const [activeDispatch, setActiveDispatch] = useState<ActiveDispatch>({
    isActive: false,
    cancelledSlot: null,
    logs: [],
    candidates: [],
    timeLeft: 0,
    winnerId: null
  });

  const [newPatientId, setNewPatientId] = useState('');
  const [newPreference, setNewPreference] = useState<'Morning' | 'Afternoon' | 'Anytime'>('Anytime');
  const [newSeverity, setNewSeverity] = useState<'High' | 'Medium' | 'Routine'>('Routine');
  const [newReason, setNewReason] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);

  // Load real patients from Firestore
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

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const logContainerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [activeDispatch.logs]);

  // Handle cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const addLog = (text: string) => {
    setActiveDispatch(prev => ({
      ...prev,
      logs: [...prev.logs, `[${new Date().toLocaleTimeString()}] ${text}`]
    }));
  };

  const handleSimulateCancellation = () => {
    if (activeDispatch.isActive) {
      toast.error("Une attribution de créneau est déjà activement en cours !");
      return;
    }

    setActiveDispatch({
      isActive: true,
      cancelledSlot: {
        time: 'Demain à 15h30 (Créneau de l\'Après-midi)',
        dentist: 'Dr. Smith',
        originalPatient: 'Amina Alami'
      },
      logs: [],
      candidates: [
        { id: 'wl_2', name: 'Sara Ahmed', status: 'idle', msg: '' },
        { id: 'wl_1', name: 'Khalid Alami', status: 'idle', msg: '' },
        { id: 'wl_3', name: 'Kenza Alami', status: 'idle', msg: '' }
      ],
      timeLeft: 10,
      winnerId: null
    });

    toast.info("Amina Alami a annulé ! Activation instantanée du moteur de liste d'attente AuraDental.", {
      icon: <Bot className="h-4 w-4 text-indigo-600 animate-spin" />
    });

    // Start simulation steps
    setTimeout(() => {
      addLog("🚨 Annulation détectée : Le créneau de demain à 15h30 est devenu vacant.");
      addLog("🔍 Balayage de la file d'attente pour identifier les profils correspondants aux critères de l'après-midi...");
    }, 500);

    setTimeout(() => {
      addLog("⚙️ Analyse de correspondance IA terminée :");
      addLog("   - Khalid Alami : Préfère le 'Matin' (Score de compatibilité faible).");
      addLog("   - Kenza Alami : Préférence 'Peu importe' (Candidat de secours compatible).");
      addLog("   - Sara Ahmed : Préfère l' 'Après-midi' (SCORE DE COMPATIBILITÉ PARFAIT).");
      addLog("📢 Lancement simultané des notifications d'urgence par WhatsApp aux candidats éligibles.");
    }, 1800);

    setTimeout(() => {
      setActiveDispatch(prev => ({
        ...prev,
        candidates: prev.candidates.map(c => ({
          ...c,
          status: 'notified',
          msg: `Bonjour ${c.name}, un créneau de dernière minute s'est libéré demain à 15h30 ! Répondez ACCEPTER pour le bloquer immédiatement. Le premier répondant l'emporte.`
        }))
      }));
      addLog("📲 Messages WhatsApp interactifs expédiés aux patients.");
      addLog("⏳ Attente des réponses des patients... (Règle d'attribution au premier répondant activée)");
    }, 3200);

    setTimeout(() => {
      addLog("💬 Réponse entrante de Khalid Alami...");
      setActiveDispatch(prev => ({
        ...prev,
        candidates: prev.candidates.map(c => c.id === 'wl_1' ? { ...c, status: 'declined', msg: 'Décliné : \"Je suis uniquement libre le matin, merci tout de même.\"' } : c)
      }));
      addLog("❌ Khalid Alami a décliné le créneau de l'après-midi.");
    }, 5000);

    // Sara Ahmed accepts first!
    setTimeout(() => {
      addLog("💬 Réponse entrante de Sara Ahmed...");
      setActiveDispatch(prev => ({
        ...prev,
        winnerId: 'wl_2',
        candidates: prev.candidates.map(c => {
          if (c.id === 'wl_2') {
            return { ...c, status: 'accepted', msg: 'Accepté : \"ACCEPTER (Bloque le créneau !)\"', timeLabel: 'Réponse en 4.2s' };
          }
          if (c.status === 'notified') {
            return { ...c, status: 'idle', msg: 'Créneau attribué à un autre candidat éligible' };
          }
          return c;
        })
      }));
      addLog("🏆 Sara Ahmed a répondu 'ACCEPTER' en seulement 4.2 secondes ! Créneau attribué.");
      addLog("🔒 Créneau de demain 15h30 attribué automatiquement à Sara Ahmed.");
      addLog("📅 Base de données de l'agenda clinique synchronisée.");
      addLog("💬 Messages de confirmation WhatsApp expédiés aux patients concernés.");
      
      setWaitlist(prev => prev.map(entry => {
        if (entry.id === 'wl_2') return { ...entry, status: 'Accepted' };
        if (entry.id === 'wl_1') return { ...entry, status: 'Declined' };
        return entry;
      }));

      toast.success("Créneau pourvu ! Sara Ahmed a été réservée avec succès.", {
        duration: 5000
      });
    }, 7200);

    // Simulation finishes
    setTimeout(() => {
      setActiveDispatch(prev => ({ ...prev, isActive: false }));
    }, 10000);
  };

  const handleAddWaitlist = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientId) {
      toast.error("Veuillez sélectionner un patient.");
      return;
    }

    const activePatients = patients.length > 0 ? patients : mockPatients;
    const patient = activePatients.find(p => p.id === newPatientId);
    if (!patient) return;

    if (waitlist.some(w => w.patientId === newPatientId)) {
      toast.error(`${patient.firstName} figure déjà sur la liste d'attente active.`);
      return;
    }

    const entry: WaitlistEntry = {
      id: `wl_${Date.now()}`,
      patientId: newPatientId,
      patientName: `${patient.firstName} ${patient.lastName}`,
      phone: patient.phone,
      reason: newReason || 'Contrôle périodique planifié',
      preference: newPreference,
      severity: newSeverity,
      joinedDate: 'À l\'instant',
      status: 'Waiting'
    };

    setWaitlist(prev => [entry, ...prev]);
    toast.success(`${patient.firstName} inséré(e) dans la file d'attente avec priorité : ${newSeverity === 'High' ? 'Haute' : newSeverity === 'Medium' ? 'Moyenne' : 'Routine'}.`);
    
    setNewPatientId('');
    setNewReason('');
  };

  const handleRemoveEntry = (id: string) => {
    setWaitlist(prev => prev.filter(w => w.id !== id));
    toast.info("Patient retiré de la liste d'attente.");
  };

  const handleResetSimulator = () => {
    if (activeDispatch.isActive) {
      toast.error("Un processus d'attribution est actuellement actif !");
      return;
    }
    setWaitlist([
      {
        id: 'wl_1',
        patientId: 'pat_husband',
        patientName: 'Khalid Alami',
        phone: '+212 6 55 44 33 23',
        reason: 'Traitement urgent de carie douloureuse',
        preference: 'Morning',
        severity: 'High',
        joinedDate: 'Hier, 16h00',
        status: 'Waiting'
      },
      {
        id: 'wl_2',
        patientId: 'pat_2',
        patientName: 'Sara Ahmed',
        phone: '+212 6 99 88 77 66',
        reason: 'Détartrage périodique et bilan d\'hygiène',
        preference: 'Afternoon',
        severity: 'Medium',
        joinedDate: 'Il y a 2 jours',
        status: 'Waiting'
      },
      {
        id: 'wl_3',
        patientId: 'pat_daughter',
        patientName: 'Kenza Alami',
        phone: '+212 6 55 44 33 24',
        reason: 'Contrôle de pédodontie semestriel',
        preference: 'Anytime',
        severity: 'Routine',
        joinedDate: 'Il y a 3 jours',
        status: 'Waiting'
      },
      {
        id: 'wl_4',
        patientId: 'pat_3',
        patientName: 'Karim Tazi',
        phone: '+212 6 11 22 33 44',
        reason: 'Suivi parodontal de patient diabétique',
        preference: 'Anytime',
        severity: 'High',
        joinedDate: 'Il y a 4 jours',
        status: 'Waiting'
      }
    ]);
    setActiveDispatch({
      isActive: false,
      cancelledSlot: null,
      logs: [],
      candidates: [],
      timeLeft: 0,
      winnerId: null
    });
    toast.success("Simulation réinitialisée avec succès.");
  };

  return (
    <div className="space-y-6 text-slate-800 text-left">
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between text-left">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Zap className="h-6 w-6 text-amber-500 fill-amber-500" />
            Moteur de Liste d'Attente IA
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Ne laissez plus aucune annulation de dernière minute gâcher votre temps de cabinet. Lorsqu'un créneau se libère, l'IA fait correspondre les profils et notifie instantanément les candidats.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={handleResetSimulator}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3.5 py-2 text-xs font-bold shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Réinitialiser la démo
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 text-left">
        
        {/* Left Column: Live Simulation Panel & Trigger */}
        <div className="xl:col-span-1 space-y-6 text-left">
          
          {/* Simulation Trigger Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden text-left">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">Simulateur d'Annulation</span>
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            </div>

            <div className="p-5 space-y-4 text-left">
              <p className="text-xs text-slate-500 leading-relaxed text-left">
                Simulez un désistement d'un patient à la dernière minute. Observez comment l'IA sélectionne, cible, et prévient simultanément les candidats selon leurs critères de préférence et de réactivité.
              </p>

              <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2 text-left">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Créneau réservé :</span>
                  <span className="text-indigo-600 font-bold">Demain, 15:30</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Patient prévu :</span>
                  <span className="text-slate-900 font-bold">Amina Alami</span>
                </div>
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Profil du créneau :</span>
                  <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold px-1.5 py-0.5 rounded text-[10px]">Après-midi</span>
                </div>
              </div>

              <button
                onClick={handleSimulateCancellation}
                disabled={activeDispatch.isActive}
                className={cn(
                  "w-full inline-flex items-center justify-center gap-2 rounded-xl text-white font-extrabold py-3 text-xs shadow-md transition-all active:scale-95 cursor-pointer",
                  activeDispatch.isActive 
                    ? "bg-slate-400 cursor-not-allowed" 
                    : "bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500"
                )}
              >
                <Flame className="h-4 w-4 text-yellow-300 animate-bounce" /> Simuler une Annulation
              </button>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Temps de réponse moyen</span>
              <p className="text-xl font-black text-slate-900 mt-1">4.2 Secondes</p>
              <span className="text-[9px] text-green-600 font-semibold">⏱ Attribution ultra-rapide</span>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Taux de Remplissage</span>
              <p className="text-xl font-black text-slate-900 mt-1">100% Pourvu</p>
              <span className="text-[9px] text-indigo-600 font-semibold">📈 Aucun créneau gâché</span>
            </div>
          </div>

          {/* Manual Add Form */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 text-left space-y-4">
            <h4 className="font-bold text-slate-900 text-sm">Ajouter un patient en file d'attente</h4>
            
            <form onSubmit={handleAddWaitlist} className="space-y-3.5 text-xs text-left">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Sélectionner le patient</label>
                <select
                  value={newPatientId}
                  onChange={(e) => setNewPatientId(e.target.value)}
                  className="w-full rounded-md border-slate-200 focus:ring-indigo-500 text-xs font-semibold text-slate-800 bg-white p-2"
                >
                  <option value="">Sélectionner un patient...</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                  ))}
                  {patients.length === 0 && mockPatients.map(p => (
                    <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3 text-left">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Créneau recherché</label>
                  <select
                    value={newPreference}
                    onChange={(e) => setNewPreference(e.target.value as any)}
                    className="w-full rounded-md border-slate-200 focus:ring-indigo-500 text-xs font-semibold text-slate-800 bg-white p-2"
                  >
                    <option value="Anytime">Peu importe</option>
                    <option value="Morning">Matin</option>
                    <option value="Afternoon">Après-midi</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Urgence / Priorité</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as any)}
                    className="w-full rounded-md border-slate-200 focus:ring-indigo-500 text-xs font-semibold text-slate-800 bg-white p-2"
                  >
                    <option value="Routine">Routine</option>
                    <option value="Medium">Modéré</option>
                    <option value="High">Urgent / Alerte</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Motif clinique</label>
                <input
                  type="text"
                  placeholder="ex. Carie douloureuse, couronne cassée"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  className="w-full rounded-md border-slate-200 focus:ring-indigo-500 text-xs font-semibold text-slate-800"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 text-xs transition-all active:scale-95 cursor-pointer"
              >
                Inscrire sur la liste d'attente
              </button>
            </form>
          </div>

        </div>

        {/* Right 2 Columns: Live Processing Console & Active Queue */}
        <div className="xl:col-span-2 space-y-6 text-left">
          
          {/* ACTIVE DISPATCH CONSOLE */}
          {activeDispatch.isActive || activeDispatch.winnerId ? (
            <div className="bg-slate-950 text-white rounded-2xl border border-slate-800 overflow-hidden shadow-xl text-left">
              <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center text-left">
                <div className="flex items-center gap-2 text-left">
                  <Bot className="h-5 w-5 text-indigo-400" />
                  <span className="font-extrabold text-sm tracking-tight text-slate-100">Console de Diffusion Multilatérale de l'IA</span>
                </div>
                <span className="text-[10px] bg-indigo-500/15 text-indigo-300 font-semibold px-2 py-0.5 rounded uppercase tracking-wider">
                  {activeDispatch.winnerId ? "ATTRIBUÉ" : "DIFFUSION EN COURS"}
                </span>
              </div>

              <div className="p-5 space-y-5 text-left">
                {/* Cancelled slot info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-800 pb-4 text-left">
                  <div className="text-left">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">CRÉNEAU LIBÉRÉ</span>
                    <p className="text-xs font-bold text-rose-400">{activeDispatch.cancelledSlot?.time}</p>
                  </div>
                  <div className="text-left">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">PATIENT AYANT ANNULÉ</span>
                    <p className="text-xs font-bold text-slate-200">{activeDispatch.cancelledSlot?.originalPatient}</p>
                  </div>
                  <div className="text-left">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">CHIRURGIEN-DENTISTE</span>
                    <p className="text-xs font-bold text-slate-200">{activeDispatch.cancelledSlot?.dentist}</p>
                  </div>
                </div>

                {/* Candidate Notifications Status Grid */}
                <div className="space-y-3 text-left">
                  <h5 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 text-left">
                    <MessageSquare className="h-4 w-4 text-indigo-400" /> Candidats Notifiés Simultanément
                  </h5>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-left">
                    {activeDispatch.candidates.map(cand => {
                      const isWinner = activeDispatch.winnerId === cand.id;
                      const hasDeclined = cand.status === 'declined';
                      const isContacted = cand.status === 'notified';

                      return (
                        <div 
                          key={cand.id} 
                          className={cn(
                            "p-3 rounded-xl border text-xs transition-all relative overflow-hidden text-left",
                            isWinner ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-200" :
                            hasDeclined ? "bg-red-950/20 border-red-500/20 text-red-300" :
                            isContacted ? "bg-indigo-950/20 border-indigo-500/30 text-indigo-200" :
                            "bg-slate-900 border-slate-800 text-slate-400"
                          )}
                        >
                          {isWinner && (
                            <div className="absolute right-2 top-2 bg-emerald-500 text-slate-950 rounded-full p-0.5" title="GAGNANT">
                              <Check className="h-3 w-3 font-extrabold" />
                            </div>
                          )}

                          <div className="font-extrabold text-slate-100">{cand.name}</div>
                          
                          <div className="mt-1 flex items-center gap-1.5 text-left">
                            <span className={cn(
                              "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase",
                              isWinner ? "bg-emerald-500 text-slate-950 font-black" :
                              hasDeclined ? "bg-red-500/20 text-red-400" :
                              isContacted ? "bg-indigo-500/20 text-indigo-300 animate-pulse" :
                              "bg-slate-800 text-slate-500"
                            )}>
                              {isWinner ? "LAURÉAT / PLANIFIÉ" :
                               cand.status === 'notified' ? "EN ATTENTE" :
                               cand.status === 'declined' ? "REFUSÉ" : "ÉCARTÉ"}
                            </span>
                            {cand.timeLabel && (
                              <span className="text-[10px] text-emerald-400 font-mono font-bold">
                                {cand.timeLabel}
                              </span>
                            )}
                          </div>

                          <p className="mt-2 text-[11px] text-slate-300 italic line-clamp-3 bg-black/20 p-2 rounded text-left">
                            {cand.msg || "Analyse de compatibilité en cours..."}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* AI Terminal Logs Console */}
                <div className="space-y-2 text-left">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block text-left">Console du Moteur d'attribution</span>
                  <div 
                    ref={logContainerRef}
                    className="bg-black/40 border border-slate-800 rounded-xl p-4 h-40 overflow-y-auto font-mono text-[11px] text-slate-300 space-y-1.5 leading-relaxed text-left"
                  >
                    {activeDispatch.logs.map((log, i) => (
                      <div key={i} className="text-left">
                        {log.includes('🏆') ? (
                          <span className="text-emerald-400 font-bold">{log}</span>
                        ) : log.includes('🚨') ? (
                          <span className="text-rose-400 font-bold">{log}</span>
                        ) : log.includes('📢') ? (
                          <span className="text-indigo-300 font-bold">{log}</span>
                        ) : (
                          <span>{log}</span>
                        )}
                      </div>
                    ))}
                    {!activeDispatch.winnerId && activeDispatch.isActive && (
                      <div className="text-indigo-400 font-bold animate-pulse text-left">📡 Pipeline de dispatch actif... En attente des réponses patients.</div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          ) : null}

          {/* CURRENT WAITLIST QUEUE */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden text-left">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">File d'Attente Interactive</h3>
              </div>
              <span className="text-[10px] bg-slate-100 border border-slate-200 rounded-full px-2.5 py-1 text-slate-700 font-bold">
                {waitlist.length} patients en attente
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-xs sm:text-sm text-left">
                <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[10px] text-left">
                  <tr>
                    <th scope="col" className="px-5 py-3 text-left">Patient & Inscription</th>
                    <th scope="col" className="px-3 py-3 text-left">Créneau</th>
                    <th scope="col" className="px-3 py-3 text-left">Priorité</th>
                    <th scope="col" className="px-3 py-3 text-left">Motif clinique</th>
                    <th scope="col" className="px-3 py-3 text-left">Statut</th>
                    <th scope="col" className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white text-slate-700 text-left">
                  {waitlist.map(entry => {
                    const getSeverityBadge = (sev: 'High' | 'Medium' | 'Routine') => {
                      if (sev === 'High') {
                        return <span className="inline-flex items-center gap-1 rounded bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700 border border-red-100 uppercase">🚨 Urgent</span>;
                      }
                      if (sev === 'Medium') {
                        return <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-100 uppercase">Modéré</span>;
                      }
                      return <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 uppercase">Routine</span>;
                    };

                    const getStatusBadge = (stat: string) => {
                      if (stat === 'Accepted') {
                        return <span className="bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded text-[10px] font-bold uppercase">✔ Planifié</span>;
                      }
                      if (stat === 'Declined') {
                        return <span className="bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded text-[10px] font-medium uppercase">Décliné</span>;
                      }
                      return <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-bold animate-pulse uppercase">En attente</span>;
                    };

                    const translatePref = (pref: string) => {
                      if (pref === 'Morning') return 'Matin';
                      if (pref === 'Afternoon') return 'Après-midi';
                      return 'Peu importe';
                    };

                    return (
                      <tr key={entry.id} className="hover:bg-slate-50 transition-colors text-left">
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-900">{entry.patientName}</div>
                          <p className="text-[10px] text-slate-400 mt-0.5">Inscrit : {entry.joinedDate}</p>
                        </td>
                        <td className="px-3 py-4">
                          <span className={cn(
                            "px-2 py-0.5 rounded font-bold text-[10px]",
                            entry.preference === 'Morning' ? "bg-amber-50 text-amber-700 border border-amber-200" :
                            entry.preference === 'Afternoon' ? "bg-indigo-50 text-indigo-700 border border-indigo-200" :
                            "bg-slate-100 text-slate-700"
                          )}>
                            {translatePref(entry.preference)}
                          </span>
                        </td>
                        <td className="px-3 py-4">{getSeverityBadge(entry.severity)}</td>
                        <td className="px-3 py-4 text-slate-500 italic max-w-[150px] truncate" title={entry.reason}>
                          "{entry.reason}"
                        </td>
                        <td className="px-3 py-4">{getStatusBadge(entry.status)}</td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => handleRemoveEntry(entry.id)}
                            className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                            title="Retirer de la file d'attente"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {waitlist.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-5 py-10 text-center text-slate-400">
                        Aucun patient inscrit sur la liste d'attente.
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
