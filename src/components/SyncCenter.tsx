import React, { useState } from 'react';
import { useClinics, Clinic } from '@/context/ClinicContext';
import { 
  Radio, 
  CheckCircle2, 
  Building2, 
  Cpu, 
  Sparkles, 
  Clock, 
  ArrowRight, 
  RefreshCw,
  AlertTriangle,
  MapPin,
  Lock,
  PhoneCall,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function SyncCenter() {
  const { clinics, currentClinic, isSyncing, lastSynced, triggerGlobalSync, syncLogs } = useClinics();
  const [activeTab, setActiveTab] = useState<'status' | 'logs' | 'routing'>('status');
  const [isSimulatingConflict, setIsSimulatingConflict] = useState(false);

  const simulateCrossClinicConflict = async () => {
    setIsSimulatingConflict(true);
    toast.info("Tentative de double réservation simultanée à Casablanca & Rabat par le patient...", { duration: 3000 });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    toast.success("Conflit résolu : Gemini IA a détecté le trajet du Dr Smith, a décalé automatiquement le créneau de Rabat de 30 min et a envoyé une confirmation polie par WhatsApp !", {
      duration: 6000,
    });
    setIsSimulatingConflict(false);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all hover:shadow-md">
      {/* Header */}
      <div className="bg-slate-900 px-6 py-5 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center rounded-full bg-blue-500/15 px-2.5 py-0.5 text-xs font-semibold text-blue-300 border border-blue-500/20">
              <Cpu className="mr-1 h-3.5 w-3.5 animate-pulse text-blue-400" />
              Noyau d'IA Centralisé
            </span>
            <span className="text-xs text-slate-400">Modèle : Gemini 2.5 Flash</span>
          </div>
          <h2 className="text-lg font-bold">Une IA, Un Tableau de Bord, Trois Cliniques Synchronisées</h2>
          <p className="text-xs text-slate-400">
            Un agent unique gère le téléphone, WhatsApp et les rendez-vous à Casablanca, Rabat & Marrakech en temps réel.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={triggerGlobalSync}
            disabled={isSyncing}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 transition-all shadow-sm active:scale-95 cursor-pointer w-full sm:w-auto",
              isSyncing && "opacity-80 cursor-wait"
            )}
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
            {isSyncing ? "Synchronisation..." : "Forcer la synchro des nœuds"}
          </button>
        </div>
      </div>

      {/* Navigation Subtabs */}
      <div className="flex border-b border-slate-200 px-6 bg-slate-50">
        <button
          onClick={() => setActiveTab('status')}
          className={cn(
            "py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer",
            activeTab === 'status' 
              ? "border-blue-600 text-blue-600" 
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          Statut des Nœuds & Télémétrie
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={cn(
            "py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer",
            activeTab === 'logs' 
              ? "border-blue-600 text-blue-600" 
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          Journal de Synchro Temps Réel
        </button>
        <button
          onClick={() => setActiveTab('routing')}
          className={cn(
            "py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer",
            activeTab === 'routing' 
              ? "border-blue-600 text-blue-600" 
              : "border-transparent text-slate-500 hover:text-slate-800"
          )}
        >
          Moteur d'Évitement de Conflits
        </button>
      </div>

      {/* Tab Contents */}
      <div className="p-6">
        {activeTab === 'status' && (
          <div className="space-y-6">
            {/* Cards for each physical clinic */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {clinics.map((clinic) => {
                const isSelected = currentClinic?.id === clinic.id;
                return (
                  <div 
                    key={clinic.id} 
                    className={cn(
                      "p-4 rounded-xl border transition-all relative flex flex-col justify-between",
                      isSelected 
                        ? "border-blue-500 bg-blue-50/20 ring-1 ring-blue-500/20" 
                        : "border-slate-200 bg-white hover:border-slate-300"
                    )}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900">{clinic.name}</span>
                        </div>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          {clinic.city}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-100">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                        Synchro Live
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-left bg-slate-50/50 p-2 rounded-lg text-[11px] font-medium text-slate-600">
                      <div>
                        <span className="text-[9px] text-slate-400 block">PATIENTS</span>
                        <span className="font-bold text-slate-800">{clinic.activePatients}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block">REVENU</span>
                        <span className="font-bold text-slate-800">{clinic.monthlyRevenue.toLocaleString()} $</span>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-slate-100 flex items-center justify-between text-[10px]">
                        <span className="text-slate-400">Messag. Voc. Évités IA</span>
                        <span className="font-extrabold text-blue-600">+{clinic.aiVoicemailBypassCount}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Central synchronizer explanation */}
            <div className="flex items-start gap-4 p-4 rounded-xl bg-blue-50/40 border border-blue-100">
              <div className="rounded-lg bg-blue-50 p-2 shrink-0">
                <Sparkles className="h-5 w-5 text-blue-600" />
              </div>
              <div className="space-y-1 text-left">
                <h4 className="text-sm font-bold text-slate-900">Mémoire Partagée du Contexte IA</h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  L'IA centrale partage les connaissances entre tous les sites. Si un patient de Casablanca appelle Rabat Agdal, l'IA identifie automatiquement son profil historique, ses langues (Darija/Français), ses notes médicales et signale d'éventuels conflits de localisation. Toutes les mises à jour sont immédiatement persistantes.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-500">Flux du Journal de Synchro Live</span>
              <span className="text-[10px] font-mono text-slate-400">Dernière synchronisation : {lastSynced}</span>
            </div>

            <div className="bg-slate-950 rounded-xl p-4 font-mono text-[11px] text-slate-300 space-y-2.5 max-h-[220px] overflow-y-auto text-left border border-slate-800">
              {syncLogs.map((log, i) => (
                <div key={i} className="flex items-start gap-2.5 leading-relaxed">
                  <span className="text-slate-500 shrink-0">[{log.time}]</span>
                  <span className={cn(
                    "font-bold shrink-0 px-1 rounded uppercase text-[9px]",
                    log.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                    log.type === 'alert' ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'
                  )}>
                    {log.clinic}
                  </span>
                  <span className="text-slate-200">{log.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'routing' && (
          <div className="space-y-5 text-left">
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900">Verrou de Calendrier Partagé du Dr Smith</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Puisque le Dr Smith exerce à Casablanca, Rabat et Marrakech, les réservations doivent se synchroniser de manière dynamique. Notre **IA Unique** l'empêche d'être réservé en double sur différents sites, en prenant en compte les temps de trajet (ex. 1h de train entre Casablanca et Rabat).
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-900">Tampon de Sécurité Trajet</span>
                </div>
                <p className="text-xs text-slate-500 leading-normal">
                  Verrouille automatiquement 1,5 heure de temps de trajet si un rendez-vous est pris dans une autre ville le même jour.
                </p>
                <div className="inline-flex items-center gap-1.5 rounded bg-blue-100 px-2 py-0.5 text-[10px] font-extrabold text-blue-800 uppercase">
                  Activé & Opérationnel
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 animate-bounce" />
                    <span className="text-xs font-bold text-slate-900">Simulateur de Conflits</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Testez comment l'IA bloque une demande de planification parallèle à Casablanca Maârif lorsque le Dr Smith a déjà des créneaux prévus à Rabat Agdal.
                  </p>
                </div>

                <button
                  onClick={simulateCrossClinicConflict}
                  disabled={isSimulatingConflict}
                  className={cn(
                    "mt-3 w-full text-center inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2 transition-all shadow-sm cursor-pointer",
                    isSimulatingConflict && "opacity-75 cursor-wait"
                  )}
                >
                  <RefreshCw className={cn("h-3 w-3", isSimulatingConflict && "animate-spin")} />
                  {isSimulatingConflict ? "Évaluation du Verrou..." : "Déclencher la simulation de conflit"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
