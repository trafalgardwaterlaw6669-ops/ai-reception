import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Send, 
  Smartphone, 
  Bot, 
  ShieldCheck, 
  Camera, 
  PenTool, 
  User, 
  Check, 
  Sparkles, 
  Upload, 
  Info, 
  ArrowRight,
  ClipboardList,
  Building,
  DollarSign,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { mockPatients } from '@/data/mockDb';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { Patient } from '@/types';

interface IntakeStatus {
  patientId: string;
  medicalHistory: 'Completed' | 'Pending' | 'Not Started';
  consent: 'Completed' | 'Pending' | 'Not Started';
  insurance: 'Completed' | 'Pending' | 'Not Started';
  photos: 'Completed' | 'Pending' | 'Not Started';
  lastActivity?: string;
}

const initialIntakeStatuses: Record<string, IntakeStatus> = {
  'pat_mother': {
    patientId: 'pat_mother',
    medicalHistory: 'Completed',
    consent: 'Pending',
    insurance: 'Completed',
    photos: 'Pending',
    lastActivity: 'Aujourd\'hui, 8h42'
  },
  'pat_husband': {
    patientId: 'pat_husband',
    medicalHistory: 'Not Started',
    consent: 'Not Started',
    insurance: 'Not Started',
    photos: 'Not Started'
  },
  'pat_daughter': {
    patientId: 'pat_daughter',
    medicalHistory: 'Pending',
    consent: 'Pending',
    insurance: 'Completed',
    photos: 'Not Started',
    lastActivity: 'Hier'
  },
  'pat_1': {
    patientId: 'pat_1',
    medicalHistory: 'Completed',
    consent: 'Completed',
    insurance: 'Completed',
    photos: 'Completed',
    lastActivity: 'Il y a 2 jours'
  },
  'pat_2': {
    patientId: 'pat_2',
    medicalHistory: 'Completed',
    consent: 'Completed',
    insurance: 'Pending',
    photos: 'Not Started',
    lastActivity: 'Il y a 3 jours'
  }
};

