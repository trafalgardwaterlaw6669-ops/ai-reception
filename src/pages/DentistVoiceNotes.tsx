import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  Play, 
  Pause, 
  Check, 
  Calendar, 
  AlertTriangle, 
  Languages, 
  Sparkles, 
  Smartphone, 
  Send, 
  FileText, 
  Activity, 
  Clock, 
  User, 
  Clock3,
  CheckCircle,
  HelpCircle,
  PhoneCall,
  Flame,
  VolumeX,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
interface VoiceMemo {
  id: string;
  patientName: string;
  patientId: string;
  complaint: string;
  allergy: string;
  schedulePreference: string;
  language: string;
  summaryText: string;
  frenchSummaryText: string;
  date: string;
  durationSeconds: number;
  audioText: string;
  status: 'pending' | 'resolved';
  actionsCompleted: {
    booked?: boolean;
    allergyLogged?: boolean;
    languageSet?: boolean;
    notified?: boolean;
  };
}

const initialMemos: VoiceMemo[] = [
  {
    id: 'memo_jp',
    patientName: 'Jean-Pierre Dupont',
    patientId: 'new_jp',
    complaint: 'Douleur intense molaire supérieure',
    allergy: 'Pénicilline',
    schedulePreference: 'Demain après-midi',
    language: 'Français',
    summaryText: 'Patient Jean-Pierre has severe upper molar pain. Wants tomorrow afternoon appointment. Allergic to penicillin. Prefers French.',
    frenchSummaryText: 'Le patient Jean-Pierre souffre d\'une douleur vive à la molaire supérieure. Demande un rendez-vous demain après-midi. Allergique à la pénicilline. Préfère le français.',
    date: 'À l\'instant',
    durationSeconds: 10,
    audioText: 'Résumé dentaire : Le patient signale une vive douleur à la molaire supérieure. Il souhaite un rendez-vous demain après-midi. Attention : le patient est allergique à la pénicilline. Préférence de communication : Français.',
    status: 'pending',
    actionsCompleted: {
      booked: false,
      allergyLogged: false,
      languageSet: false,
      notified: false
    }
  },
  {
    id: 'memo_1',
    patientName: 'Sara Ahmed',
    patientId: 'pat_2',
    complaint: 'Sensibilité gingivale aux liquides chauds',
    allergy: 'Aucune',
    schedulePreference: 'Jeudi matin prochain',
    language: 'Français',
    summaryText: 'Sara Ahmed has hot-liquid sensitivity. Requesting next Thursday morning checkup. No allergies. Prefers French.',
    frenchSummaryText: 'Sara Ahmed signale une sensibilité au chaud. Demande un contrôle jeudi matin prochain. Aucune allergie. Préfère le français.',
    date: 'Il y a 2 heures',
    durationSeconds: 10,
    audioText: 'Sara Ahmed signale une sensibilité aux boissons chaudes. Souhaite un contrôle jeudi matin. Aucune allergie. Communication : Français.',
    status: 'resolved',
    actionsCompleted: {
      booked: true,
      allergyLogged: true,
      languageSet: true,
      notified: true
    }
  },
  {
    id: 'memo_2',
    patientName: 'Youssef Benali',
    patientId: 'pat_1',
    complaint: 'Couronne provisoire décollée post-endodontie',
    allergy: 'Pénicilline',
    schedulePreference: 'Créneau d\'urgence aujourd\'hui',
    language: 'Darija',
    summaryText: 'Youssef Benali reports a loose temporary crown. Wants emergency slot today. Allergic to penicillin. Prefers Darija.',
    frenchSummaryText: 'Youssef Benali signale une couronne provisoire instable. Demande un créneau d\'urgence aujourd\'hui. Allergique à la pénicilline. Préfère le darija.',
    date: 'Hier',
    durationSeconds: 10,
    audioText: 'Youssef Benali a une couronne provisoire décollée. Souhaite un créneau d\'urgence aujourd\'hui. Allergique à la pénicilline. Préférence : Darija.',
    status: 'resolved',
    actionsCompleted: {
      booked: true,
      allergyLogged: true,
      languageSet: true,
      notified: true
    }
  }
];

