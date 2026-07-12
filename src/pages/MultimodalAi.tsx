import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, 
  Upload, 
  AlertTriangle, 
  CheckCircle2, 
  HelpCircle, 
  Sparkles, 
  ShieldCheck, 
  Activity, 
  ArrowRight,
  RefreshCw,
  X,
  FileText,
  Info,
  Clock,
  HeartPulse,
  Heart
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ScreeningResult {
  disclaimer: string;
  urgencyLevel: 'IMMEDIATE EMERGENCY' | 'PROMPT EVALUATION' | 'ROUTINE/MONITOR';
  findings: string[];
  reasoning: string;
  nextSteps: string[];
  friendlyAdvice: string;
}

const SCENARIO_IMAGES = {
  swelling: "iVBORw0KGgoAAAANSUhEUgAAAGQAAABkBAMAAACCbS9CAAAAMFBMVEUAAAD/9PT/9PT/9PT/9PT/9PT/9PT/9PT/9PT/9PT/9PT/9PT/9PT/9PT/9PT/9PT/3ZInAAAAEHRSTlMAESIzM0RVZnd4gYKDhIWG6XN5ewAAAExJREFUeN7t0cENACAIBEEMv639l6EFL8HIK5PZbyMHAECWpG66TidZunWq3V9v23b9GzZs2LBhw4YNGzZs2LBhw4YNGzZs2LBhw4bNTw6u8isRx6WPrwAAAABJRU5ErkJggg==",
  fracture: "iVBORw0KGgoAAAANSUhEUgAAAGQAAABkBAMAAACCbS9CAAAAMFBMVEUAAAD///////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACb+5OaAAAAEHRSTlMAESIzM0RVZnd4gYKDhIWG6XN5ewAAAExJREFUeN7t0cENACAIBEEMv639l6EFL8HIK5PZbyMHAECWpG66TidZunWq3V9v23b9GzZs2LBhw4YNGzZs2LBhw4YNGzZs2LBhw4bNTw6u8isRx6WPrwAAAABJRU5ErkJggg==",
  discoloration: "iVBORw0KGgoAAAANSUhEUgAAAGQAAABkBAMAAACCbS9CAAAAMFBMVEUAAAD77u777u777u777u777u777u777u777u777u777u777u777u777u777u7qR5ZMAAAAEHRSTlMAESIzM0RVZnd4gYKDhIWG6XN5ewAAAExJREFUeN7t0cENACAIBEEMv639l6EFL8HIK5PZbyMHAECWpG66TidZunWq3V9v23b9GzZs2LBhw4YNGzZs2LBhw4YNGzZs2LBhw4bNTw6u8isRx6WPrwAAAABJRU5ErkJggg=="
};