export function DigitalForms() {
  const [statuses, setStatuses] = useState<Record<string, IntakeStatus>>(initialIntakeStatuses);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('pat_mother');
  const [portalOpen, setPortalOpen] = useState(false);
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
  
  // Patient Portal Wizard States
  const [portalStep, setPortalStep] = useState<'welcome' | 'history' | 'consent' | 'insurance' | 'photos' | 'completed'>('welcome');
  
  // Form responses
  const [medHistory, setMedHistory] = useState({
    allergies: 'Aucune',
    conditions: [] as string[],
    medications: '',
    smoke: 'Non',
    dentalFear: 'Non'
  });
  const [signature, setSignature] = useState('');
  const [insuranceNum, setInsuranceNum] = useState('WAFA-ASSUR-3321');
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);

  const activePatients = patients.length > 0 ? patients : mockPatients;
  const selectedPatient = activePatients.find(p => p.id === selectedPatientId) || activePatients[0];

  const handleSendReminder = (patientId: string) => {
    toast.promise(new Promise(resolve => setTimeout(resolve, 1000)), {
      loading: 'Génération du dossier de pré-admission sécurisé...',
      success: 'Lien d\'admission WhatsApp expédié au patient !',
      error: 'Échec de l\'envoi'
    });
  };

  const handleStartPortalSimulator = (patientId: string) => {
    setSelectedPatientId(patientId);
    setPortalOpen(true);
    setPortalStep('welcome');
    // Pre-populate if mother
    if (patientId === 'pat_mother') {
      setInsuranceNum('WAFA-ASSUR-3321');
    } else if (patientId === 'pat_husband') {
      setInsuranceNum('');
      setMedHistory(prev => ({ ...prev, dentalFear: 'Oui', allergies: 'Aucune', conditions: [] }));
    } else {
      setInsuranceNum('');
    }
  };

  const toggleCondition = (cond: string) => {
    setMedHistory(prev => ({
      ...prev,
      conditions: prev.conditions.includes(cond) 
        ? prev.conditions.filter(c => c !== cond)
        : [...prev.conditions, cond]
    }));
  };

  const simulatePhotoUpload = (type: 'frontal' | 'left' | 'right' | 'insurance' | 'insurance_card') => {
    setIsCapturing(true);
    setTimeout(() => {
      setSelectedPhotos(prev => [...prev, type]);
      setIsCapturing(false);
      toast.success(`Fichier ${type.toUpperCase()} téléversé avec succès !`);
    }, 1200);
  };

  const markStepComplete = (step: 'medicalHistory' | 'consent' | 'insurance' | 'photos', value: 'Completed' | 'Pending') => {
    setStatuses(prev => ({
      ...prev,
      [selectedPatientId]: {
        ...prev[selectedPatientId],
        [step]: value,
        lastActivity: 'À l\'instant'
      }
    }));
  };

  const handleSaveMedHistory = () => {
    markStepComplete('medicalHistory', 'Completed');
    setPortalStep('consent');
    toast.success('Antécédents médicaux enregistrés de manière sécurisée.');
  };

  const handleSaveConsent = () => {
    if (!signature.trim()) {
      toast.error('Veuillez signer pour continuer');
      return;
    }
    markStepComplete('consent', 'Completed');
    setPortalStep('insurance');
    toast.success('Formulaires de consentement signés numériquement.');
  };

  const handleSaveInsurance = () => {
    if (!insuranceNum.trim()) {
      toast.error('Veuillez renseigner votre numéro de police d\'assurance');
      return;
    }
    markStepComplete('insurance', 'Completed');
    setPortalStep('photos');
    toast.success('Attestation d\'assurance analysée et validée.');
  };

  const handleSavePhotos = () => {
    if (selectedPhotos.length < 2) {
      toast.error('Veuillez fournir au moins 2 photos diagnostiques pour l\'évaluation clinique.');
      return;
    }
    markStepComplete('photos', 'Completed');
    setPortalStep('completed');
    toast.success('Photos cliniques analysées et ajoutées au dossier d\'urgence.');
  };

  const handleCompleteIntake = () => {
    setPortalOpen(false);
    toast.success(`Le dossier complet de pré-admission de ${selectedPatient.firstName} a été synchronisé !`);
  };

  return (
    <div className="space-y-6 text-slate-800">
      {/* Header */}
      <div className="text-left sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Formulaires d'Admission Digitaux</h1>
          <p className="mt-2 text-sm text-slate-600">
            Gérez l'admission simplifiée des patients avant leur arrivée : antécédents médicaux, consentements, vérification d'assurance et photos cliniques.
          </p>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Staff Control Room Table */}
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden text-left">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm sm:text-base">Suivi de l'Admission Avant Arrivée</h3>
              </div>
              <span className="text-[10px] bg-indigo-50 border border-indigo-200 rounded-full px-2.5 py-1 text-indigo-700 font-bold flex items-center gap-1">
                <Bot className="h-3.5 w-3.5 animate-pulse" /> Dispatch Auto via WhatsApp
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th scope="col" className="px-5 py-3">Patient</th>
                    <th scope="col" className="px-3 py-3">Antécédents</th>
                    <th scope="col" className="px-3 py-3">Consentement</th>
                    <th scope="col" className="px-3 py-3">Assurance</th>
                    <th scope="col" className="px-3 py-3">Photos (IA)</th>
                    <th scope="col" className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white text-slate-700">
                  {activePatients.map(p => {
                    const status = statuses[p.id] || {
                      patientId: p.id,
                      medicalHistory: 'Not Started',
                      consent: 'Not Started',
                      insurance: 'Not Started',
                      photos: 'Not Started'
                    };

                    const getStatusBadge = (val: 'Completed' | 'Pending' | 'Not Started') => {
                      if (val === 'Completed') {
                        return <span className="inline-flex items-center gap-1 rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-bold text-green-700 border border-green-100">✔ Fait</span>;
                      }
                      if (val === 'Pending') {
                        return <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-100 animate-pulse">⏰ En cours</span>;
                      }
                      return <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">Non commencé</span>;
                    };

                    return (
                      <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-semibold text-slate-900">{p.firstName} {p.lastName}</div>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {status.lastActivity ? `Actif : ${status.lastActivity}` : 'Aucune session active'}
                          </p>
                        </td>
                        <td className="px-3 py-4">{getStatusBadge(status.medicalHistory)}</td>
                        <td className="px-3 py-4">{getStatusBadge(status.consent)}</td>
                        <td className="px-3 py-4">{getStatusBadge(status.insurance)}</td>
                        <td className="px-3 py-4">{getStatusBadge(status.photos)}</td>
                        <td className="px-5 py-4 text-right flex justify-end gap-2">
                          <button
                            onClick={() => handleSendReminder(p.id)}
                            className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                            title="Envoyer le lien d'admission par WhatsApp"
                          >
                            <Send className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleStartPortalSimulator(p.id)}
                            className="px-2.5 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all active:scale-95 flex items-center gap-1 cursor-pointer shadow-sm"
                          >
                            <Smartphone className="h-3.5 w-3.5" /> Simuler Portail
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick info explanation */}
          <div className="p-5 rounded-xl border border-blue-100 bg-blue-50/50 flex items-start gap-3 text-left">
            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="font-bold text-blue-900 text-sm">Pourquoi l'admission avant l'arrivée est capitale</h4>
              <p className="text-xs text-blue-700 leading-relaxed">
                En récoltant à l'avance les informations de santé, les consentements signés et les attestations d'assurance, l'attente en salle retombe à <strong>zéro minute</strong>. Le patient s'installe directement sur le fauteuil de soins dès son arrivée, tandis que l'équipe soignante dispose déjà des éléments diagnostiques.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Portal Simulator Container */}
        <div className="xl:col-span-1">
          {portalOpen ? (
            /* ACTIVE SIMULATOR - Renders a mock iPhone frame representing what the patient sees */
            <div className="border-[8px] border-slate-800 rounded-[36px] bg-slate-50 shadow-2xl relative overflow-hidden h-[640px] flex flex-col">
              {/* iPhone top notch */}
              <div className="absolute top-0 inset-x-0 h-5 bg-slate-800 flex justify-center items-center z-20">
                <div className="w-20 h-3 bg-slate-900 rounded-full" />
              </div>

              {/* iPhone header space */}
              <div className="bg-white border-b border-slate-100 pt-7 pb-3 px-4 flex items-center justify-between shadow-sm flex-none">
                <span className="text-[10px] font-bold text-slate-400">9:41 📱</span>
                <span className="text-xs font-bold text-indigo-600 tracking-wide">Admission AuraDental</span>
                <span className="text-[10px] font-bold text-green-500 flex items-center gap-0.5">Sécurisé SSL 🔒</span>
              </div>

              {/* Patient wizard body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                
                {portalStep === 'welcome' && (
                  <div className="space-y-4 text-center py-6 animate-in fade-in zoom-in-95">
                    <div className="h-16 w-16 bg-indigo-50 text-indigo-600 rounded-2xl mx-auto flex items-center justify-center">
                      <ClipboardList className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-slate-900 text-base">Bienvenue, {selectedPatient.firstName} !</h3>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                        Veuillez prendre 2 minutes pour remplir votre formulaire de pré-admission en ligne avant votre rendez-vous.
                      </p>
                    </div>

                    <div className="space-y-2 bg-white rounded-xl border border-slate-200/60 p-3.5 text-left text-xs">
                      <h4 className="font-bold text-slate-800">Votre parcours :</h4>
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                          <span className="text-slate-600 font-medium">Vérification de l'identité</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-400">2</div>
                          <span className="text-slate-500">Antécédents médicaux</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-400">3</div>
                          <span className="text-slate-500">Consentement électronique</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-400">4</div>
                          <span className="text-slate-500">Couverture d'assurance</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-400">5</div>
                          <span className="text-slate-500">Photos de diagnostic</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setPortalStep('history')}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 text-white py-2.5 text-xs font-bold shadow-md hover:bg-indigo-500 cursor-pointer"
                    >
                      Démarrer <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {portalStep === 'history' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 text-left">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest block">Étape 2 sur 5</span>
                      <h3 className="font-extrabold text-slate-900 text-base">Antécédents Médicaux</h3>
                      <p className="text-[11px] text-slate-500">Précisez vos antécédents de santé pour des soins et anesthésies sécurisés.</p>
                    </div>

                    <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200/60 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Avez-vous des allergies alimentaires ou médicamenteuses ?</label>
                        <input 
                          type="text" 
                          value={medHistory.allergies}
                          onChange={(e) => setMedHistory(prev => ({ ...prev, allergies: e.target.value }))}
                          className="w-full rounded-md border-slate-200 py-1.5 text-xs font-medium text-slate-800 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block font-bold text-slate-700">Avez-vous l'une des affections suivantes ?</label>
                        <div className="grid grid-cols-2 gap-2">
                          {['Diabète', 'Asthme', 'Problème cardiaque', 'Hypertension', 'Coagulation', 'Grossesse'].map(cond => {
                            const active = medHistory.conditions.includes(cond);
                            return (
                              <button
                                key={cond}
                                type="button"
                                onClick={() => toggleCondition(cond)}
                                className={cn(
                                  "py-1.5 px-2 rounded border text-left font-medium text-[10px] transition-colors cursor-pointer",
                                  active ? "bg-indigo-50 border-indigo-300 text-indigo-700" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                                )}
                              >
                                {cond}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Traitements médicaux en cours :</label>
                        <input 
                          type="text" 
                          placeholder="ex. Aucun, ou traitement de tension"
                          value={medHistory.medications}
                          onChange={(e) => setMedHistory(prev => ({ ...prev, medications: e.target.value }))}
                          className="w-full rounded-md border-slate-200 py-1.5 text-xs font-medium text-slate-800 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Appréhension ou peur des soins dentaires ?</label>
                        <div className="flex gap-2">
                          {['Oui', 'Non'].map(val => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setMedHistory(prev => ({ ...prev, dentalFear: val }))}
                              className={cn(
                                "flex-1 py-1 rounded text-center font-bold text-[10px] cursor-pointer",
                                medHistory.dentalFear === val ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              )}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={handleSaveMedHistory}
                      className="w-full inline-flex items-center justify-center gap-1 bg-indigo-600 text-white py-2 rounded-md text-xs font-bold hover:bg-indigo-500 cursor-pointer"
                    >
                      Enregistrer & Étape suivante <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                )}

                {portalStep === 'consent' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 text-left">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest block">Étape 3 sur 5</span>
                      <h3 className="font-extrabold text-slate-900 text-base">Consentement aux Soins</h3>
                      <p className="text-[11px] text-slate-500">Validez les conditions d'examens cliniques préliminaires.</p>
                    </div>

                    <div className="bg-white p-3 rounded-xl border border-slate-200/60 text-[10px] text-slate-500 h-32 overflow-y-auto leading-relaxed space-y-2">
                      <p className="font-bold text-slate-700">1. CONSENTEMENT À L'EXAMEN DIAGNOSTIQUE GÉNÉRAL</p>
                      <p>
                        Je consens par la présente à ce que les praticiens qualifiés d'AuraDental réalisent les examens cliniques, radiographies numériques, photographies intra-orales et thérapies d'hygiène nécessaires.
                      </p>
                      <p className="font-bold text-slate-700">2. CONDITIONS DE TIERS-PAYANT ET ASSURANCE</p>
                      <p>
                        Je certifie l'exactitude des informations transmises. Si j'utilise un tiers-payant (Wafa, AXA, AMO), j'autorise la clinique à télétransmettre mon dossier de prise en charge. Le reste à charge éventuel reste sous ma responsabilité directe.
                      </p>
                    </div>

                    <div className="space-y-2 bg-white p-3.5 rounded-xl border border-slate-200/60 text-xs">
                      <label className="block font-bold text-slate-700">Signer numériquement pour accord</label>
                      <div className="relative border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/50 p-2 text-center h-20 flex flex-col justify-center items-center">
                        <PenTool className="h-4 w-4 text-slate-400 mb-1" />
                        <input 
                          type="text" 
                          placeholder="Saisissez votre prénom et nom" 
                          value={signature}
                          onChange={(e) => setSignature(e.target.value)}
                          className="bg-transparent border-b border-slate-300 text-center text-sm font-semibold italic text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 pb-1 w-5/6"
                        />
                      </div>
                      <p className="text-[9px] text-slate-400 text-center">Fichier certifié conforme.</p>
                    </div>

                    <button
                      onClick={handleSaveConsent}
                      className="w-full inline-flex items-center justify-center gap-1 bg-indigo-600 text-white py-2 rounded-md text-xs font-bold hover:bg-indigo-500 cursor-pointer"
                    >
                      Signer & Étape suivante <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                )}

                {portalStep === 'insurance' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 text-left">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest block">Étape 4 sur 5</span>
                      <h3 className="font-extrabold text-slate-900 text-base">Assurance Dentaire</h3>
                      <p className="text-[11px] text-slate-500">Renseignez vos identifiants pour calculer vos remboursements.</p>
                    </div>

                    <div className="bg-white p-3.5 rounded-xl border border-slate-200/60 text-xs space-y-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Numéro d'affiliation / Police d'assurance</label>
                        <input 
                          type="text" 
                          placeholder="ex. WAFA-ASSUR-3321 ou AXA-MAROC-9921"
                          value={insuranceNum}
                          onChange={(e) => setInsuranceNum(e.target.value)}
                          className="w-full rounded-md border-slate-200 py-1.5 text-xs font-semibold text-slate-800 focus:ring-indigo-500 uppercase"
                        />
                      </div>

                      <div className="p-3 bg-indigo-50 rounded-lg text-[11px] text-indigo-700 space-y-1 text-left">
                        <p className="font-bold flex items-center gap-1">
                          <Bot className="h-3.5 w-3.5" /> Analyse IA Instantanée
                        </p>
                        <p className="leading-normal">
                          Notre système interroge instantanément votre réseau assureur pour simuler votre prise en charge et calculer la part mutuelle en temps réel.
                        </p>
                      </div>

                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => setInsuranceNum('WAFA-ASSUR-3321')}
                          className="text-[10px] text-indigo-600 hover:underline font-bold"
                        >
                          📍 Compléter avec le contrat famille Wafa
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleSaveInsurance}
                      className="w-full inline-flex items-center justify-center gap-1 bg-indigo-600 text-white py-2 rounded-md text-xs font-bold hover:bg-indigo-500 cursor-pointer"
                    >
                      Valider & Étape suivante <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                )}

                {portalStep === 'photos' && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 text-left">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest block">Étape 5 sur 5</span>
                      <h3 className="font-extrabold text-slate-900 text-base">Photos de Diagnostic</h3>
                      <p className="text-[11px] text-slate-500">Fournissez des photos préliminaires de votre dentition pour accélérer l'examen.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      {/* Front Smile */}
                      <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-center flex flex-col justify-between items-center relative overflow-hidden">
                        <span className="text-[9px] font-bold text-slate-400 block mb-1.5">Sourire de face</span>
                        {selectedPhotos.includes('frontal') ? (
                          <div className="bg-green-50 text-green-700 rounded p-1.5 flex flex-col items-center justify-center h-16 w-full">
                            <Check className="h-5 w-5 text-green-500 mb-0.5" />
                            <span className="text-[9px] font-bold">SOURIRE.JPG</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => simulatePhotoUpload('frontal')}
                            className="bg-slate-50 border border-slate-200 text-slate-600 rounded flex flex-col items-center justify-center h-16 w-full hover:bg-indigo-50 cursor-pointer"
                          >
                            <Camera className="h-5 w-5 text-indigo-500 mb-1" />
                            <span className="text-[9px] font-semibold">Prendre</span>
                          </button>
                        )}
                      </div>

                      {/* Left Bite */}
                      <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-center flex flex-col justify-between items-center relative overflow-hidden">
                        <span className="text-[9px] font-bold text-slate-400 block mb-1.5">Profil gauche</span>
                        {selectedPhotos.includes('left') ? (
                          <div className="bg-green-50 text-green-700 rounded p-1.5 flex flex-col items-center justify-center h-16 w-full">
                            <Check className="h-5 w-5 text-green-500 mb-0.5" />
                            <span className="text-[9px] font-bold">PROFIL_G.JPG</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => simulatePhotoUpload('left')}
                            className="bg-slate-50 border border-slate-200 text-slate-600 rounded flex flex-col items-center justify-center h-16 w-full hover:bg-indigo-50 cursor-pointer"
                          >
                            <Camera className="h-5 w-5 text-indigo-500 mb-1" />
                            <span className="text-[9px] font-semibold">Prendre</span>
                          </button>
                        )}
                      </div>

                      {/* Right Bite */}
                      <div className="bg-white border border-slate-200 rounded-lg p-2.5 text-center flex flex-col justify-between items-center relative overflow-hidden col-span-2">
                        <span className="text-[9px] font-bold text-slate-400 block mb-1.5">Photo de carte d'assurance</span>
                        {selectedPhotos.includes('insurance_card') ? (
                          <div className="bg-green-50 text-green-700 rounded p-1.5 flex flex-col items-center justify-center h-16 w-full">
                            <Check className="h-5 w-5 text-green-500 mb-0.5" />
                            <span className="text-[9px] font-bold">CARTE_ASSUR.JPG</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => simulatePhotoUpload('insurance_card')}
                            className="bg-slate-50 border border-slate-200 text-slate-600 rounded flex flex-col items-center justify-center h-16 w-full hover:bg-indigo-50 cursor-pointer"
                          >
                            <Upload className="h-5 w-5 text-indigo-500 mb-1" />
                            <span className="text-[9px] font-semibold">Télécharger l'image</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {isCapturing && (
                      <div className="flex items-center justify-center gap-1.5 text-[10px] text-indigo-600 font-bold py-1 animate-pulse bg-indigo-50 rounded">
                        <RefreshCw className="h-3 w-3 animate-spin" /> Évaluation de l'image par l'IA...
                      </div>
                    )}

                    <button
                      onClick={handleSavePhotos}
                      disabled={selectedPhotos.length < 2}
                      className="w-full inline-flex items-center justify-center gap-1.5 bg-indigo-600 disabled:bg-slate-100 disabled:text-slate-400 text-white py-2 rounded-md text-xs font-bold hover:bg-indigo-500 cursor-pointer transition-all"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Analyser & Finaliser
                    </button>
                  </div>
                )}

                {portalStep === 'completed' && (
                  <div className="space-y-4 text-center py-6 animate-in zoom-in-95">
                    <div className="h-16 w-16 bg-green-50 text-green-600 rounded-full mx-auto flex items-center justify-center border-2 border-green-200 shadow-sm">
                      <Check className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-slate-900 text-base">Admission Validée !</h3>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                        Merci beaucoup, {selectedPatient.firstName} ! Votre questionnaire médical, votre consentement signé, vos justificatifs d'assurance et vos photos diagnostiques ont été ajoutés à votre dossier.
                      </p>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-xl text-left text-xs space-y-2">
                      <p className="font-bold text-slate-800">✅ Synthèse de votre dossier :</p>
                      <ul className="space-y-1.5 text-slate-600 font-medium">
                        <li className="flex items-center gap-1.5">✔ Questionnaire médical complété</li>
                        <li className="flex items-center gap-1.5">✔ Consentement général signé</li>
                        <li className="flex items-center gap-1.5">✔ Tiers-payant approuvé ({insuranceNum})</li>
                        <li className="flex items-center gap-1.5">✔ Photos de diagnostic téléversées</li>
                      </ul>
                    </div>

                    <button
                      onClick={handleCompleteIntake}
                      className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 text-white py-2.5 text-xs font-bold shadow-md hover:bg-indigo-500 cursor-pointer"
                    >
                      Terminer & Enregistrer
                    </button>
                  </div>
                )}

              </div>

              {/* iPhone home bar indicator */}
              <div className="bg-white pb-2 flex justify-center items-center flex-none">
                <div className="w-28 h-1 bg-slate-300 rounded-full mt-1" />
              </div>
            </div>
          ) : (
            /* DEFAULT SIMULATOR SELECTION STATE */
            <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 h-[640px] flex flex-col justify-center items-center text-center space-y-4">
              <div className="bg-indigo-500/10 p-3.5 rounded-2xl">
                <Smartphone className="h-8 w-8 text-indigo-400" />
              </div>
              <div className="space-y-1 max-w-xs">
                <h3 className="font-bold text-base text-slate-100">Portail d'Admission Patient</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sélectionnez un patient dans le tableau de suivi, puis cliquez sur <strong>"Simuler Portail"</strong> pour lancer le portail d'admission patient autonome.
                </p>
              </div>
              <button
                onClick={() => handleStartPortalSimulator('pat_mother')}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition-all active:scale-95 cursor-pointer"
              >
                Simuler Amina Alami (Maman)
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