export function DentistVoiceNotes() {
  const [memos, setMemos] = useState<VoiceMemo[]>(initialMemos);
  const [activeMemoId, setActiveMemoId] = useState<string>('memo_jp');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playProgress, setPlayProgress] = useState<number>(0);
  const [playbackTime, setPlaybackTime] = useState<number>(0);
  const [isSpeechSupported, setIsSpeechSupported] = useState<boolean>(false);
  const [voiceGender, setVoiceGender] = useState<'us' | 'fr'>('fr');
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const activeMemo = memos.find(m => m.id === activeMemoId) || memos[0];

  useEffect(() => {
    if ('speechSynthesis' in window) {
      setIsSpeechSupported(true);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setPlaybackTime(prev => {
          if (prev >= 10) {
            handleStopAudio();
            return 10;
          }
          const nextTime = prev + 0.1;
          setPlayProgress((nextTime / 10) * 100);
          return nextTime;
        });
      }, 100);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying]);

  const handleStartAudio = () => {
    window.speechSynthesis?.cancel();
    setIsPlaying(true);

    if ('speechSynthesis' in window) {
      const textToSpeak = voiceGender === 'fr' ? activeMemo.frenchSummaryText : activeMemo.audioText;
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.rate = 1.1; 
      
      if (voiceGender === 'fr') {
        const voices = window.speechSynthesis.getVoices();
        const frVoice = voices.find(v => v.lang.startsWith('fr'));
        if (frVoice) utterance.voice = frVoice;
      } else {
        const voices = window.speechSynthesis.getVoices();
        const enVoice = voices.find(v => v.lang.startsWith('en'));
        if (enVoice) utterance.voice = enVoice;
      }

      utterance.onend = () => {
        handleStopAudio();
      };
      utterance.onerror = () => {
      };
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleStopAudio = () => {
    setIsPlaying(false);
    window.speechSynthesis?.cancel();
  };

  const handleResetAudio = () => {
    handleStopAudio();
    setPlaybackTime(0);
    setPlayProgress(0);
  };

  const togglePlayback = () => {
    if (isPlaying) {
      handleStopAudio();
    } else {
      if (playbackTime >= 10) {
        setPlaybackTime(0);
        setPlayProgress(0);
      }
      handleStartAudio();
    }
  };

  const handleClinicalAction = (actionType: 'booked' | 'allergyLogged' | 'languageSet' | 'notified') => {
    setMemos(prev => prev.map(memo => {
      if (memo.id === activeMemoId) {
        const updatedActions = { ...memo.actionsCompleted, [actionType]: true };
        
        const isAllResolved = updatedActions.booked && updatedActions.allergyLogged && updatedActions.languageSet;
        const status = isAllResolved ? 'resolved' : memo.status;

        return {
          ...memo,
          status: status as 'pending' | 'resolved',
          actionsCompleted: updatedActions
        };
      }
      return memo;
    }));

    if (actionType === 'booked') {
      toast.success("Créneau bloqué ! Rendez-vous demain après-midi programmé à 14h30.");
    } else if (actionType === 'allergyLogged') {
      toast.warning("ALLERGIE À LA PÉNISCILLINE signalée en rouge dans le dossier du patient !");
    } else if (actionType === 'languageSet') {
      toast.info("Préférence linguistique définie sur le Français.");
    } else if (actionType === 'notified') {
      toast.success("Message de confirmation envoyé par WhatsApp avec le formulaire d'admission !");
    }
  };

  const handleResolveAll = () => {
    setMemos(prev => prev.map(m => {
      if (m.id === activeMemoId) {
        return {
          ...m,
          status: 'resolved',
          actionsCompleted: {
            booked: true,
            allergyLogged: true,
            languageSet: true,
            notified: true
          }
        };
      }
      return m;
    }));
    toast.success(`Dossier d'urgence clôturé pour ${activeMemo.patientName}. Données synchronisées.`);
  };

  return (
    <div className="space-y-6 text-slate-800">
      {/* Header */}
      <div className="text-left">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Volume2 className="h-6 w-6 text-indigo-600" />
          Briefings Vocaux Post-Appel pour le Praticien
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Gagnez du temps grâce à un <strong>résumé audio de 10 secondes</strong> préparé automatiquement après chaque appel. Validez les urgences cliniques et pré-enregistrez les consignes critiques.
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Voice Note Feed */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden text-left">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">Liste des Mémos</span>
              <span className="text-[10px] bg-red-100 border border-red-200 rounded px-1.5 py-0.5 text-red-700 font-extrabold flex items-center gap-1">
                <Flame className="h-3 w-3 animate-pulse" /> Interceptions d'Urgence
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {memos.map(memo => {
                const isActive = memo.id === activeMemoId;
                const isEmergency = memo.complaint.toLowerCase().includes('douleur') || memo.complaint.toLowerCase().includes('urgence') || memo.complaint.toLowerCase().includes('pain');
                
                return (
                  <button
                    key={memo.id}
                    onClick={() => {
                      setActiveMemoId(memo.id);
                      handleResetAudio();
                    }}
                    className={cn(
                      "w-full p-4 text-left block transition-all hover:bg-slate-50 relative border-l-4 cursor-pointer",
                      isActive 
                        ? "bg-indigo-50/50 border-l-indigo-600" 
                        : "border-l-transparent",
                      memo.status === 'resolved' ? "opacity-75" : ""
                    )}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-slate-900 text-sm">{memo.patientName}</h4>
                      <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{memo.date}</span>
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {isEmergency && (
                        <span className="bg-rose-50 text-rose-700 border border-rose-100 font-bold px-1.5 py-0.5 rounded text-[10px] inline-flex items-center gap-0.5">
                          ⚠️ Urgence Clinique
                        </span>
                      )}
                      <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-medium">
                        ⏱ Audio de {memo.durationSeconds}s
                      </span>
                      {memo.status === 'resolved' ? (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          ✓ Traité
                        </span>
                      ) : (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded text-[10px] font-bold animate-pulse">
                          À réviser
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-xs text-slate-500 line-clamp-2 italic">
                      "{memo.frenchSummaryText}"
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-xl border border-indigo-950 text-xs space-y-2 text-left shadow-md">
            <h4 className="font-bold text-indigo-200 flex items-center gap-1">
              <Sparkles className="h-4 w-4" /> Pourquoi des résumés de 10 secondes ?
            </h4>
            <p className="leading-relaxed text-slate-300">
              Le chirurgien-dentiste bénéficie d'un briefing ultra-ciblé de <strong>10 secondes</strong>. Fini les messages vocaux interminables et les comptes rendus flous : les risques cliniques vitaux (allergies, douleur) sont isolés et présentés instantanément pour une réactivité maximale.
            </p>
          </div>
        </div>

        {/* Right 2 Columns: Selected Memo Detail & Audio Player */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Active Voice Note Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden text-left">
            
            {/* Header detail */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <User className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <h3 className="font-extrabold text-slate-900 text-base">{activeMemo.patientName}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500">Résumé d'appel généré par l'IA Gemini Clinique</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                    <span className="text-xs font-semibold text-indigo-600">{activeMemo.language}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setVoiceGender(prev => prev === 'us' ? 'fr' : 'us')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1 cursor-pointer",
                    voiceGender === 'fr' 
                      ? "bg-blue-50 border-blue-200 text-blue-700"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  )}
                  title="Changer l'accent de lecture"
                >
                  <Languages className="h-3.5 w-3.5" /> 
                  Accent : {voiceGender === 'fr' ? 'Français 🇫🇷' : 'Anglais 🇺🇸'}
                </button>
                {activeMemo.status === 'pending' && (
                  <button
                    onClick={handleResolveAll}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" /> Clôturer le dossier
                  </button>
                )}
              </div>
            </div>

            {/* Core Body */}
            <div className="p-6 space-y-6">
              
              {/* Vitals Highlights Board */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                
                <div className="p-3 bg-red-50 rounded-xl border border-red-100 text-left">
                  <span className="text-[9px] font-bold text-red-600 uppercase tracking-widest block mb-1">Motif de consultation</span>
                  <p className="text-sm font-extrabold text-slate-900">{activeMemo.complaint}</p>
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-left">
                  <span className="text-[9px] font-bold text-amber-600 uppercase tracking-widest block mb-1">Créneau souhaité</span>
                  <p className="text-sm font-extrabold text-slate-900">{activeMemo.schedulePreference}</p>
                </div>

                <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 text-left relative overflow-hidden">
                  <span className="text-[9px] font-bold text-rose-600 uppercase tracking-widest block mb-1">Alerte Allergies</span>
                  <p className="text-sm font-extrabold text-rose-850 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                    {activeMemo.allergy}
                  </p>
                </div>

                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-left">
                  <span className="text-[9px] font-bold text-blue-600 uppercase tracking-widest block mb-1">Langue d'usage</span>
                  <p className="text-sm font-extrabold text-slate-900 flex items-center gap-1">
                    <Languages className="h-4 w-4 text-blue-600" />
                    {activeMemo.language}
                  </p>
                </div>

              </div>

              {/* Interactive Player Section */}
              <div className="bg-slate-950 text-white rounded-2xl p-5 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-bold tracking-widest text-slate-400 uppercase">Lecteur de synthèse audio</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Temps : 0:{(playbackTime).toFixed(1)} / 0:10.0
                  </span>
                </div>

                {/* Animated Waveform & Controls */}
                <div className="flex items-center gap-4 py-2">
                  <button
                    onClick={togglePlayback}
                    className="h-14 w-14 shrink-0 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg transition-all active:scale-95 cursor-pointer border border-indigo-400/20"
                  >
                    {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
                  </button>

                  <div className="flex-1 space-y-1">
                    {/* Simulated Waveform Visualizer */}
                    <div className="flex items-end justify-between h-10 px-2 gap-1.5 bg-slate-900/50 rounded-lg py-1">
                      {Array.from({ length: 30 }).map((_, idx) => {
                        let height = "h-2";
                        if (isPlaying) {
                          const randomVal = Math.sin((idx + playbackTime * 5)) * 100;
                          const mappedHeight = Math.max(10, Math.min(100, Math.abs(randomVal)));
                          height = `h-[${Math.floor(mappedHeight)}%]`;
                        } else {
                          const staticHeights = [20, 40, 60, 20, 80, 40, 20, 50, 90, 40, 20, 30, 70, 50, 10, 30, 60, 80, 20, 40, 60, 20, 70, 40, 10, 50, 90, 30, 20, 40];
                          height = `h-[${staticHeights[idx % staticHeights.length]}%]`;
                        }

                        const isBarPassed = idx / 30 * 100 <= playProgress;

                        return (
                          <div 
                            key={idx} 
                            className={cn(
                              "w-1 rounded-full transition-all duration-150 origin-bottom flex-1",
                              isBarPassed ? "bg-indigo-500" : "bg-slate-700/60"
                            )} 
                            style={{ 
                              height: isPlaying ? `${Math.floor(Math.max(15, Math.sin((idx + playbackTime * 8)) * 100 + 40))}%` : undefined
                            }}
                          />
                        );
                      })}
                    </div>

                    <div className="w-full bg-slate-800 rounded-full h-1">
                      <div className="bg-indigo-500 h-1 rounded-full transition-all duration-100" style={{ width: `${playProgress}%` }} />
                    </div>
                  </div>
                </div>

                {/* Subtitle Box */}
                <div className="bg-slate-900/80 rounded-xl p-3.5 border border-slate-800 text-xs relative text-left">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-semibold text-slate-400">SOUS-TITRES EN DIRECT (SYNTHÈSE {voiceGender.toUpperCase()})</span>
                    {!isSpeechSupported && (
                      <span className="text-[9px] text-amber-400">Audio simulé graphiquement</span>
                    )}
                  </div>
                  <p className="text-slate-200 leading-relaxed font-mono italic">
                    "{voiceGender === 'fr' ? activeMemo.frenchSummaryText : activeMemo.audioText}"
                  </p>
                </div>
              </div>

              {/* Dentist Actionable Clinical Integrations */}
              <div className="space-y-4 pt-2 text-left">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Activity className="h-4 w-4 text-indigo-600" />
                  Protocole d'Action Rapide du Praticien
                </h4>
                <p className="text-xs text-slate-500">
                  Déclenchez directement les décisions cliniques déduites de la note vocale de {activeMemo.patientName} pour synchroniser le cabinet.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Action 1: Book tomorrow afternoon */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex items-start gap-3 text-left">
                    <div className="h-9 w-9 rounded bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-950 text-xs">Bloquer Créneau Demain</span>
                        {activeMemo.actionsCompleted.booked && (
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">✔ Confirmé</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">Réserver le créneau d'urgence demain après-midi (14h30).</p>
                      <button
                        onClick={() => handleClinicalAction('booked')}
                        disabled={activeMemo.actionsCompleted.booked}
                        className="text-[11px] font-bold text-indigo-600 disabled:text-slate-400 hover:underline cursor-pointer"
                      >
                        {activeMemo.actionsCompleted.booked ? 'Enregistré au planning' : '📅 Bloquer Demain 14h30'}
                      </button>
                    </div>
                  </div>

                  {/* Action 2: Flag penicillin allergy */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex items-start gap-3 text-left">
                    <div className="h-9 w-9 rounded bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-950 text-xs">Signaler l'Allergie</span>
                        {activeMemo.actionsCompleted.allergyLogged && (
                          <span className="text-[10px] text-rose-600 font-bold flex items-center gap-0.5">✔ Enregistré</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">Inscrire l'alerte allergie de manière flagrante dans la fiche d'antécédents.</p>
                      <button
                        onClick={() => handleClinicalAction('allergyLogged')}
                        disabled={activeMemo.actionsCompleted.allergyLogged}
                        className="text-[11px] font-bold text-rose-600 disabled:text-slate-400 hover:underline cursor-pointer"
                      >
                        {activeMemo.actionsCompleted.allergyLogged ? 'Signalé au dossier médical' : '⚠️ Enregistrer l\'Allergie'}
                      </button>
                    </div>
                  </div>

                  {/* Action 3: Set French Preferred */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex items-start gap-3 text-left">
                    <div className="h-9 w-9 rounded bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Languages className="h-5 w-5" />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-950 text-xs">Définir langue (Français)</span>
                        {activeMemo.actionsCompleted.languageSet && (
                          <span className="text-[10px] text-blue-600 font-bold flex items-center gap-0.5">✔ Appliqué</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">Configurer le compte patient pour utiliser le français dans tous les envois.</p>
                      <button
                        onClick={() => handleClinicalAction('languageSet')}
                        disabled={activeMemo.actionsCompleted.languageSet}
                        className="text-[11px] font-bold text-blue-600 disabled:text-slate-400 hover:underline cursor-pointer"
                      >
                        {activeMemo.actionsCompleted.languageSet ? 'Défini sur Français' : '🗣️ Appliquer le Français'}
                      </button>
                    </div>
                  </div>

                  {/* Action 4: Send WhatsApp Direct Confirmation */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors flex items-start gap-3 text-left">
                    <div className="h-9 w-9 rounded bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Send className="h-5 w-5" />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-950 text-xs">Suivi par WhatsApp</span>
                        {activeMemo.actionsCompleted.notified && (
                          <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">✔ Expédié</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500">Envoyer les liens de pré-admission par message pour gagner du temps à l'accueil.</p>
                      <button
                        onClick={() => handleClinicalAction('notified')}
                        disabled={activeMemo.actionsCompleted.notified}
                        className="text-[11px] font-bold text-emerald-600 disabled:text-slate-400 hover:underline cursor-pointer"
                      >
                        {activeMemo.actionsCompleted.notified ? 'Expédié au patient' : '💬 Envoyer la confirmation WhatsApp'}
                      </button>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