export function MultimodalAi() {
  const [image, setImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [result, setResult] = useState<ScreeningResult | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadingMessages = [
    "Analyse des structures de l'image par le moteur optique IA...",
    "Mise en relation des caractéristiques visuelles avec le protocole de tri...",
    "Évaluation de la sévérité clinique et du niveau d'urgence...",
    "Génération des recommandations de soins éducatives personnalisées..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingMessages.length);
      }, 2500);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner un fichier image (PNG, JPG, WebP).');
      return;
    }

    setMimeType(file.type);
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
      setResult(null); 
    };
    reader.onerror = () => {
      toast.error('Échec de la lecture de l\'image.');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const selectScenario = (type: 'swelling' | 'fracture' | 'discoloration') => {
    const base64Prefix = 'data:image/png;base64,';
    setImage(base64Prefix + SCENARIO_IMAGES[type]);
    setMimeType('image/png');
    setResult(null);

    if (type === 'swelling') {
      setNotes("J'ai un gonflement douloureux sur mes gencives près de ma molaire inférieure droite depuis hier. C'est chaud et ça lance constamment.");
    } else if (type === 'fracture') {
      setNotes("Ma dent de devant s'est ébréchée en mordant dans un aliment dur. Pas de douleur ni de saignement, mais le bord est très tranchant sous la langue.");
    } else {
      setNotes("J'ai remarqué des taches sombres à l'arrière de mes dents de devant inférieures. Aucune douleur ni sensibilité.");
    }
    toast.success(`Scénario sélectionné : ${type === 'swelling' ? 'Gonflement des Gencives' : type === 'fracture' ? 'Dent Cassée' : 'Taches / Tartre'}`);
  };

  const triggerScreener = async () => {
    if (!image) {
      toast.error('Veuillez charger une photo ou sélectionner un exemple clinique d\'abord.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/multimodal/screener', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: image,
          mimeType,
          patientNotes: notes.trim()
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Une erreur serveur est survenue.');
      }

      const data = await response.json();
      setResult(data);
      toast.success('Analyse de tri visuel terminée avec succès !');
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Échec de l\'analyse de tri visuel.');
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setImage(null);
    setMimeType('');
    setNotes('');
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getUrgencyStyles = (level?: string) => {
    switch (level) {
      case 'IMMEDIATE EMERGENCY':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-800',
          badge: 'bg-rose-600 text-white',
          glow: 'shadow-rose-100 border-rose-400',
          iconColor: 'text-rose-600',
          pulse: 'bg-rose-500'
        };
      case 'PROMPT EVALUATION':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
          badge: 'bg-amber-500 text-white',
          glow: 'shadow-amber-100 border-amber-400',
          iconColor: 'text-amber-500',
          pulse: 'bg-amber-400'
        };
      case 'ROUTINE/MONITOR':
      default:
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          badge: 'bg-emerald-600 text-white',
          glow: 'shadow-emerald-100 border-emerald-400',
          iconColor: 'text-emerald-600',
          pulse: 'bg-emerald-500'
        };
    }
  };

  const translateUrgency = (level?: string) => {
    if (level === 'IMMEDIATE EMERGENCY') return 'URGENCE IMMÉDIATE 🚨';
    if (level === 'PROMPT EVALUATION') return 'ÉVALUATION À PLANIFIER ⏳';
    if (level === 'ROUTINE/MONITOR') return 'CONTRÔLE DE ROUTINE 📅';
    return 'ANALYSE EFFECTUÉE';
  };

  const uStyle = getUrgencyStyles(result?.urgencyLevel);

  return (
    <div className="max-w-5xl mx-auto space-y-8 text-slate-800 py-4 text-left animate-in fade-in duration-300">
      {/* Page Header */}
      <div>
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-full px-3 py-1 text-xs font-semibold text-blue-700 mb-2">
          <Sparkles className="h-3.5 w-3.5 text-blue-600 animate-spin-slow" />
          Tri Clinique Multimodal IA
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
          <Camera className="h-8 w-8 text-blue-600 fill-blue-100" />
          Analyseur d'Urgence Visuelle IA
        </h1>
        <p className="mt-2 text-sm text-slate-600 max-w-2xl leading-relaxed text-left">
          Téléchargez une photo nette de vos dents, de vos gencives ou de votre symptôme buccal. Notre modèle de tri IA analyse instantanément les pixels pour évaluer le niveau d'urgence indicatif, isoler les signes visibles et vous proposer des directives préliminaires.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Intake (5 cols) */}
        <div className="lg:col-span-5 space-y-6 text-left">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Téléchargement & Diagnostic
            </h2>

            {/* Click-to-upload & Drag-and-drop box */}
            {!image ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 min-h-[200px]",
                  isDragOver 
                    ? "border-blue-500 bg-blue-50/50 scale-[1.01]" 
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                )}
              >
                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <Upload className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    Glissez-déposez votre image ici, ou <span className="text-blue-600">parcourez vos fichiers</span>
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">Formats acceptés : PNG, JPG, JPEG, WebP jusqu'à 10 Mo</p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            ) : (
              <div className="relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 p-2 text-left">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-black flex items-center justify-center">
                  <img
                    src={image}
                    alt="Photo du patient"
                    className="max-h-full max-w-full object-contain text-white"
                  />
                  <button
                    onClick={clearAll}
                    className="absolute top-2 right-2 bg-slate-900/80 hover:bg-slate-950 text-white rounded-full p-1.5 transition-all shadow-md active:scale-90"
                    title="Effacer l'image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-2 px-1 flex justify-between items-center text-[10px] text-slate-500 font-medium text-left">
                  <span>Photo chargée avec succès</span>
                  <button onClick={clearAll} className="text-rose-600 font-semibold hover:underline">
                    Effacer
                  </button>
                </div>
              </div>
            )}

            {/* Quick Presets / Test scenarios */}
            <div className="space-y-2.5 text-left">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Ou sélectionnez un cas clinique de démonstration :</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => selectScenario('swelling')}
                  className="flex flex-col items-center p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/20 text-center transition-all cursor-pointer bg-white"
                >
                  <span className="h-6 w-6 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-700 text-[10px] font-bold mb-1.5">A</span>
                  <span className="text-[10px] font-bold text-slate-800 block leading-tight">Gonflement</span>
                  <span className="text-[9px] text-slate-400 mt-0.5">Douloureux</span>
                </button>
                <button
                  onClick={() => selectScenario('fracture')}
                  className="flex flex-col items-center p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/20 text-center transition-all cursor-pointer bg-white"
                >
                  <span className="h-6 w-6 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 text-[10px] font-bold mb-1.5">B</span>
                  <span className="text-[10px] font-bold text-slate-800 block leading-tight">Dent Cassée</span>
                  <span className="text-[9px] text-slate-400 mt-0.5">Bord tranchant</span>
                </button>
                <button
                  onClick={() => selectScenario('discoloration')}
                  className="flex flex-col items-center p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/20 text-center transition-all cursor-pointer bg-white"
                >
                  <span className="h-6 w-6 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 text-[10px] font-bold mb-1.5">C</span>
                  <span className="text-[10px] font-bold text-slate-800 block leading-tight">Taches</span>
                  <span className="text-[9px] text-slate-400 mt-0.5">Esthétique</span>
                </button>
              </div>
            </div>

            {/* Notes Input */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-bold text-slate-700">Notes & Symptômes ressentis</label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Décrivez ce que vous ressentez (ex. douleur aiguë constante, sensibilité à l'eau froide, durée...)"
                className="w-full rounded-xl border border-slate-200 p-3 text-xs font-semibold focus:ring-blue-500 text-slate-800 placeholder-slate-400 focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Submit Triage button */}
            <button
              onClick={triggerScreener}
              disabled={loading || !image}
              className={cn(
                "w-full inline-flex items-center justify-center gap-2 rounded-xl text-white font-black py-3 text-sm shadow-md transition-all active:scale-[0.98]",
                loading || !image
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                  : "bg-blue-600 hover:bg-blue-500 cursor-pointer"
              )}
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-white" />
                  Analyse des pixels cliniques...
                </>
              ) : (
                <>
                  <Activity className="h-4 w-4" />
                  Évaluer l'urgence buccale
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: AI Outputs (7 cols) */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <AnimatePresence mode="wait">
            {/* 1. Loading State */}
            {loading && (
              <motion.div
                key="loading-card"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-6 min-h-[420px] flex flex-col items-center justify-center"
              >
                <div className="relative flex items-center justify-center">
                  <div className="h-20 w-20 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin" />
                  <Camera className="h-8 w-8 text-blue-600 absolute animate-pulse" />
                </div>
                <div className="space-y-2 max-w-sm text-center">
                  <h3 className="font-extrabold text-slate-900 text-base">Tri Clinique en Cours...</h3>
                  <p className="text-xs text-slate-400 italic">"Seul un praticien diplômé peut poser un diagnostic officiel."</p>
                  <p className="text-xs text-blue-600 font-bold font-mono tracking-tight animate-pulse pt-2">
                    {loadingMessages[loadingStep]}
                  </p>
                </div>
              </motion.div>
            )}

            {/* 2. Results Card */}
            {result && !loading && (
              <motion.div
                key="results-card"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="space-y-6 text-left"
              >
                {/* Core result banner */}
                <div className={cn("rounded-2xl border p-6 shadow-md transition-all space-y-4 text-left", uStyle.glow)}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-left">
                    <div className="space-y-1 text-left">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">NIVEAU D'URGENCE RECOMMANDÉ</span>
                      <div className="flex items-center gap-2">
                        <span className={cn("px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wide flex items-center gap-1.5", uStyle.badge)}>
                          <span className={cn("h-1.5 w-1.5 rounded-full animate-ping", uStyle.pulse)} />
                          {translateUrgency(result.urgencyLevel)}
                        </span>
                      </div>
                    </div>
                    <HeartPulse className={cn("h-10 w-10 shrink-0 hidden sm:block", uStyle.iconColor)} />
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed bg-white/60 rounded-xl p-3 border border-slate-200/50 text-left">
                    <strong>Analyse d'urgence :</strong> {result.reasoning}
                  </p>
                </div>

                {/* Main Results Container */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 text-left">
                  {/* Key Observations */}
                  <div className="space-y-3 text-left">
                    <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      Observations Visuelles
                    </h3>
                    <ul className="grid grid-cols-1 gap-2.5 text-left">
                      {result.findings.map((finding, idx) => (
                        <li key={idx} className="bg-slate-50 border border-slate-100 rounded-lg px-3.5 py-2 text-xs font-semibold text-slate-700 flex items-center gap-2 justify-start text-left">
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                          {finding}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Immediate Next Steps */}
                  <div className="space-y-3 text-left">
                    <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      Actions de Soins Préconisées
                    </h3>
                    <ul className="space-y-2 text-left">
                      {result.nextSteps.map((step, idx) => (
                        <li key={idx} className="flex gap-2 text-xs text-slate-600 font-medium leading-relaxed justify-start text-left">
                          <span className="h-5 w-5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">{idx + 1}</span>
                          <span className="pt-0.5">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Comfort Tip */}
                  <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 flex items-start gap-3 text-left">
                    <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5 text-xs text-left">
                      <span className="font-bold text-blue-900">Conseils d'accompagnement</span>
                      <p className="text-blue-800 leading-relaxed font-semibold italic">"{result.friendlyAdvice}"</p>
                    </div>
                  </div>

                  {/* Prominent Legal Disclaimer */}
                  <div className="border-t border-slate-100 pt-4 bg-slate-50 -mx-6 -mb-6 p-6 rounded-b-2xl flex items-start gap-3 text-slate-500 text-left">
                    <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="space-y-1 text-[11px] leading-relaxed text-left">
                      <span className="font-bold text-slate-800 block">Clause Limitative de Responsabilité IA</span>
                      <p className="font-medium text-slate-600 leading-relaxed">{result.disclaimer}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 3. Empty State (No result, not loading) */}
            {!result && !loading && (
              <motion.div
                key="empty-card"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-6 min-h-[420px] flex flex-col items-center justify-center text-slate-400"
              >
                <div className="h-16 w-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                  <Camera className="h-8 w-8 stroke-[1.5]" />
                </div>
                <div className="space-y-2 max-w-sm text-center">
                  <h3 className="font-extrabold text-slate-900 text-base">En Attente d'Image Clinique</h3>
                  <p className="text-xs text-slate-500 leading-relaxed text-center">
                    Téléchargez une photo nette de votre problème buccal ou sélectionnez un des exemples cliniques interactifs à gauche pour lancer l'évaluation IA instantanée.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 text-[10px] bg-slate-50 text-slate-500 border border-slate-200 rounded-full px-3 py-1 font-bold">
                  <ShieldCheck className="h-3.5 w-3.5 text-slate-400" /> Aucun journal de diagnostic actif
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
