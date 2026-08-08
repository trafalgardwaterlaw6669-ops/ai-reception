import { useState, useEffect } from 'react';
import { 
  Phone, 
  PhoneIncoming, 
  PhoneOutgoing, 
  PhoneMissed,
  Play,
  FileText,
  Clock,
  Search,
  Loader2,
  Database,
  ShieldCheck,
  Zap,
  Volume2
} from 'lucide-react';
import { mockCalls, mockPatients } from '@/data/mockDb';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, writeBatch, doc } from 'firebase/firestore';
import { CallLog } from '@/types';
import { toast } from 'sonner';
import { Link } from 'react-router';

export function Calls() {
  const [searchTerm, setSearchTerm] = useState('');
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);

  const handleSeedCalls = async () => {
    try {
      setLoading(true);
      const batch = writeBatch(db);
      const callsCol = collection(db, 'callLogs');

      const mockData: Omit<CallLog, 'id'>[] = [
        { 
          patientId: 'pat_1', 
          date: new Date(Date.now() - 1000 * 60 * 30).toISOString(), 
          durationSeconds: 145, 
          summary: 'Le patient a appelé pour confirmer son rendez-vous de traitement de canal demain.', 
          status: 'Handled', 
          language: 'Darija', 
          transcript: 'IA: Bonjour, cabinet dentaire du Dr. Youssef, comment puis-je vous aider ?\nPatient: Salam, bghit n2akked lmawid dyali dial ghedda.\nIA: D\'accord, quel est votre nom s\'il vous plaît ?\nPatient: Youssef Benali.\nIA: Merci Monsieur Benali. Oui, votre rendez-vous pour un traitement de canal est confirmé pour demain à 14h. Avez-vous d\'autres questions ?\nPatient: La safi, chokran.\nIA: Au revoir et à demain !' 
        },
        { 
          patientId: 'pat_3', 
          date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), 
          durationSeconds: 0, 
          summary: 'Appel manqué. L\'IA a envoyé un message de suivi WhatsApp automatisé.', 
          status: 'Missed', 
          language: 'Inconnu', 
          transcript: '' 
        },
        { 
          patientId: 'pat_2', 
          date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), 
          durationSeconds: 85, 
          summary: 'Le patient a demandé les horaires d\'ouverture du cabinet. L\'IA a répondu.', 
          status: 'Handled', 
          language: 'Français', 
          transcript: 'IA: Bonjour, cabinet dentaire du Dr. Youssef.\nPatient: Bonjour, j\'aimerais savoir à quelle heure vous fermez aujourd\'hui.\nIA: Le cabinet est ouvert jusqu\'à 18h aujourd\'hui. Voulez-vous prendre rendez-vous ?\nPatient: Non merci, je passerai demain matin.\nIA: Très bien. Nous ouvrons à 9h demain. Bonne journée !' 
        },
        { 
          patientId: 'pat_1', 
          date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), 
          durationSeconds: 210, 
          summary: 'Le patient a réservé une consultation de contrôle.', 
          status: 'Handled', 
          language: 'Darija', 
          transcript: 'IA: Bonjour, cabinet dentaire du Dr. Youssef.\nPatient: Salam, bghit nakhod mawid l controle.\nIA: Bien sûr. Avez-vous une préférence pour le matin ou l\'après-midi ?\nPatient: F sbah ila kan momkin.\nIA: J\'ai une disponibilité jeudi à 10h. Cela vous convient-il ?\nPatient: Wakha mzyan.\nIA: Parfait. C\'est noté pour jeudi à 10h. Au revoir.' 
        },
      ];

      mockData.forEach(data => {
        const docRef = doc(callsCol);
        batch.set(docRef, data);
      });

      await batch.commit();
      console.log("Journaux d'appels de démonstration générés automatiquement !");
    } catch (error) {
      console.error("Error seeding:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'callLogs'), orderBy('date', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setCalls([]);
        setLoading(false);
        return;
      }
      const fetchedCalls = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CallLog[];
      setCalls(fetchedCalls);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching calls: ", error);
      toast.error("Impossible de charger les journaux d'appels.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const enrichedCalls = calls.map(call => ({
    ...call,
    patient: mockPatients.find(p => p.id === call.patientId)
  }));

  const filteredCalls = enrichedCalls.filter(call => {
    if (!searchTerm) return true;
    const name = call.patient ? `${call.patient.firstName} ${call.patient.lastName}` : 'Inconnu';
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between text-left">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Historique d'Appels & Transcriptions</h1>
          <p className="mt-2 text-sm text-slate-600">
            Historique complet de tous les appels téléphoniques traités par l'IA, résumés et transcriptions sémantiques.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none flex items-center gap-3">
        </div>
      </div>

      {/* "Missed Calls Never Exist" Showcase Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-2xl p-6 shadow-sm border border-slate-800 text-left">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded bg-indigo-500/20 px-2 py-0.5 text-xs font-semibold text-indigo-300 tracking-wide uppercase">
                <span className="relative flex h-1.5 w-1.5 mr-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-400"></span>
                </span>
                Interception IA 24h/24 & 7j/7 Active
              </span>
              <span className="inline-flex items-center gap-1 rounded bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
                <ShieldCheck className="h-3.5 w-3.5" /> Réponse garantie à 100%
              </span>
            </div>
            <h2 className="text-xl font-bold tracking-tight">Les appels manqués n'existent plus.</h2>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              La réceptionniste IA gère les appels en continu. Que votre cabinet soit fermé, vos lignes occupées ou le personnel occupé avec un patient, chaque appelant reçoit une réponse fluide et immédiate. **Les messages et demandes de soins urgents sont interceptés et saisis en temps réel dans votre tableau de bord.**
            </p>
          </div>
          <button
            onClick={() => toast.info("Utilisez le panneau d'appel flottant vert en bas à droite pour tester l'agent vocal en temps réel !")}
            className="flex-none inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 text-sm font-semibold shadow-sm transition-all active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <Zap className="h-4 w-4 text-amber-300 fill-amber-300 animate-pulse" /> Simuler un appel 24h/24
          </button>
        </div>
      </div>

      {/* Dentist Voice Notes CTA Banner */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-left">
        <div className="flex items-center gap-3 text-left">
          <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
            <Volume2 className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Briefings Vocaux Post-Appel pour le Docteur</h4>
            <p className="text-xs text-slate-500">Écoutez des résumés audio rapides de 10 secondes pour les urgences dentaires et demandes de soins complexes.</p>
          </div>
        </div>
        <Link 
          to="/dentist-voice-notes"
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3.5 py-2.5 shadow-sm transition-all active:scale-95 cursor-pointer whitespace-nowrap"
        >
          <Volume2 className="h-3.5 w-3.5" /> Ouvrir le flux vocal (10s)
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div className="relative flex-1 max-w-md text-left">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-5 w-5 text-slate-400" aria-hidden="true" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border-0 py-1.5 pl-10 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 text-left"
            placeholder="Rechercher par nom de patient..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
           <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        </div>
      )}

      {/* Call List */}
      {!loading && (
        <div className="space-y-4">
          {filteredCalls.map((call) => (
            <div key={call.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden text-left">
              <div className="border-b border-slate-100 p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full",
                    call.status === 'Géré' || call.status === 'Handled' ? "bg-green-100" : "bg-red-100"
                  )}>
                    {call.status === 'Géré' || call.status === 'Handled' ? (
                      <PhoneIncoming className="h-5 w-5 text-green-600" />
                    ) : (
                      <PhoneMissed className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 text-left">
                      {call.patient ? `${call.patient.firstName} ${call.patient.lastName}` : 'Appelant Inconnu'}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {new Date(call.date).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      <span>&bull;</span>
                      <span>{Math.floor(call.durationSeconds / 60)}m {call.durationSeconds % 60}s</span>
                      <span>&bull;</span>
                      <span>{call.language}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                    call.status === 'Géré' || call.status === 'Handled' ? "bg-green-50 text-green-700 ring-green-600/20" : "bg-red-50 text-red-700 ring-red-600/20"
                  )}>
                    {call.status === 'Géré' || call.status === 'Handled' ? 'Géré par l\'IA' : 'Manqué'}
                  </span>
                  {call.durationSeconds > 0 && (
                    <button className="flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1.5 text-sm font-semibold text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 cursor-pointer">
                      <Play className="h-4 w-4 text-blue-600" /> Écouter l'appel
                    </button>
                  )}
                </div>
              </div>
              
              <div className="p-4 sm:px-6 bg-slate-50">
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-slate-400" /> Résumé sémantique par l'IA
                  </h4>
                  <p className="text-sm text-slate-600 bg-white p-3 rounded-md border border-slate-200">
                    {call.summary}
                  </p>
                </div>
                
                {call.transcript && (
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 mb-2">Transcription complète de l'appel</h4>
                    <div className="text-sm text-slate-600 bg-white p-4 rounded-md border border-slate-200 whitespace-pre-wrap font-mono text-xs leading-relaxed max-h-64 overflow-y-auto">
                      {call.transcript.split('\n').map((line, i) => (
                        <div key={i} className={cn("mb-2", line.startsWith('AI:') || line.startsWith('IA:') ? 'text-blue-700 font-semibold' : 'text-slate-700')}>
                          {line.startsWith('AI:') || line.startsWith('IA:') ? (
                            <strong>IA : </strong>
                          ) : line.startsWith('Patient:') || line.startsWith('Patient :') ? (
                            <strong>Patient : </strong>
                          ) : null}
                          {line.replace(/^(AI|IA|Patient):\s*/, '')}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {filteredCalls.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-slate-200 text-left">
              <Phone className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-2 text-sm font-semibold text-slate-900 text-center">Aucun appel trouvé</h3>
              <p className="mt-1 text-sm text-slate-500 text-center">Nous n'avons trouvé aucun historique d'appel correspondant à vos critères.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
