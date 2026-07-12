import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  User, 
  Calendar, 
  CloudSun, 
  AlertTriangle, 
  CheckCircle, 
  Sparkles, 
  ToggleLeft, 
  ToggleRight, 
  Clock, 
  Activity,
  ArrowRight,
  ShieldAlert,
  Loader2,
  RefreshCw,
  Sliders,
  Send,
  MessageSquare,
  Settings
} from 'lucide-react';
import { format, parseISO, isSameDay, getDay } from 'date-fns';
import { mockPatients } from '@/data/mockDb';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, doc, setDoc, getDoc, addDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { Patient } from '@/types';

interface PredictionFactors {
  age: number;
  history: 'perfect' | 'some-cancels' | 'frequent-noshows';
  weekday: 'monday' | 'midweek' | 'friday';
  weather: 'sunny' | 'rainy' | 'storm' | 'hot';
  holiday: 'none' | 'near-holiday' | 'holiday-weekend';
  confirmation: 'quick-confirm' | 'slow-response' | 'no-response';
}

export function Predictions() {
  // Config state
  const [autoReconfirm, setAutoReconfirm] = useState(true);
  const [reconfirmThreshold, setReconfirmThreshold] = useState(65);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<any[]>([]);

  // Simulation calculator state
  const [selectedPatientId, setSelectedPatientId] = useState('pat_2'); // Default Sara Ahmed
  const [factors, setFactors] = useState<PredictionFactors>({
    age: 34,
    history: 'some-cancels',
    weekday: 'monday',
    weather: 'storm',
    holiday: 'near-holiday',
    confirmation: 'no-response'
  });

  const [predictedScore, setPredictedScore] = useState(83);
  const [realAppointments, setRealAppointments] = useState<any[]>([]);
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

  // Load real appointments from Firestore to show active calendar risk
  useEffect(() => {
    const q = query(collection(db, 'appointments'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setRealAppointments(fetched);
    });

    return () => unsubscribe();
  }, []);

  // Set default settings
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsRef = doc(db, 'settings', 'no_show_config');
        const snap = await getDoc(settingsRef);
        if (snap.exists()) {
          setAutoReconfirm(snap.data().autoReconfirm ?? true);
          setReconfirmThreshold(snap.data().reconfirmThreshold ?? 65);
        }
      } catch (e) {
        console.error("Error fetching config:", e);
      }
    };
    fetchSettings();
  }, []);

  // Dynamic risk engine
  const calculateRisk = (f: PredictionFactors) => {
    let score = 10; // Base risk

    // 1. Age Factor
    if (f.age < 25) score += 15;
    else if (f.age > 75) score += 12;
    else if (f.age >= 25 && f.age <= 40) score += 8;
    else score += 2;

    // 2. History Factor
    if (f.history === 'perfect') score -= 15;
    else if (f.history === 'some-cancels') score += 15;
    else if (f.history === 'frequent-noshows') score += 35;

    // 3. Weekday Factor
    if (f.weekday === 'monday' || f.weekday === 'friday') score += 10;
    else score += 2;

    // 4. Weather Factor
    if (f.weather === 'rainy') score += 10;
    else if (f.weather === 'storm') score += 25;
    else if (f.weather === 'hot') score += 5;

    // 5. Holiday Factor
    if (f.holiday === 'near-holiday') score += 12;
    else if (f.holiday === 'holiday-weekend') score += 20;

    // 6. Confirmation Behavior Factor
    if (f.confirmation === 'quick-confirm') score -= 25;
    else if (f.confirmation === 'slow-response') score += 15;
    else if (f.confirmation === 'no-response') score += 40;

    // Clamp score between 2% and 99%
    return Math.max(2, Math.min(99, score));
  };

  // Recalculate score on factor changes
  useEffect(() => {
    const computed = calculateRisk(factors);
    setPredictedScore(computed);
  }, [factors]);

  // Adjust factors based on patient select
  const handlePatientChange = (patientId: string) => {
    setSelectedPatientId(patientId);
    if (patientId === 'pat_1') {
      setFactors({
        age: 41,
        history: 'perfect',
        weekday: 'midweek',
        weather: 'sunny',
        holiday: 'none',
        confirmation: 'quick-confirm'
      });
    } else if (patientId === 'pat_2') {
      setFactors({
        age: 34,
        history: 'some-cancels',
        weekday: 'monday',
        weather: 'storm',
        holiday: 'near-holiday',
        confirmation: 'no-response'
      });
    } else if (patientId === 'pat_3') {
      setFactors({
        age: 48,
        history: 'frequent-noshows',
        weekday: 'friday',
        weather: 'rainy',
        holiday: 'holiday-weekend',
        confirmation: 'slow-response'
      });
    }
  };

  // Save Settings to Firestore
  const saveConfig = async (newAuto: boolean, newThreshold: number) => {
    setLoading(true);
    try {
      await setDoc(doc(db, 'settings', 'no_show_config'), {
        autoReconfirm: newAuto,
        reconfirmThreshold: newThreshold,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      toast.success("Règles de relance automatique mises à jour !");
    } catch (e) {
      console.error(e);
      toast.error("Échec de la mise à jour de la configuration.");
    } finally {
      setLoading(false);
    }
  };

  // Run auto reconfirmation trigger simulation
  const triggerAutoReconfirmSim = async () => {
    if (predictedScore < reconfirmThreshold) {
      toast.info(`Le score calculé (${predictedScore}%) est sous le seuil d'envoi auto (${reconfirmThreshold}%). Modifiez les critères pour tester.`);
      return;
    }

    const activePatients = patients.length > 0 ? patients : mockPatients;
    const patient = activePatients.find(p => p.id === selectedPatientId) || { firstName: 'Sara', lastName: 'Ahmed', phone: '+212 6 99 88 77 66' };
    const patientName = `${patient.firstName} ${patient.lastName}`;

    toast.loading("Génération de la relance ciblée WhatsApp...", { id: 'reconfirm' });
    
    setTimeout(async () => {
      try {
        const logMsg = `[Auto-Relance] Message WhatsApp urgent envoyé à ${patientName} (Risque d'absence de ${predictedScore}%).`;
        
        await addDoc(collection(db, 'reminders'), {
          patientName,
          phone: patient.phone,
          type: 'SMS',
          message: `CONFIRMATION REQUIS : Bonjour ${patient.firstName}, votre rendez-vous chez AuraDental approche. Veuillez répondre CONFIRMER pour bloquer le créneau, ou ANNULER pour libérer la plage horaire. Merci.`,
          sentAt: new Date().toISOString(),
          status: 'Priority Sent'
        });

        setLogs(prev => [
          {
            time: new Date().toLocaleTimeString(),
            message: `Alerte Prioritaire : ${patientName} identifié(e) à haut risque de désistement (${predictedScore}%).`,
            type: 'alert'
          },
          {
            time: new Date().toLocaleTimeString(),
            message: `Message interactif expédié à ${patient.phone}...`,
            type: 'sent'
          },
          ...prev
        ]);

        toast.success(`Relance d'urgence expédiée à ${patientName} !`, { id: 'reconfirm' });

        // Simulate patient responding shortly after
        setTimeout(() => {
          setLogs(prev => [
            {
              time: new Date().toLocaleTimeString(),
              message: `Le patient ${patientName} a répondu : "CONFIRMER". Risque actualisé de ${predictedScore}% à 5%.`,
              type: 'success'
            },
            ...prev
          ]);
          setFactors(prev => ({ ...prev, confirmation: 'quick-confirm' }));
          toast.success(`${patientName} a confirmé son rendez-vous avec succès via WhatsApp !`);
        }, 4000);

      } catch (err) {
        console.error(err);
        toast.dismiss('reconfirm');
      }
    }, 1500);
  };

  // Helper colors for score
  const getScoreColor = (score: number) => {
    if (score < 40) return 'text-green-600 bg-green-50 border-green-200';
    if (score < 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreProgressColor = (score: number) => {
    if (score < 40) return 'bg-green-500';
    if (score < 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6 text-slate-800 text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Brain className="h-7 w-7 text-blue-600" />
            Prédiction des Absences & Désistements
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Analyse prédictive des absences. Anticipez les créneaux vulnérables selon des critères dynamiques et automatisez les relances WhatsApp ciblées.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
            <Sparkles className="mr-1.5 h-3.5 w-3.5 text-blue-600 animate-pulse" />
            Analyseur de Risque Gemini Actif
          </span>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Risk Interactive Simulator */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Risk Display */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-left">
            <div className="p-6 md:p-8 bg-gradient-to-r from-slate-50 to-blue-50/20 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6 text-left">
              
              <div className="space-y-3 flex-1 text-left">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase text-blue-600">
                  <Activity className="h-4 w-4 text-blue-500" />
                  Modélisation en Direct
                </span>
                <h2 className="text-xl font-bold text-slate-900 text-left">
                  Probabilité de Désistement Patient
                </h2>
                <p className="text-sm text-slate-500 max-w-md text-left leading-relaxed">
                  Ce score de risque calcule en temps réel l'historique de présence, les facteurs environnementaux et le délai de réponse aux rappels du patient.
                </p>
              </div>

              <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-slate-200 shadow-sm min-w-[200px]">
                <div className="relative flex items-center justify-center">
                  <div className="text-4xl font-extrabold tracking-tight text-slate-900">
                    {predictedScore}%
                  </div>
                </div>
                <span className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-wider">Risque calculé</span>
                <span className={`mt-3 inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border ${getScoreColor(predictedScore)}`}>
                  {predictedScore >= 70 ? 'Risque Élevé 🚨' : predictedScore >= 40 ? 'Risque Modéré ⏳' : 'Risque Faible 👍'}
                </span>
              </div>
            </div>

            <div className="p-6 md:p-8 space-y-6 text-left">
              {/* Progress bar */}
              <div>
                <div className="flex justify-between text-xs font-semibold text-slate-400 mb-2">
                  <span>RISQUE FAIBLE</span>
                  <span>RISQUE MODÉRÉ</span>
                  <span>RISQUE CRITIQUE</span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ease-out ${getScoreProgressColor(predictedScore)}`}
                    style={{ width: `${predictedScore}%` }}
                  />
                </div>
              </div>

              {/* Patient Selector */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 items-center text-left">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Sélectionnez un profil patient pour tester</label>
                  <select 
                    value={selectedPatientId} 
                    onChange={(e) => handlePatientChange(e.target.value)}
                    className="block w-full rounded-md border-slate-300 text-slate-800 text-xs focus:ring-blue-500 focus:border-blue-500 bg-white p-2"
                  >
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName} ({p.id === 'pat_1' ? "Risque Faible" : p.id === 'pat_2' ? "Risque Élevé" : "Risque Moyen"})
                      </option>
                    ))}
                    {patients.length === 0 && (
                      <>
                        <option value="pat_1">Youssef Benali (Risque Faible - Historique Parfait)</option>
                        <option value="pat_2">Sara Ahmed (Risque Élevé - Désistements & Tempête)</option>
                        <option value="pat_3">Karim Tazi (Risque Critique - Absences Fréquentes & Férié)</option>
                      </>
                    )}
                  </select>
                </div>
                <div className="text-xs text-slate-500 text-left">
                  <p className="font-semibold text-slate-700">Aperçu rapide du profil :</p>
                  <p className="mt-1 leading-normal">
                    {selectedPatientId === 'pat_1' && "41 ans. Préfère la Darija. Zéro rendez-vous manqué. Confirme instantanément par SMS."}
                    {selectedPatientId === 'pat_2' && "34 ans. Préfère le Français. Déjà 1 annulation. Prévu un lundi ; tempête simulée ; aucune réponse."}
                    {selectedPatientId === 'pat_3' && "48 ans. Préfère l'Arabe. Déjà 2 absences passées. Long week-end férié ; journée pluvieuse."}
                  </p>
                </div>
              </div>

              {/* Dynamic Sliders/Selectors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 text-left">
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-slate-500" />
                    Critères Démographiques & Présence
                  </h3>

                  {/* Age */}
                  <div>
                    <div className="flex justify-between text-xs font-medium text-slate-600 mb-1.5">
                      <span className="flex items-center gap-1"><User className="h-3 w-3" /> Âge</span>
                      <span className="font-mono">{factors.age} ans</span>
                    </div>
                    <input 
                      type="range" 
                      min="15" 
                      max="90" 
                      value={factors.age}
                      onChange={(e) => setFactors(prev => ({ ...prev, age: parseInt(e.target.value) }))}
                      className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                  </div>

                  {/* History */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Historique de Présence</label>
                    <select 
                      value={factors.history}
                      onChange={(e: any) => setFactors(prev => ({ ...prev, history: e.target.value }))}
                      className="block w-full text-xs rounded-md border-slate-300 text-slate-700 bg-white p-2"
                    >
                      <option value="perfect">Assiduité parfaite (Aucune absence)</option>
                      <option value="some-cancels">1 ou 2 annulations passées (Risque modéré)</option>
                      <option value="frequent-noshows">Absences répétées / Annulations tardives</option>
                    </select>
                  </div>

                  {/* Confirmation behavior */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Réactivité aux rappels</label>
                    <select 
                      value={factors.confirmation}
                      onChange={(e: any) => setFactors(prev => ({ ...prev, confirmation: e.target.value }))}
                      className="block w-full text-xs rounded-md border-slate-300 text-slate-700 bg-white p-2"
                    >
                      <option value="quick-confirm">Confirme instantanément par SMS (&lt; 2h)</option>
                      <option value="slow-response">Réponse tardive aux messages (&gt; 12h)</option>
                      <option value="no-response">Aucune réponse aux rappels/messages</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <CloudSun className="h-4 w-4 text-slate-500" />
                    Conditions Temporelles & Météo
                  </h3>

                  {/* Weekday */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Jour du Rendez-vous</label>
                    <select 
                      value={factors.weekday}
                      onChange={(e: any) => setFactors(prev => ({ ...prev, weekday: e.target.value }))}
                      className="block w-full text-xs rounded-md border-slate-300 text-slate-700 bg-white p-2"
                    >
                      <option value="monday">Lundi (Taux d'annulation statistiquement supérieur)</option>
                      <option value="midweek">Milieu de semaine (Mar - Jeu) (Présence stable)</option>
                      <option value="friday">Vendredi (Effet de fin de semaine)</option>
                    </select>
                  </div>

                  {/* Weather */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Conditions Météo</label>
                    <select 
                      value={factors.weather}
                      onChange={(e: any) => setFactors(prev => ({ ...prev, weather: e.target.value }))}
                      className="block w-full text-xs rounded-md border-slate-300 text-slate-700 bg-white p-2"
                    >
                      <option value="sunny">Ensoleillé / Météo Clémente</option>
                      <option value="rainy">Pluie (Risque d'embouteillages et ralentissements)</option>
                      <option value="storm">Orage violent / Alerte tempête (+30% d'absences)</option>
                      <option value="hot">Canicule / Très chaud</option>
                    </select>
                  </div>

                  {/* Holidays */}
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1.5">Proximité de Jours Fériés</label>
                    <select 
                      value={factors.holiday}
                      onChange={(e: any) => setFactors(prev => ({ ...prev, holiday: e.target.value }))}
                      className="block w-full text-xs rounded-md border-slate-300 text-slate-700 bg-white p-2"
                    >
                      <option value="none">Semaine classique (Aucun jour férié)</option>
                      <option value="near-holiday">Proche d'un jour férié (ex: sous 48h)</option>
                      <option value="holiday-weekend">Long week-end férié (Grands départs / Voyages)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row gap-3 justify-end text-left">
                <button
                  onClick={triggerAutoReconfirmSim}
                  className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs px-5 py-3 shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  Simuler une Relance d'Urgence IA
                </button>
              </div>
            </div>
          </div>

          {/* Explanation Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex gap-4 text-left">
            <ShieldAlert className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-left">
              <h4 className="text-sm font-bold text-amber-950">Pourquoi la prédiction des absences est-elle capitale ?</h4>
              <p className="text-xs text-amber-900 leading-relaxed text-left">
                La médecine dentaire connaît en moyenne 15% à 22% d'absences, coûtant aux cliniques des milliers de dirhams de temps de cabinet vide chaque jour. Grâce à ce module de modélisation prédictif, AuraDental anticipe les créneaux vulnérables 24h à 48h à l'avance et déclenche automatiquement une relance personnalisée lorsque le score de risque est dépassé.
              </p>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Policy Config & Simulated Action Logs */}
        <div className="space-y-6 text-left">
          
          {/* Policy Settings Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 text-left">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Settings className="h-5 w-5 text-slate-500" />
              Relance Automatique
            </h2>

            {/* Toggle Switch */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="space-y-0.5 text-left">
                <span className="text-sm font-semibold text-slate-900 block">Activer la Relance Auto</span>
                <span className="text-xs text-slate-500">Alerter les rendez-vous à haut risque</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const newVal = !autoReconfirm;
                  setAutoReconfirm(newVal);
                  saveConfig(newVal, reconfirmThreshold);
                }}
                className="text-blue-600 focus:outline-none cursor-pointer"
              >
                {autoReconfirm ? (
                  <ToggleRight className="h-10 w-10 text-blue-600" />
                ) : (
                  <ToggleLeft className="h-10 w-10 text-slate-400" />
                )}
              </button>
            </div>

            {/* Threshold Slider */}
            <div className="space-y-3 text-left">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>SEUIL DE RISQUE</span>
                <span className="font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">{reconfirmThreshold}% de Risque</span>
              </div>
              <input 
                type="range" 
                min="40" 
                max="90" 
                value={reconfirmThreshold}
                onChange={(e) => setReconfirmThreshold(parseInt(e.target.value))}
                onMouseUp={() => saveConfig(autoReconfirm, reconfirmThreshold)}
                onTouchEnd={() => saveConfig(autoReconfirm, reconfirmThreshold)}
                disabled={!autoReconfirm}
                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 disabled:opacity-50"
              />
              <p className="text-xs text-slate-400 leading-normal">
                Les rendez-vous atteignant ou dépassant ce niveau de probabilité déclencheront une prise de contact par WhatsApp d'urgence.
              </p>
            </div>

            {/* Simulated Action */}
            <div className="border-t border-slate-100 pt-5 space-y-3 text-left">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Canal Prioritaire</span>
              <div className="flex items-center gap-3 text-sm text-slate-700">
                <MessageSquare className="h-4 w-4 text-blue-500" />
                <span>Rappels WhatsApp Interactifs</span>
              </div>
              <p className="text-xs text-slate-400 leading-normal">
                L'IA transmet un flux interactif demandant confirmation immédiate en un clic, contournant les rappels par e-mail qui sont fréquemment ignorés.
              </p>
            </div>
          </div>

          {/* Real-time Dispatch Logs */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[320px] text-left">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Relances Automatisées de l'IA</span>
              <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-3 font-mono text-xs">
              {logs.length > 0 ? (
                logs.map((log, idx) => (
                  <div key={idx} className="space-y-1 p-2 bg-slate-50 rounded border border-slate-100 text-left">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>{log.time}</span>
                      <span className="font-bold text-blue-600">ENVOI</span>
                    </div>
                    <p className={`text-slate-700 ${log.type === 'alert' ? 'text-amber-700 font-bold' : log.type === 'success' ? 'text-green-700 font-bold' : ''}`}>
                      {log.message}
                    </p>
                  </div>
                ))
              ) : (
                <div className="h-full flex items-center justify-center text-center text-slate-400 text-xs px-4 leading-normal">
                  <p>Aucun log de relance généré pour le moment. Modifiez les facteurs ci-dessus et cliquez sur "Simuler une Relance d'Urgence IA" pour tester.</p>
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Calendar List with Risks */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden text-left">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900">Prochains Rendez-vous & Indice de Risque</h3>
            <p className="text-xs text-slate-500 mt-0.5">Indicateurs de risque d'absence calculés pour les prochains créneaux.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100 text-sm text-left">
            <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase text-left">
              <tr>
                <th className="px-6 py-3">Heure / Date</th>
                <th className="px-6 py-3">Patient</th>
                <th className="px-6 py-3">Soin</th>
                <th className="px-6 py-3">Statut de rappel</th>
                <th className="px-6 py-3 text-right">Risque d'Absence Calculé</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {[
                { name: 'Sara Ahmed', type: 'Contrôle Annuel', time: '15:30', date: '2026-07-01', risk: 83, status: 'Non confirmé' },
                { name: 'Youssef Benali', type: 'Traitement Canalaire', time: '14:00', date: '2026-07-01', risk: 4, status: 'Confirmé' },
                { name: 'Karim Tazi', type: 'Détartrage complet', time: '10:00', date: '2026-07-02', risk: 91, status: 'Non confirmé' },
                ...realAppointments.map(a => ({
                  name: a.patientName,
                  type: a.reason || 'Consultation',
                  time: a.time,
                  date: a.date,
                  risk: a.reason === 'Urgence' ? 12 : 55,
                  status: 'Confirmé'
                }))
              ].map((apt, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    {apt.time} ({apt.date})
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-800">{apt.name}</td>
                  <td className="px-6 py-4">{apt.type}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                      apt.status === 'Confirmé' ? 'bg-green-50 text-green-700 ring-green-600/20' : 'bg-yellow-50 text-yellow-800 ring-yellow-600/20'
                    }`}>
                      {apt.status === 'Confirmé' ? 'Confirmé' : 'Non confirmé'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div className={`h-full ${apt.risk > 70 ? 'bg-red-500' : apt.risk > 40 ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${apt.risk}%` }} />
                      </div>
                      <span className={`font-bold ${apt.risk > 70 ? 'text-red-600' : apt.risk > 40 ? 'text-yellow-600' : 'text-green-600'}`}>
                        {apt.risk}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
