import { useParams, Link } from 'react-router';
import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  Calendar, 
  Clock, 
  FileText, 
  MessageSquare,
  AlertCircle,
  Users,
  Bot,
  Sparkles,
  Smile,
  CheckSquare,
  User,
  Heart,
  Volume2,
  BellRing,
  Brain,
  Trash2,
  Plus,
  Zap
} from 'lucide-react';
import { mockPatients, mockAppointments } from '@/data/mockDb';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { InsuranceVerification } from '@/components/InsuranceVerification';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';

export function PatientDetails() {
  const { id } = useParams();
  const [realPatient, setRealPatient] = useState<any>(null);
  const [realAppointments, setRealAppointments] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    const unsubPatient = onSnapshot(doc(db, 'patients', id), (docSnap) => {
      if (docSnap.exists()) {
        setRealPatient({ id: docSnap.id, ...docSnap.data() });
      }
    });

    const q = query(collection(db, 'appointments'), where('patientId', '==', id));
    const unsubApts = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setRealAppointments(fetched);
    });

    return () => {
      unsubPatient();
      unsubApts();
    };
  }, [id]);

  const patient = realPatient || mockPatients.find(p => p.id === id);
  const patientAppointments = [
    ...realAppointments,
    ...mockAppointments.filter(a => a.patientId === id)
  ].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i)
   .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Family Scheduling Simulator States
  const [simStep, setSimStep] = useState<number>(0);
  const [familyApts, setFamilyApts] = useState<any[]>([]);
  const isAlamiFamily = id === 'pat_mother' || id === 'pat_husband' || id === 'pat_daughter';

  // AI Memories state
  const [memories, setMemories] = useState<any[]>([]);
  const [newPrefText, setNewPrefText] = useState('');
  const [newPrefCat, setNewPrefCat] = useState<'Scheduling' | 'Communication' | 'Clinical/Care' | 'Special Needs' | 'Family'>('Scheduling');

  useEffect(() => {
    if (!id) return;
    const q = query(collection(db, 'aiMemories'), where('patientId', '==', id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMemories(fetched);
    }, (error) => {
      console.error("Error loading patient memories:", error);
    });
    return () => unsubscribe();
  }, [id]);

  const handleAddPatientPref = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrefText.trim() || !patient) return;
    try {
      await addDoc(collection(db, 'aiMemories'), {
        patientId: patient.id,
        patientName: `${patient.firstName} ${patient.lastName}`,
        preferenceText: newPrefText.trim(),
        category: newPrefCat,
        extractedFrom: 'Staff Profile Entry',
        confidenceScore: 100,
        timestamp: new Date().toISOString()
      });
      toast.success("AI Memory added!");
      setNewPrefText('');
    } catch (err) {
      console.error(err);
      toast.error("Failed to add memory");
    }
  };

  const handleDeletePatientPref = async (prefId: string) => {
    try {
      await deleteDoc(doc(db, 'aiMemories', prefId));
      toast.info("AI Memory entry deleted");
    } catch (err) {
      console.error(err);
    }
  };

  const startFamilySimulation = () => {
    setSimStep(1);
    toast.info("Simulating incoming phone call from Amina Alami...", { duration: 3000 });
    setTimeout(() => {
      setSimStep(2);
    }, 2500);
  };

  const nextStepSimulation = () => {
    if (simStep === 2) {
      setSimStep(3);
    } else if (simStep === 3) {
      // Complete booking
      setFamilyApts([
        { id: 'f_1', name: 'Khalid Alami (Husband)', time: '10:00 AM', procedure: 'Checkup', status: 'Confirmed' },
        { id: 'f_2', name: 'Kenza Alami (Daughter)', time: '10:30 AM', procedure: 'Cleaning & Fluoride', status: 'Confirmed' },
        { id: 'f_3', name: 'Amina Alami (Mother)', time: '11:00 AM', procedure: 'Checkup & Consultation', status: 'Confirmed' },
      ]);
      setSimStep(4);
      toast.success("Unified Family Block scheduled & WhatsApp invitations dispatched!", { duration: 4000 });
    }
  };

  const resetSimulation = () => {
    setSimStep(0);
    setFamilyApts([]);
  };

  if (!patient) {
    return (
      <div className="text-center py-12">
        <h2 className="text-base font-semibold leading-7 text-slate-900">Patient non trouvé</h2>
        <p className="mt-1 text-sm leading-6 text-slate-500">Nous n'avons pas pu trouver le patient que vous recherchez.</p>
        <Link to="/patients" className="mt-6 text-sm font-semibold leading-6 text-blue-600 hover:text-blue-500">
          <span aria-hidden="true">&larr;</span> Retour au répertoire
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link to="/patients" className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft className="h-4 w-4" /> Retour aux Patients
        </Link>
        <div className="sm:flex sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-2xl font-bold">
              {patient.firstName[0]}{patient.lastName[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                {patient.firstName} {patient.lastName}
              </h1>
              <div className="mt-1 flex items-center gap-3 text-sm text-slate-500">
                <span className="flex items-center gap-1"><Phone className="h-4 w-4" /> {patient.phone}</span>
                <span className="flex items-center gap-1"><Mail className="h-4 w-4" /> {patient.email}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 flex gap-3">
            <button className="inline-flex items-center gap-x-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50">
              <MessageSquare className="-ml-0.5 h-4 w-4 text-slate-400" />
              WhatsApp
            </button>
            <button className="inline-flex items-center gap-x-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500">
              <Calendar className="-ml-0.5 h-4 w-4" />
              Prendre RDV
            </button>
          </div>
        </div>
      </div>


      {isAlamiFamily && (
        <div className="bg-gradient-to-br from-slate-50 to-indigo-50 border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 text-white p-2.5 rounded-xl">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase">Groupe Multi-Patients</span>
                <h2 className="text-xl font-bold text-slate-900">Espace Famille Alami</h2>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-200 rounded-full px-3 py-1 text-xs font-semibold text-indigo-700">
              <Bot className="h-4 w-4" />
              Planification croisée en un clic prête
            </div>
          </div>

          {/* Family Profiles Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Mother Card */}
            <Link to="/patients/pat_mother" className={cn(
              "p-4 rounded-xl border bg-white shadow-sm transition-all relative overflow-hidden block hover:border-indigo-300",
              id === 'pat_mother' ? 'ring-2 ring-indigo-600 border-indigo-200' : 'border-slate-200'
            )}>
              {id === 'pat_mother' && <span className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl">Vue active</span>}
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs">AA</div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">Amina Alami</h4>
                  <p className="text-xs text-slate-500">Mère (Appelante)</p>
                </div>
              </div>
              <div className="space-y-1.5 mt-3 text-xs">
                <p className="text-slate-600 flex items-center gap-1">📞 +212 6 55 44 33 22</p>
                <span className="inline-flex items-center gap-1 rounded bg-green-50 px-1.5 py-0.5 font-semibold text-green-700 border border-green-100">
                  ● À jour
                </span>
              </div>
            </Link>

            {/* Husband Card */}
            <Link to="/patients/pat_husband" className={cn(
              "p-4 rounded-xl border bg-white shadow-sm transition-all relative overflow-hidden block hover:border-indigo-300",
              id === 'pat_husband' ? 'ring-2 ring-indigo-600 border-indigo-200' : 'border-slate-200'
            )}>
              {id === 'pat_husband' && <span className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl">Vue active</span>}
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs">KA</div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">Khalid Alami</h4>
                  <p className="text-xs text-slate-500">Époux</p>
                </div>
              </div>
              <div className="space-y-1.5 mt-3 text-xs">
                <p className="text-slate-600 flex items-center gap-1">📞 +212 6 55 44 33 23</p>
                <span className="inline-flex items-center gap-1 rounded bg-red-50 px-1.5 py-0.5 font-semibold text-red-700 border border-red-200 animate-pulse">
                  ⚠️ En retard (Contrôle)
                </span>
                <p className="text-[10px] text-slate-400 font-medium italic mt-1">Dû depuis : 8 mois</p>
              </div>
            </Link>

            {/* Daughter Card */}
            <Link to="/patients/pat_daughter" className={cn(
              "p-4 rounded-xl border bg-white shadow-sm transition-all relative overflow-hidden block hover:border-indigo-300",
              id === 'pat_daughter' ? 'ring-2 ring-indigo-600 border-indigo-200' : 'border-slate-200'
            )}>
              {id === 'pat_daughter' && <span className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-bl">Vue active</span>}
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs">KZA</div>
                <div>
                  <h4 className="font-semibold text-slate-900 text-sm">Kenza Alami</h4>
                  <p className="text-xs text-slate-500">Fille (10 ans)</p>
                </div>
              </div>
              <div className="space-y-1.5 mt-3 text-xs">
                <p className="text-slate-600 flex items-center gap-1">📞 +212 6 55 44 33 24</p>
                <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-1.5 py-0.5 font-semibold text-amber-700 border border-amber-200">
                  ⚠️ Détartrage Recommandé
                </span>
                <p className="text-[10px] text-slate-400 font-medium italic mt-1">Statut : Rappel périodique déclenché</p>
              </div>
            </Link>
          </div>

          {/* SIMULATOR STEPPER */}
          <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Espace d'entraînement interactif</span>
              </div>
              {simStep > 0 && (
                <button 
                  onClick={resetSimulation} 
                  className="text-xs text-slate-400 hover:text-white transition-colors underline"
                >
                  Réinitialiser la simulation
                </button>
              )}
            </div>

            {simStep === 0 && (
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="font-bold text-base text-slate-100 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-indigo-400" />
                    Scénario : Intervention de planification familiale
                  </h3>
                  <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
                    Testez la planification proactive de l'IA de réception. Lorsque la maman Amina appelle, le système croise instantanément les fichiers pour détecter le contrôle en retard de Khalid et le détartrage de Kenza afin de proposer un créneau familial unifié.
                  </p>
                </div>
                <button
                  onClick={startFamilySimulation}
                  className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-4 py-2.5 rounded-lg shadow transition-all active:scale-95 flex-none cursor-pointer"
                >
                  <Volume2 className="h-4 w-4" /> Simuler l'appel
                </button>
              </div>
            )}

            {simStep === 1 && (
              <div className="flex items-center gap-3 py-2 animate-pulse">
                <div className="h-6 w-6 bg-indigo-500/20 rounded-full flex items-center justify-center">
                  <Volume2 className="h-4 w-4 text-indigo-400" />
                </div>
                <span className="text-sm text-slate-300 font-medium">Amina Alami appelle la ligne IA du cabinet...</span>
              </div>
            )}

            {simStep === 2 && (
              <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between bg-indigo-950/40 p-3 rounded-lg border border-indigo-900/50">
                  <div className="flex items-center gap-2 text-indigo-300">
                    <Bot className="h-5 w-5" />
                    <span className="text-xs font-bold uppercase tracking-wider">Analyse de l'IA en temps réel</span>
                  </div>
                  <span className="text-[10px] bg-indigo-900 text-indigo-200 px-2 py-0.5 rounded-full font-bold">Retard de contrôle détecté</span>
                </div>
                <div className="bg-slate-800/80 p-3.5 rounded-lg font-mono text-xs text-slate-300 border border-slate-700/50 space-y-2">
                  <p className="text-indigo-400 font-bold">&gt; [Moteur de contexte chargé pour Amina Alami]</p>
                  <p className="text-emerald-400 font-bold">&gt; Correspondance trouvée : 2 membres de la famille liés en base de données</p>
                  <p className="text-amber-400">&gt; L'époux Khalid Alami est en retard depuis Nov 2025</p>
                  <p className="text-amber-400">&gt; La fille Kenza Alami doit passer son contrôle/détartrage annuel</p>
                  <p className="text-indigo-400 font-bold">&gt; Action suggérée : Offre de groupe de rendez-vous groupés</p>
                </div>
                <div className="flex justify-end mt-2">
                  <button 
                    onClick={nextStepSimulation}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs px-4 py-2 rounded-md transition-colors cursor-pointer"
                  >
                    L'IA parle : Proposer le créneau familial &rarr;
                  </button>
                </div>
              </div>
            )}

            {simStep === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="space-y-2.5">
                  <div className="bg-indigo-950/60 p-4 rounded-xl border border-indigo-900/60">
                    <div className="flex items-center gap-2 mb-2 text-xs font-bold text-indigo-400 uppercase">
                      <Bot className="h-4 w-4" /> Réponse Vocale de la Secrétaire Virtuelle IA
                    </div>
                    <p className="text-sm text-slate-100 font-medium leading-relaxed italic">
                      "Bonjour Amina ! Oui, je serais ravie de vous aider à planifier une visite de routine. Comme j'ai votre dossier familial sous les yeux, j'ai remarqué que votre époux Khalid a un retard de 8 mois sur son contrôle et que votre fille Kenza doit passer son détartrage annuel. <strong>Souhaitez-vous que je planifie les rendez-vous de toute la famille à la suite</strong> ce jeudi matin afin que vous ne fassiez qu'un seul déplacement ?"
                    </p>
                  </div>

                  <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
                    <div className="flex items-center gap-2 mb-1 text-xs font-bold text-indigo-400 uppercase">
                      <User className="h-4 w-4" /> Réponse de la maman Amina
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed italic">
                      "Oh, c'est vraiment très attentionné de votre part ! Oui, s'il vous plaît, planifiez toute la famille ensemble. Ce jeudi matin serait parfait."
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button 
                    onClick={nextStepSimulation}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-lg shadow transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Calendar className="h-4 w-4" /> Planifier le bloc familial unifié
                  </button>
                </div>
              </div>
            )}

            {simStep === 4 && (
              <div className="space-y-4 animate-in zoom-in-95 duration-300">
                <div className="bg-emerald-950/40 p-4 rounded-xl border border-emerald-900/50 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <CheckSquare className="h-5 w-5" />
                    Réservation du Bloc Familial Réussie !
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    L'IA a réservé trois créneaux consécutifs pour ce jeudi matin. Cela optimise l'emploi du temps du praticien et évite les temps morts tout en simplifiant la vie de la famille.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                    {familyApts.map(apt => (
                      <div key={apt.id} className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 flex flex-col justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-200">{apt.name}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{apt.procedure === 'Checkup' ? 'Contrôle de routine' : apt.procedure === 'Cleaning & Fluoride' ? 'Détartrage & Fluor' : 'Contrôle & Consultation'}</p>
                        </div>
                        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800">
                          <span className="text-[10px] text-indigo-300 font-bold bg-indigo-950 px-2 py-0.5 rounded-full">{apt.time === '10:00 AM' ? '10h00' : apt.time === '10:30 AM' ? '10h30' : '11h00'}</span>
                          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">● Confirmé</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-indigo-950/40 p-4 rounded-xl border border-indigo-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-indigo-400 flex-shrink-0" />
                    <span>Confirmation de groupe unifiée envoyée par WhatsApp avec itinéraires d'accès et consignes de préparation.</span>
                  </div>
                  <button 
                    onClick={resetSimulation}
                    className="text-indigo-400 hover:text-indigo-300 font-bold underline cursor-pointer"
                  >
                    Relancer la simulation
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Details */}
        <div className="space-y-6 lg:col-span-1">
          {/* Medical Notes */}
          <div className="rounded-xl bg-white shadow-sm border border-slate-200 overflow-hidden text-left">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-4 sm:px-6 flex items-center gap-2">
              <FileText className="h-5 w-5 text-slate-500" />
              <h3 className="text-base font-semibold leading-6 text-slate-900">Dossier Médical</h3>
            </div>
            <div className="px-4 py-5 sm:p-6 space-y-4 text-sm">
              <div>
                <dt className="font-medium text-slate-900">Date de Naissance</dt>
                <dd className="mt-1 text-slate-600">{new Date(patient.birthDate).toLocaleDateString('fr-FR')}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-900">Langue préférée</dt>
                <dd className="mt-1 text-slate-600">{patient.preferredLanguage === 'French' ? 'Français' :
                                                        patient.preferredLanguage === 'Darija' ? 'Darija Marocain' :
                                                        patient.preferredLanguage === 'Arabic' ? 'Arabe Classique' : patient.preferredLanguage}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-900 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4 text-amber-500" /> Notes Cliniques
                </dt>
                <dd className="mt-1 text-slate-600 bg-amber-50 p-3 rounded-md border border-amber-100">
                  {patient.medicalNotes}
                </dd>
              </div>
            </div>
          </div>

          {/* AI Patient Memory Card */}
          <div className="rounded-xl bg-gradient-to-b from-slate-900 to-slate-950 text-white shadow-sm border border-slate-800 overflow-hidden text-left">
            <div className="border-b border-slate-800 bg-slate-900/50 px-4 py-4 sm:px-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-400 fill-blue-500/20" />
                <h3 className="text-base font-semibold leading-6 text-slate-100">Mémoire active de l'IA</h3>
              </div>
              <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                {memories.length} Garde-fous
              </span>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Préférences critiques des patients extraites des appels et chats. La Secrétaire IA intercepte les opérations conflictuelles pour nous assurer de <strong>ne jamais demander deux fois</strong>.
              </p>

              {/* Memory List */}
              {memories.length > 0 ? (
                <div className="space-y-2">
                  {memories.map((pref) => {
                    const getCategoryColor = (cat: string) => {
                      switch (cat) {
                        case 'Scheduling': return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
                        case 'Communication': return 'bg-sky-500/10 text-sky-300 border-sky-500/20';
                        case 'Clinical/Care': return 'bg-purple-500/10 text-purple-300 border-purple-500/20';
                        case 'Special Needs': return 'bg-rose-500/10 text-rose-300 border-rose-500/20';
                        default: return 'bg-teal-500/10 text-teal-300 border-teal-500/20';
                      }
                    };

                    const categoryFr = (cat: string) => {
                      switch (cat) {
                        case 'Scheduling': return 'Planification';
                        case 'Communication': return 'Communication';
                        case 'Clinical/Care': return 'Soin/Clinique';
                        case 'Special Needs': return 'Besoins Spécifiques';
                        default: return cat;
                      }
                    };

                    return (
                      <div key={pref.id} className="bg-slate-900 border border-slate-800 p-3 rounded-lg flex items-center justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "px-1.5 py-0.5 rounded border text-[8px] font-bold uppercase",
                              getCategoryColor(pref.category)
                            )}>
                              {categoryFr(pref.category)}
                            </span>
                            <span className="text-[9px] text-slate-500">Confiance : {pref.confidenceScore}%</span>
                          </div>
                          <p className="font-bold text-slate-100 italic">"{pref.preferenceText}"</p>
                        </div>
                        <button
                          onClick={() => handleDeletePatientPref(pref.id)}
                          className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors cursor-pointer"
                          title="Oublier"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-slate-900/60 p-4 rounded-lg border border-slate-800/80 text-center text-xs text-slate-400">
                  Aucune préférence mémorisée pour l'instant. Utilisez le formulaire ci-dessous pour ajouter une consigne.
                </div>
              )}

              {/* Quick Add Form */}
              <form onSubmit={handleAddPatientPref} className="pt-3 border-t border-slate-800/60 space-y-2 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Mémoriser une consigne</label>
                  <input
                    type="text"
                    placeholder="Ex: Préfère les appels au lieu des SMS."
                    value={newPrefText}
                    onChange={(e) => setNewPrefText(e.target.value)}
                    className="w-full rounded-md border-slate-800 bg-slate-900 text-white placeholder-slate-500 text-xs font-semibold p-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={newPrefCat}
                    onChange={(e) => setNewPrefCat(e.target.value as any)}
                    className="flex-1 rounded-md border-slate-800 bg-slate-900 text-slate-300 text-[11px] font-semibold p-1.5"
                  >
                    <option value="Scheduling">Planification</option>
                    <option value="Communication">Communication</option>
                    <option value="Clinical/Care">Soin/Clinique</option>
                    <option value="Special Needs">Besoins Spécifiques</option>
                    <option value="Family">Famille</option>
                  </select>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded-md flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Ajouter
                  </button>
                </div>
              </form>

              {/* Link to AI Memory Hub */}
              <div className="pt-2">
                <Link
                  to="/ai-memory"
                  className="w-full inline-flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2 rounded-lg transition-colors border border-slate-700"
                >
                  <Zap className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                  Lancer le Hub de Mémoire IA &rarr;
                </Link>
              </div>
            </div>
          </div>

          {/* AI Insurance Verification Engine */}
          <InsuranceVerification 
            patientId={patient.id} 
            patientName={`${patient.firstName} ${patient.lastName}`} 
          />
        </div>

        {/* Right Column: History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Appointments */}
          <div className="rounded-xl bg-white shadow-sm border border-slate-200 overflow-hidden text-left">
            <div className="border-b border-slate-200 px-4 py-4 sm:px-6 flex justify-between items-center">
              <h3 className="text-base font-semibold leading-6 text-slate-900">Historique des Rendez-vous</h3>
            </div>
            <ul className="divide-y divide-slate-100">
              {patientAppointments.length > 0 ? (
                patientAppointments.map((apt) => (
                  <li key={apt.id} className="flex items-center justify-between gap-x-6 px-4 py-5 sm:px-6 hover:bg-slate-50 transition-colors">
                    <div className="min-w-0">
                      <div className="flex items-start gap-x-3">
                        <p className="text-sm font-semibold leading-6 text-slate-900">
                          {apt.type === 'Checkup' ? 'Contrôle' :
                           apt.type === 'Cleaning' ? 'Détartrage' :
                           apt.type === 'Root Canal' ? 'Traitement de canal' :
                           apt.type === 'Consultation' ? 'Consultation' :
                           apt.type === 'Emergency' ? 'Urgence' : apt.type}
                        </p>
                        <p className={cn(
                          'rounded-md whitespace-nowrap mt-0.5 px-1.5 py-0.5 text-xs font-medium ring-1 ring-inset',
                          apt.status === 'Completed' ? 'text-green-700 bg-green-50 ring-green-600/20' :
                          apt.status === 'Confirmed' ? 'text-blue-700 bg-blue-50 ring-blue-600/20' :
                          apt.status === 'Cancelled' ? 'text-red-700 bg-red-50 ring-red-600/10' :
                          'text-yellow-800 bg-yellow-50 ring-yellow-600/20'
                        )}>
                          {apt.status === 'Completed' ? 'Complété' :
                           apt.status === 'Confirmed' ? 'Confirmé' :
                           apt.status === 'Cancelled' ? 'Annulé' : apt.status}
                        </p>
                      </div>
                      <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-slate-500">
                        <p className="whitespace-nowrap">
                          {new Date(apt.date).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}
                        </p>
                        <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current"><circle cx={1} cy={1} r={1} /></svg>
                        <p className="truncate flex items-center gap-1"><Clock className="h-3 w-3" /> {apt.durationMinutes} min</p>
                      </div>
                      {apt.notes && (
                        <p className="mt-2 text-sm text-slate-600">{apt.notes}</p>
                      )}
                    </div>
                  </li>
                ))
              ) : (
                <li className="px-4 py-8 text-center text-sm text-slate-500">
                  Aucun rendez-vous trouvé pour ce patient.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
