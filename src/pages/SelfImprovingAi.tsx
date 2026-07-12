import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  HelpCircle, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  ArrowRight, 
  Search, 
  MessageSquare, 
  Database, 
  Activity, 
  FileText, 
  Lightbulb, 
  RefreshCw, 
  Edit3, 
  ChevronRight,
  Brain,
  AlertCircle,
  ThumbsUp,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { 
  collection, 
  query, 
  onSnapshot, 
  addDoc, 
  doc, 
  deleteDoc, 
  updateDoc, 
  writeBatch 
} from 'firebase/firestore';

export interface UnansweredQuestion {
  id: string;
  question: string;
  category: 'Pricing' | 'Services' | 'Facility' | 'Policies' | 'Staff' | 'Other';
  count: number;
  status: 'pending' | 'resolved' | 'ignored';
  suggestedAnswer: string;
  approvedAnswer?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClinicFact {
  id: string;
  topic: string;
  content: string;
  updatedAt: string;
}

export function SelfImprovingAi() {
  const [unanswered, setUnanswered] = useState<UnansweredQuestion[]>([]);
  const [facts, setFacts] = useState<ClinicFact[]>([]);
  const [loadingUnanswered, setLoadingUnanswered] = useState(true);
  const [loadingFacts, setLoadingFacts] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [factSearchTerm, setFactSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Modal / Form states
  const [answeringQuestion, setAnsweringQuestion] = useState<UnansweredQuestion | null>(null);
  const [manualFactOpen, setManualFactOpen] = useState(false);
  
  // Fact Form states
  const [factTopic, setFactTopic] = useState('');
  const [factContent, setFactContent] = useState('');
  const [editingFactId, setEditingFactId] = useState<string | null>(null);

  // Playground / Simulator states
  const [sandboxQuestion, setSandboxQuestion] = useState('Avez-vous un parking gratuit ?');
  const [simulating, setSimulating] = useState(false);
  const [simOutput, setSimOutput] = useState<{
    status: 'learned' | 'unknown';
    answer: string;
    sourceFact?: string;
  } | null>(null);

  // Seed default data for unanswered questions and facts
  const handleSeedData = async () => {
    try {
      setLoadingUnanswered(true);
      setLoadingFacts(true);
      const batch = writeBatch(db);

      // Seed Questions
      const questionsCol = collection(db, 'unanswered_questions');
      const seedQuestions: Omit<UnansweredQuestion, 'id'>[] = [
        {
          question: "Avez-vous un parking gratuit pour les patients ?",
          category: "Facility",
          count: 5,
          status: "pending",
          suggestedAnswer: "Oui, un parking souterrain sécurisé est mis gracieusement à disposition de nos patients au pied de l'immeuble.",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
        },
        {
          question: "Proposez-vous le blanchiment des dents ou les facettes ?",
          category: "Services",
          count: 4,
          status: "pending",
          suggestedAnswer: "Oui, nous proposons le blanchiment dentaire ZOOM de Philips et la pose de facettes en céramique E-max sur mesure.",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString()
        },
        {
          question: "Êtes-vous ouvert le dimanche pour les urgences dentaires ?",
          category: "Policies",
          count: 3,
          status: "pending",
          suggestedAnswer: "Nous sommes fermés le dimanche, mais une ligne téléphonique d'urgence est active pour conseiller nos patients réguliers.",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString()
        },
        {
          question: "Y a-t-il un dentiste pédiatrique dans votre équipe ?",
          category: "Staff",
          count: 2,
          status: "pending",
          suggestedAnswer: "Oui, le Dr. Laila est notre spécialiste certifiée en pédodontie, dédiée aux soins dentaires pour enfants.",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
        },
        {
          question: "Proposez-vous des facilités de paiement ou des mensualités sans intérêt ?",
          category: "Pricing",
          count: 6,
          status: "pending",
          suggestedAnswer: "Oui, la clinique offre des plans de paiement flexibles et échelonnés sans frais jusqu'à 12 mois pour l'orthodontie et les implants.",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
          updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString()
        }
      ];

      seedQuestions.forEach(q => {
        const docRef = doc(questionsCol);
        batch.set(docRef, q);
      });

      // Seed Initial Facts
      const factsCol = collection(db, 'clinic_knowledge');
      const seedFacts: Omit<ClinicFact, 'id'>[] = [
        {
          topic: "Heures d'ouverture",
          content: "Le cabinet dentaire du Dr. Smith est ouvert du lundi au vendredi de 9h00 à 18h00, et le samedi de 9h00 à 13h00. Nous sommes fermés le dimanche.",
          updatedAt: new Date().toISOString()
        },
        {
          topic: "Langues parlées au cabinet",
          content: "Notre équipe médicale ainsi que notre secrétaire virtuelle parlent couramment la Darija marocaine, le Français et l'Anglais pour s'adapter aux préférences de chaque patient.",
          updatedAt: new Date().toISOString()
        }
      ];

      seedFacts.forEach(f => {
        const docRef = doc(factsCol);
        batch.set(docRef, f);
      });

      await batch.commit();
      console.log("Base de connaissances IA initialisée automatiquement !");
    } catch (err) {
      console.error("Error seeding AI data:", err);
    } finally {
      setLoadingUnanswered(false);
      setLoadingFacts(false);
    }
  };

  // Load unanswered questions from Firestore
  useEffect(() => {
    const q = query(collection(db, 'unanswered_questions'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        handleSeedData();
        return;
      }
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UnansweredQuestion[];
      
      fetched.sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });

      setUnanswered(fetched);
      setLoadingUnanswered(false);
    }, (error) => {
      console.error("Error fetching unanswered questions:", error);
      toast.error("Échec du chargement des questions.");
      setLoadingUnanswered(false);
    });

    return () => unsubscribe();
  }, []);

  // Load clinic knowledge facts from Firestore
  useEffect(() => {
    const q = query(collection(db, 'clinic_knowledge'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ClinicFact[];
      
      fetched.sort((a, b) => a.topic.localeCompare(b.topic));
      setFacts(fetched);
      setLoadingFacts(false);
    }, (error) => {
      console.error("Error fetching clinic knowledge:", error);
      toast.error("Échec du chargement de la base de connaissances.");
      setLoadingFacts(false);
    });

    return () => unsubscribe();
  }, []);

  // Submit Answer & Promote to Clinic Knowledge
  const handleApproveAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answeringQuestion) return;
    if (!factContent.trim()) {
      toast.error("La réponse approuvée ne peut pas être vide.");
      return;
    }

    try {
      const factTopicFormatted = answeringQuestion.question.replace(/[?]/g, '').trim();
      await addDoc(collection(db, 'clinic_knowledge'), {
        topic: factTopicFormatted,
        content: factContent.trim(),
        updatedAt: new Date().toISOString()
      });

      await updateDoc(doc(db, 'unanswered_questions', answeringQuestion.id), {
        status: 'resolved',
        approvedAnswer: factContent.trim(),
        updatedAt: new Date().toISOString()
      });

      toast.success("Connaissance approuvée ! La secrétaire virtuelle est mise à jour instantanément.", {
        icon: <Sparkles className="text-amber-500 fill-amber-500" />
      });
      setAnsweringQuestion(null);
      setFactContent('');
    } catch (err) {
      console.error("Error approving answer:", err);
      toast.error("Échec de la validation de la réponse.");
    }
  };

  // Add/Edit Manual Fact
  const handleSaveManualFact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factTopic.trim() || !factContent.trim()) {
      toast.error("Le sujet et le contenu sont obligatoires.");
      return;
    }

    try {
      if (editingFactId) {
        await updateDoc(doc(db, 'clinic_knowledge', editingFactId), {
          topic: factTopic.trim(),
          content: factContent.trim(),
          updatedAt: new Date().toISOString()
        });
        toast.success("Fiche de connaissances mise à jour avec succès.");
      } else {
        await addDoc(collection(db, 'clinic_knowledge'), {
          topic: factTopic.trim(),
          content: factContent.trim(),
          updatedAt: new Date().toISOString()
        });
        toast.success("Nouvelle information apprise par l'IA !");
      }

      setFactTopic('');
      setFactContent('');
      setEditingFactId(null);
      setManualFactOpen(false);
    } catch (err) {
      console.error("Error saving manual fact:", err);
      toast.error("Échec de l'enregistrement de l'information.");
    }
  };

  const handleDeleteFact = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'clinic_knowledge', id));
      toast.info("Information retirée de la base de connaissances.");
    } catch (err) {
      console.error("Error deleting fact:", err);
      toast.error("Échec de la suppression.");
    }
  };

  const handleIgnoreQuestion = async (id: string) => {
    try {
      await updateDoc(doc(db, 'unanswered_questions', id), {
        status: 'ignored',
        updatedAt: new Date().toISOString()
      });
      toast.info("Question écartée du tableau d'apprentissage.");
    } catch (err) {
      console.error("Error dismissing question:", err);
      toast.error("Échec du masquage.");
    }
  };

  // Interactive Learning Simulator
  const handleAskSimulator = () => {
    if (!sandboxQuestion.trim()) return;
    setSimulating(true);
    setSimOutput(null);

    setTimeout(() => {
      const q = sandboxQuestion.toLowerCase().trim();
      
      const matchedFact = facts.find(fact => {
        const topicWords = fact.topic.toLowerCase().split(' ');
        const matchedWordCount = topicWords.filter(word => word.length > 3 && q.includes(word)).length;
        return matchedWordCount >= 1 || q.includes(fact.topic.toLowerCase()) || fact.content.toLowerCase().includes(q);
      });

      if (matchedFact) {
        setSimOutput({
          status: 'learned',
          answer: matchedFact.content,
          sourceFact: matchedFact.topic
        });
        toast.success("L'IA a formulé la réponse grâce à votre base de connaissances !");
      } else {
        setSimOutput({
          status: 'unknown',
          answer: "Je suis désolé, je ne dispose pas encore de cette information spécifique pour le cabinet AuraDental. Laissez-moi me renseigner auprès du coordinateur clinique, ou préférez-vous que je vous fixe un rendez-vous ?"
        });

        const questionExists = unanswered.some(u => u.question.toLowerCase() === q || q.includes(u.question.toLowerCase()));
        if (!questionExists) {
          addDoc(collection(db, 'unanswered_questions'), {
            question: sandboxQuestion.trim(),
            category: "Other",
            count: 1,
            status: "pending",
            suggestedAnswer: "Pas encore de suggestion automatique rédigée.",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }).then(() => {
            console.log("Logged new unanswered question through sandbox simulator");
          }).catch(err => {
            console.error("Error logging unanswered question:", err);
          });
        }

        toast.warning("L'IA n'a pas pu répondre ! Question ajoutée à la liste des lacunes à résoudre.", {
          duration: 4000
        });
      }
      setSimulating(false);
    }, 1200);
  };

  const categories = ['All', 'Pricing', 'Services', 'Facility', 'Policies', 'Staff', 'Other'];
  
  const translateCategory = (cat: string) => {
    if (cat === 'All') return 'Tous';
    if (cat === 'Pricing') return 'Tarifs';
    if (cat === 'Services') return 'Prestations';
    if (cat === 'Facility') return 'Équipements';
    if (cat === 'Policies') return 'Règles';
    if (cat === 'Staff') return 'Équipe';
    if (cat === 'Other') return 'Autre';
    return cat;
  };

  const filteredUnanswered = unanswered.filter(u => {
    const matchesSearch = u.question.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || u.category === selectedCategory;
    const isPending = u.status === 'pending';
    return matchesSearch && matchesCategory && isPending;
  });

  const filteredFacts = facts.filter(f => 
    f.topic.toLowerCase().includes(factSearchTerm.toLowerCase()) || 
    f.content.toLowerCase().includes(factSearchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-800 text-left">
      
      {/* Header */}
      <div className="sm:flex sm:items-center sm:justify-between text-left">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-blue-600 fill-blue-100" />
            Amélioration Continue de l'IA
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Les réponses validées sont injectées dynamiquement dans la secrétaire virtuelle, comblant les lacunes d'information à la volée, sans aucune ligne de code.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          {facts.length > 0 && (
            <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1 text-xs font-bold">
              ● Base de Connaissances active ({facts.length} fiches)
            </span>
          )}
        </div>
      </div>

      {/* Conceptual learning loop diagram */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-md text-left">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Brain className="h-5 w-5 text-yellow-300 fill-yellow-300" />
          La Boucle d'Apprentissage Autonome
        </h3>
        <p className="text-xs text-blue-100 max-w-2xl mt-1 leading-relaxed text-left">
          La secrétaire virtuelle évalue chaque transcription de conversation en arrière-plan. Si un patient pose à plusieurs reprises une question à laquelle l'IA ne sait pas répondre, elle est signalée ici. Valider une réponse met à jour l'IA instantanément.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 relative text-left">
          {[
            { step: '01', title: 'Analyser les Appels', desc: 'Les conversations sont examinées en arrière-plan.' },
            { step: '02', title: 'Isoler les Lacunes', desc: 'Les questions récurrentes restées sans réponse sont isolées.' },
            { step: '03', title: 'Validation Praticien', desc: 'Le docteur ou le secrétariat valide la réponse officielle.' },
            { step: '04', title: 'IA à Jour', desc: 'L\'IA intègre la réponse immédiatement pour les futurs appels.' }
          ].map((item, idx) => (
            <div key={idx} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 relative text-left">
              <span className="absolute right-3 top-3 text-[10px] font-mono bg-white/20 px-1.5 py-0.5 rounded font-bold">{item.step}</span>
              <h4 className="text-sm font-bold text-white flex items-center gap-1.5 text-left">
                {idx === 3 && <Sparkles className="h-4 w-4 text-yellow-300 fill-yellow-300 animate-pulse" />}
                {item.title}
              </h4>
              <p className="text-[11px] text-blue-100 mt-1 leading-relaxed text-left">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive learning loop simulator (Playground) */}
      <div className="bg-slate-900 text-white rounded-2xl border border-slate-800 shadow-lg p-5 text-left relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-5 pointer-events-none pr-4">
          <Brain className="h-56 w-56 text-white" />
        </div>
        
        <div className="relative z-10 space-y-4 text-left">
          <div className="flex items-center justify-between text-left">
            <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5 text-left">
              <Activity className="h-4 w-4 animate-pulse" />
              Simulateur d'Apprentissage en Direct
            </h3>
            <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-300 rounded-full px-2.5 py-1 font-bold">
              Tester le Moteur de Réponse
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed max-w-4xl text-left">
            Testez l'autonomie de la secrétaire virtuelle ci-dessous. Posez une question pas encore configurée, observez la réponse de secours, puis approuvez-la plus bas dans la liste des lacunes. Posez à nouveau la question et l'IA répondra instantanément !
          </p>

          <div className="flex flex-col sm:flex-row gap-2 text-left">
            <input
              type="text"
              value={sandboxQuestion}
              onChange={(e) => setSandboxQuestion(e.target.value)}
              placeholder="Saisissez une question patient (ex. Proposez-vous le blanchiment ?)"
              className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-xl px-4 py-2.5 text-xs font-semibold text-slate-100 outline-none transition-all"
            />
            <button
              onClick={handleAskSimulator}
              disabled={simulating || !sandboxQuestion.trim()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              {simulating ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Calcul en cours...
                </>
              ) : (
                <>
                  Interroger l'IA <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          </div>

          {/* Quick preset chips */}
          <div className="flex flex-wrap gap-1.5 pt-1 text-left">
            <span className="text-[10px] text-slate-500 font-bold self-center mr-1">Raccourcis rapides :</span>
            <button
              onClick={() => setSandboxQuestion("Êtes-vous ouvert le dimanche ?")}
              className="bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer"
            >
              "Ouvert le dimanche ?"
            </button>
            <button
              onClick={() => setSandboxQuestion("Avez-vous un parking gratuit ?")}
              className="bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer"
            >
              "Parking gratuit ?"
            </button>
            <button
              onClick={() => setSandboxQuestion("Y a-t-il un dentiste pour enfants ?")}
              className="bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer"
            >
              "Dentiste pour enfants ?"
            </button>
          </div>

          {/* Result terminal card */}
          {simOutput && (
            <div className={cn(
              "p-4 rounded-xl border text-xs space-y-2 animate-in zoom-in-95 duration-200 text-left",
              simOutput.status === 'learned' 
                ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-200" 
                : "bg-amber-950/30 border-amber-500/30 text-amber-200"
            )}>
              <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px] text-left">
                {simOutput.status === 'learned' ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>L'IA a formulé la réponse grâce à votre base de connaissances</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4 text-amber-400" />
                    <span>L'IA n'a pas pu répondre • Question signalée dans le tableau de bord</span>
                  </>
                )}
              </div>

              <div className="pt-2 border-t border-slate-800/80 text-left">
                <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1 text-left">Réponse simulée de la secrétaire virtuelle :</span>
                <p className="text-white text-xs italic font-semibold leading-relaxed text-left">
                  "{simOutput.answer}"
                </p>
              </div>

              {simOutput.status === 'learned' && simOutput.sourceFact && (
                <div className="pt-2 border-t border-slate-800/40 text-[9px] text-slate-400 flex items-center gap-1 text-left">
                  <Database className="h-3 w-3 text-emerald-500" />
                  <span>Fiche de référence associée : <strong>{simOutput.sourceFact}</strong></span>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Main split dashboard panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
        
        {/* Left Side: Unanswered Questions & Clinic Gaps */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 text-left space-y-4 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-left">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-amber-500 fill-amber-100" />
                Questions en attente ({filteredUnanswered.length})
              </h3>
              <p className="text-xs text-slate-500">Demandes récurrentes des patients sans réponse officielle.</p>
            </div>
            
            {/* Search */}
            <div className="relative w-full sm:w-44 text-left">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filtrer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border-slate-200 pl-8 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Filter segment */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 border-b border-slate-100 text-left">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "px-2.5 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap",
                  selectedCategory === cat 
                    ? "bg-slate-900 text-white" 
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                )}
              >
                {translateCategory(cat)}
              </button>
            ))}
          </div>

          {/* Questions list */}
          <div className="space-y-3.5 flex-1 max-h-[360px] overflow-y-auto pr-1 text-left">
            {loadingUnanswered ? (
              <div className="py-12 text-center text-slate-400 text-left">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-500 mb-2" />
                Chargement des questions des patients...
              </div>
            ) : filteredUnanswered.map((u) => (
              <div 
                key={u.id}
                className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-sm transition-all text-left"
              >
                <div className="space-y-1.5 text-left flex-1">
                  <div className="flex items-center gap-2 text-left">
                    <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase">
                      {translateCategory(u.category)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">
                      Détecté le : {new Date(u.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 italic text-left">
                    "{u.question}"
                  </h4>
                  <div className="flex items-center gap-2 text-left">
                    <span className="inline-flex h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs text-red-600 font-extrabold font-mono bg-red-50 px-1.5 py-0.5 rounded">
                      Posée {u.count} fois
                    </span>
                  </div>
                </div>

                <div className="flex sm:flex-col gap-1.5 self-start sm:self-auto w-full sm:w-auto text-left">
                  <button
                    onClick={() => {
                      setAnsweringQuestion(u);
                      setFactContent(u.suggestedAnswer || '');
                    }}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Edit3 className="h-3.5 w-3.5" /> Valider la réponse
                  </button>
                  <button
                    onClick={() => handleIgnoreQuestion(u.id)}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 px-3 py-1.5 text-xs font-bold transition-all cursor-pointer"
                  >
                    Écarter
                  </button>
                </div>
              </div>
            ))}

            {!loadingUnanswered && filteredUnanswered.length === 0 && (
              <div className="py-16 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl text-left">
                <CheckCircle2 className="h-8 w-8 mx-auto text-green-500 mb-2" />
                <p className="text-sm font-bold text-slate-700">Aucune lacune détectée !</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto text-center">
                  La base de connaissances couvre toutes les demandes patients actuellement répertoriées.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Approved Clinic Knowledge Factsheet */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 text-left space-y-4 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-left">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600 fill-blue-100" />
                Base de Connaissances Active ({filteredFacts.length})
              </h3>
              <p className="text-xs text-slate-500">Données alimentant actuellement la secrétaire virtuelle.</p>
            </div>
            
            {/* Search */}
            <div className="relative w-full sm:w-44 text-left">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={factSearchTerm}
                onChange={(e) => setFactSearchTerm(e.target.value)}
                className="w-full rounded-lg border-slate-200 pl-8 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Quick Manual Addition Toggle */}
          <button
            onClick={() => {
              setEditingFactId(null);
              setFactTopic('');
              setFactContent('');
              setManualFactOpen(true);
            }}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 py-2.5 text-xs font-bold transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="h-4 w-4" /> Enseigner une information personnalisée à l'IA
          </button>

          {/* Facts list */}
          <div className="space-y-3.5 flex-1 max-h-[360px] overflow-y-auto pr-1 text-left">
            {loadingFacts ? (
              <div className="py-12 text-center text-slate-400 text-left">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-blue-500 mb-2" />
                Chargement des fiches actives...
              </div>
            ) : filteredFacts.map((fact) => (
              <div 
                key={fact.id}
                className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2 relative group hover:border-blue-200 hover:shadow-sm transition-all text-left"
              >
                <div className="flex items-center justify-between text-left">
                  <span className="font-bold text-slate-900 text-xs sm:text-sm tracking-tight flex items-center gap-1.5 text-left">
                    <Lightbulb className="h-4 w-4 text-amber-500 fill-amber-100 flex-shrink-0" />
                    {fact.topic}
                  </span>
                  
                  <div className="flex items-center gap-1.5 text-left">
                    <button
                      onClick={() => {
                        setEditingFactId(fact.id);
                        setFactTopic(fact.topic);
                        setFactContent(fact.content);
                        setManualFactOpen(true);
                      }}
                      className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                      title="Modifier la fiche"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteFact(fact.id)}
                      className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      title="Supprimer la fiche"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-600 font-medium leading-relaxed bg-white p-2.5 rounded-lg border border-slate-100 text-left">
                  {fact.content}
                </p>

                <span className="text-[9px] text-slate-400 font-mono block text-left">
                  Mise à jour : {new Date(fact.updatedAt).toLocaleDateString()}
                </span>
              </div>
            ))}

            {!loadingFacts && filteredFacts.length === 0 && (
              <div className="py-12 text-center text-slate-400 text-left">
                <FileText className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                Aucun fait clinique n'a encore été configuré.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Approve Answer Modal */}
      {answeringQuestion && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-left animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start text-left">
              <div>
                <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase">
                  VALIDER LA RÉPONSE OFFICIELLE
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1 text-left">
                  Enseigner la réponse à l'IA
                </h3>
              </div>
              <button 
                onClick={() => setAnsweringQuestion(null)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-left">
              <span className="text-[10px] text-amber-800 font-bold uppercase tracking-wider block mb-1">Question patient :</span>
              <p className="text-xs sm:text-sm text-slate-900 font-bold italic text-left">
                "{answeringQuestion.question}"
              </p>
            </div>

            <form onSubmit={handleApproveAnswer} className="space-y-4 text-left">
              <div className="space-y-1.5 text-xs text-left">
                <label className="block font-bold text-slate-700">Réponse officielle du cabinet</label>
                <p className="text-[10px] text-slate-400 leading-relaxed mb-1.5">
                  Saisissez la réponse exacte que le cabinet souhaite apporter. La secrétaire virtuelle s'appuiera dessus pour répondre parfaitement à l'avenir.
                </p>
                <textarea
                  rows={4}
                  required
                  value={factContent}
                  onChange={(e) => setFactContent(e.target.value)}
                  className="w-full rounded-lg border-slate-200 focus:ring-blue-500 text-xs font-semibold text-slate-800 bg-slate-50 p-3"
                  placeholder="ex. Oui, nous proposons des plans d'échelonnement sans frais d'intérêt jusqu'à 12 mois..."
                />
              </div>

              {answeringQuestion.suggestedAnswer && answeringQuestion.suggestedAnswer !== "No suggested draft answer yet." && (
                <div className="text-[11px] text-blue-600 bg-blue-50 p-2.5 rounded-lg border border-blue-100 flex items-start gap-2 text-left">
                  <Lightbulb className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="text-left">
                    <span className="font-bold">Suggestion automatique de l'IA :</span>
                    <button 
                      type="button"
                      onClick={() => setFactContent(answeringQuestion.suggestedAnswer)}
                      className="underline font-semibold block mt-0.5 text-left hover:text-blue-800 cursor-pointer"
                    >
                      Utiliser : "{answeringQuestion.suggestedAnswer}"
                    </button>
                  </div>
                </div>
              )}

              <div className="flex gap-2.5 justify-end text-left">
                <button
                  type="button"
                  onClick={() => setAnsweringQuestion(null)}
                  className="rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 text-xs transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2 text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Valider & Enseigner à l'IA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Add / Edit Fact Modal */}
      {manualFactOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-left animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start text-left">
              <div>
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase">
                  {editingFactId ? "MODIFIER UN FAIT CLINIQUE" : "AJOUTER UNE CONNAISSANCE À L'IA"}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1 text-left">
                  {editingFactId ? "Modifier la fiche de connaissances" : "Créer une fiche de connaissances"}
                </h3>
              </div>
              <button 
                onClick={() => setManualFactOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualFact} className="space-y-4 text-left">
              <div className="space-y-1 text-xs text-left">
                <label className="block font-bold text-slate-700">Sujet / Question</label>
                <input
                  type="text"
                  required
                  value={factTopic}
                  onChange={(e) => setFactTopic(e.target.value)}
                  placeholder="e.g. Sédation, Accès fauteuil roulant, Invisalign"
                  className="w-full rounded-lg border-slate-200 focus:ring-blue-500 text-xs font-semibold text-slate-800 bg-slate-50 p-2.5"
                />
              </div>

              <div className="space-y-1 text-xs text-left">
                <label className="block font-bold text-slate-700">Information ou réponse approuvée</label>
                <textarea
                  rows={4}
                  required
                  value={factContent}
                  onChange={(e) => setFactContent(e.target.value)}
                  className="w-full rounded-lg border-slate-200 focus:ring-blue-500 text-xs font-semibold text-slate-800 bg-slate-50 p-3"
                  placeholder="Saisissez la réponse ou le paragraphe officiel de référence..."
                />
              </div>

              <div className="flex gap-2.5 justify-end text-left">
                <button
                  type="button"
                  onClick={() => setManualFactOpen(false)}
                  className="rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 text-xs transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2 text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  {editingFactId ? "Mettre à jour" : "Enseigner à l'IA"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
