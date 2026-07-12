import React, { useState } from 'react';
import { 
  TrendingUp, 
  Clock, 
  Calendar, 
  Brain, 
  DollarSign, 
  Sparkles, 
  AlertCircle,
  HelpCircle,
  TrendingDown,
  ArrowRight,
  Gauge,
  Flame,
  Briefcase,
  Hourglass,
  CalendarCheck
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  Cell, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { cn } from "@/lib/utils";

// 1. Weekly cancellation spikes data
const cancellationData = [
  { day: 'Lun', rate: 26, label: 'Pic' },
  { day: 'Mar', rate: 11, label: 'Normal' },
  { day: 'Mer', rate: 8, label: 'Bas' },
  { day: 'Jeu', rate: 12, label: 'Normal' },
  { day: 'Ven', rate: 19, label: 'Modéré' },
];

// 2. Treatment revenue breakdown
const treatmentRevenue = [
  { name: 'Implants dentaires', value: 40000, percentage: 40, color: '#2563eb' }, // #2563eb is blue-600
  { name: 'Couronnes & Ponts', value: 25000, percentage: 25, color: '#3b82f6' },
  { name: 'Nettoyages de routine', value: 15000, percentage: 15, color: '#60a5fa' },
  { name: 'Traitements de canal', value: 12000, percentage: 12, color: '#93c5fd' },
  { name: 'Urgences', value: 8000, percentage: 8, color: '#bfdbfe' },
];

// 3. Thursday hourly demand vs capacity (for extension recommendation)
const thursdayDemand = [
  { hour: '09:00', bookings: 95, capacity: 100 },
  { hour: '11:00', bookings: 98, capacity: 100 },
  { hour: '13:00', bookings: 60, capacity: 100 },
  { hour: '15:00', bookings: 100, capacity: 100 },
  { hour: '17:00', bookings: 120, capacity: 100, overflow: true }, // overflow!
  { hour: '18:00', bookings: 145, capacity: 100, overflow: true }, // overflow!
];

export function Analytics() {
  const [activeTab, setActiveTab] = useState<'overview' | 'cancellations' | 'revenue' | 'schedule'>('overview');
  const [highlightInsight, setHighlightInsight] = useState<string | null>(null);

  const insightsList = [
    {
      id: 'cancellation',
      title: 'Pic d\'annulation du lundi',
      stat: 'Taux de 26%',
      quote: 'La plupart des annulations ont lieu le lundi.',
      desc: 'L\'analyse statistique du comportement des patients montre que le risque d\'annulation est 2,4 fois plus élevé en début de semaine. Cela s\'explique par le relâchement de la coordination le week-end et les contraintes de planning en début de semaine.',
      recom: 'Pré-confirmez les réservations du lundi avec des flux SMS interactifs le jeudi après-midi au lieu du vendredi.',
      color: 'border-red-200 bg-red-50/50 text-red-700',
      icon: Calendar,
    },
    {
      id: 'revenue',
      title: 'Cœur des revenus d\'implants',
      stat: '40% du revenu total',
      quote: 'Les implants génèrent 40% des revenus.',
      desc: 'Les implants dentaires sont le traitement à plus forte marge de la clinique. Bien qu\'ils ne représentent que 12% de la fréquence globale des réservations, ils constituent près de la moitié de votre contribution aux flux de trésorerie.',
      recom: 'Augmentez le positionnement ciblé sur Google Maps / publicités locales spécifiquement pour les implants de qualité supérieure.',
      color: 'border-blue-200 bg-blue-50/50 text-blue-700',
      icon: DollarSign,
    },
    {
      id: 'noshows',
      title: 'Frais de temps perdu',
      stat: '17 heures / mois perdues',
      quote: 'Vous perdez 17 heures/mois en rendez-vous manqués.',
      desc: 'Temps de fauteuil inoccupé et frais de personnel liés aux absences non signalées. Sur un an, cela équivaut à 204 heures opérationnelles perdues, soit plus de 35 000 $ de valeur clinique non réalisée.',
      recom: 'Activez le moteur automatisé de prédiction de No-Show pour déclencher des rappels de confirmation en 1 clic.',
      color: 'border-amber-200 bg-amber-50/50 text-amber-700',
      icon: Clock,
    },
    {
      id: 'thursdays',
      title: 'Besoin d\'extension le jeudi',
      stat: '+2.5 Heures de demande latente',
      quote: 'Vous devriez prolonger les heures du jeudi.',
      desc: 'Les réservations du jeudi en fin d\'après-midi ont une densité moyenne de réservation de 145%, entraînant un débordement de patients. Les professionnels actifs demandent fortement des créneaux le jeudi soir plutôt que le vendredi.',
      recom: 'Prolongez les heures d\'ouverture de la clinique le jeudi jusqu\'à 20h00 (actuellement 18h00) pour capter jusqu\'à 4 200 $/mois de réservations supplémentaires.',
      color: 'border-green-200 bg-green-50/50 text-green-700',
      icon: Clock,
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <TrendingUp className="h-7 w-7 text-blue-600" />
            Intelligence Clinique & Analyses
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Insights stratégiques générés par l'IA, diagnostics opérationnels et optimisations financières modélisés à partir des flux de patients.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 border border-indigo-100">
            <Brain className="mr-1.5 h-4 w-4 text-indigo-500 animate-pulse" />
            Mode Auditeur IA Actif
          </span>
        </div>
      </div>

      {/* AI Chief Analyst Advisory Box */}
      <div className="relative overflow-hidden bg-slate-900 text-white rounded-2xl border border-slate-800 p-6 md:p-8 shadow-lg">
        {/* Decorative ambient light */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row gap-6 items-start">
          <div className="h-12 w-12 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0 shadow-inner">
            <Brain className="h-6 w-6" />
          </div>
          
          <div className="space-y-4 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Note du Conseiller Exécutif</span>
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              <span className="text-xs text-slate-400">Rapport d'optimisation du cabinet dentaire</span>
            </div>
            
            <div className="space-y-3">
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                "Les humains analysent rarement cela."
              </h2>
              <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-4xl">
                Nos modèles de machine learning ont identifié des anomalies critiques dans le calendrier de réservation de votre clinique que les outils de reporting standard ignorent complètement. En résolvant ces goulots d'étranglement structurels, vous pouvez récupérer plus de 60 000 $ de valeur annuelle perdue.
              </p>
            </div>

            {/* Direct AI Insights List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
              <div 
                className={cn(
                  "p-4 rounded-xl border border-slate-800/80 bg-slate-950/40 cursor-pointer transition-all hover:border-blue-500/50 hover:bg-slate-950/80",
                  highlightInsight === 'cancellation' && 'border-blue-500 bg-slate-950'
                )}
                onClick={() => {
                  setHighlightInsight('cancellation');
                  setActiveTab('cancellations');
                }}
              >
                <div className="flex items-center gap-2.5 text-xs font-semibold text-blue-400 mb-1">
                  <span className="h-2 w-2 rounded-full bg-red-400" />
                  Chute du lundi
                </div>
                <p className="text-sm font-bold text-white">"La plupart des annulations ont lieu le lundi."</p>
                <p className="text-xs text-slate-400 mt-1">Pic de 26% d'annulations observé au début de chaque semaine.</p>
              </div>

              <div 
                className={cn(
                  "p-4 rounded-xl border border-slate-800/80 bg-slate-950/40 cursor-pointer transition-all hover:border-blue-500/50 hover:bg-slate-950/80",
                  highlightInsight === 'revenue' && 'border-blue-500 bg-slate-950'
                )}
                onClick={() => {
                  setHighlightInsight('revenue');
                  setActiveTab('revenue');
                }}
              >
                <div className="flex items-center gap-2.5 text-xs font-semibold text-blue-400 mb-1">
                  <span className="h-2 w-2 rounded-full bg-blue-400" />
                  Soins à forte marge
                </div>
                <p className="text-sm font-bold text-white">"Les implants génèrent 40% des revenus."</p>
                <p className="text-xs text-slate-400 mt-1">La pose d'implants produit le revenu le plus élevé par heure de fauteuil de votre catalogue.</p>
              </div>

              <div 
                className={cn(
                  "p-4 rounded-xl border border-slate-800/80 bg-slate-950/40 cursor-pointer transition-all hover:border-blue-500/50 hover:bg-slate-950/80",
                  highlightInsight === 'noshows' && 'border-blue-500 bg-slate-950'
                )}
                onClick={() => {
                  setHighlightInsight('noshows');
                  setActiveTab('overview');
                }}
              >
                <div className="flex items-center gap-2.5 text-xs font-semibold text-blue-400 mb-1">
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  Frais de fauteuil inoccupé
                </div>
                <p className="text-sm font-bold text-white">"Vous perdez 17 heures/mois en rendez-vous manqués."</p>
                <p className="text-xs text-slate-400 mt-1">Les créneaux de traitement inoccupés dégradent la vitesse clinique et gaspillent les assistants.</p>
              </div>

              <div 
                className={cn(
                  "p-4 rounded-xl border border-slate-800/80 bg-slate-950/40 cursor-pointer transition-all hover:border-blue-500/50 hover:bg-slate-950/80",
                  highlightInsight === 'thursdays' && 'border-blue-500 bg-slate-950'
                )}
                onClick={() => {
                  setHighlightInsight('thursdays');
                  setActiveTab('schedule');
                }}
              >
                <div className="flex items-center gap-2.5 text-xs font-semibold text-blue-400 mb-1">
                  <span className="h-2 w-2 rounded-full bg-green-400" />
                  Optimisation des horaires
                </div>
                <p className="text-sm font-bold text-white">"Vous devriez prolonger les heures du jeudi."</p>
                <p className="text-xs text-slate-400 mt-1">Le pic extrême de demande de 16h00 à 18h00 indique d'importantes demandes en fin d'après-midi.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Navigation Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300',
              'whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-sm transition-all'
            )}
          >
            Aperçu des Insights
          </button>
          <button
            onClick={() => setActiveTab('cancellations')}
            className={cn(
              activeTab === 'cancellations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300',
              'whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-sm transition-all'
            )}
          >
            Tendances d'Annulation
          </button>
          <button
            onClick={() => setActiveTab('revenue')}
            className={cn(
              activeTab === 'revenue'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300',
              'whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-sm transition-all'
            )}
          >
            Répartition des Revenus
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={cn(
              activeTab === 'schedule'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300',
              'whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-sm transition-all'
            )}
          >
            Mesures de Capacité du Jeudi
          </button>
        </nav>
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {insightsList.map((ins) => (
            <div 
              key={ins.id} 
              className={cn(
                "bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between transition-all hover:shadow-md",
                highlightInsight === ins.id ? "ring-2 ring-blue-500 border-transparent bg-blue-50/5" : ""
              )}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold border",
                    ins.color
                  )}>
                    <ins.icon className="mr-1.5 h-3.5 w-3.5" />
                    {ins.stat}
                  </span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{ins.title}</span>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-slate-900">
                    "{ins.quote}"
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    {ins.desc}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100 bg-slate-50/50 -mx-6 -mb-6 p-6 rounded-b-2xl">
                <div className="flex items-start gap-2 text-xs">
                  <Sparkles className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-800">Recommandation du système : </span>
                    <span className="text-slate-600">{ins.recom}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'cancellations' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Profil hebdomadaire des annulations de patients</h3>
              <p className="text-xs text-slate-500 mt-0.5">Calculé en pourcentage de rendez-vous programmés qui sont annulés dans les 24 heures.</p>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cancellationData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tickLine={false} />
                  <YAxis unit="%" tickLine={false} />
                  <Tooltip 
                    formatter={(value) => [`Taux d'annulation de ${value}%`, 'Taux quotidien']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                    {cancellationData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.day === 'Lun' ? '#ef4444' : entry.day === 'Ven' ? '#f59e0b' : '#3b82f6'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-4">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Pic du lundi (26%)</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Modéré le vendredi (19%)</span>
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Milieu de semaine stable</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-10 w-10 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-600">
                <Calendar className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Diagnostics du lundi</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                "La plupart des annulations ont lieu le lundi." Pourquoi cette tendance spécifique existe-t-elle ?
              </p>
              <ul className="space-y-2.5 text-xs text-slate-500 list-disc list-inside">
                <li>Les rappels pré-week-end envoyés le vendredi après-midi sont oubliés pendant le week-end.</li>
                <li>Le lundi matin suscite des conflits professionnels urgents, provoquant des annulations de dernière minute.</li>
                <li>Les goulots d'étranglement de transport à Casablanca et Rabat sont statistiquement pires en début de semaine.</li>
              </ul>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-xs text-amber-900">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Plan d'action proposé</p>
                <p className="leading-relaxed">Envoyez les rappels pour le lundi dès le jeudi matin, et exigez une confirmation active avant le vendredi à 14h00, sous peine de libérer le créneau pour les patients sur liste d'attente urgente.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'revenue' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Répartition de la contribution aux revenus</h3>
              <p className="text-xs text-slate-500 mt-0.5">Revenus et pourcentage de part de facturation totale des cliniques.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={treatmentRevenue}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {treatmentRevenue.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${(value as number).toLocaleString()} $`, 'Revenu mensuel']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-3">
                {treatmentRevenue.map((tr) => (
                  <div key={tr.name} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-slate-50/50 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: tr.color }} />
                      <span className="text-xs font-semibold text-slate-700">{tr.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-900 block">{tr.value.toLocaleString()} $</span>
                      <span className="text-[10px] text-slate-400 font-medium">Part de {tr.percentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-10 w-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <DollarSign className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Centre de profit des implants</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                "Les implants génèrent 40% des revenus." C'est le principal levier de santé financière de votre cabinet.
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Bien que les implants de qualité supérieure représentent une minorité des procédures réelles (moins de 12% des patients), leur forte valeur unitaire garantit la viabilité financière globale. Protéger ces rendez-vous contre l'annulation est une priorité absolue.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-900">
              <p className="font-bold mb-1 flex items-center gap-1.5"><Sparkles className="h-3.5 w-3.5 text-blue-500" /> Recommandation d'optimisation IA</p>
              <p className="leading-relaxed">Maximisez les revenus en attribuant nos rappels prédictifs de haute intensité principalement aux prospects d'implants et aux patients réservés pour des procédures implantaires multi-étapes.</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'schedule' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900">Densité de capacité horaire du jeudi</h3>
              <p className="text-xs text-slate-500 mt-0.5">Densité de réservation par rapport à la limite optimale par heure opérationnelle. Plus de 100% indique un débordement important de patients.</p>
            </div>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={thursdayDemand}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="hour" tickLine={false} />
                  <YAxis unit="%" tickLine={false} />
                  <Tooltip 
                    formatter={(value) => [`Densité de réservation de ${value}%`, 'Densité']}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="bookings" 
                    stroke="#10b981" // emerald-500
                    strokeWidth={3} 
                    dot={{ r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} 
                  />
                  <Line 
                    type="monotone" 
                    dataKey="capacity" 
                    stroke="#cbd5e1" // slate-300
                    strokeDasharray="5 5" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-100 pt-4">
              <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Flux de réservations du jeudi</span>
              <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 border-t border-dashed border-slate-400 inline-block" /> Capacité théorique du cabinet (100%)</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="h-10 w-10 rounded-lg bg-green-50 border border-green-100 flex items-center justify-center text-green-600">
                <Clock className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Potentiel d'heures supplémentaires du jeudi</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                "Vous devriez prolonger les heures du jeudi." Nos modèles indiquent que les professionnels actifs demandent systématiquement des créneaux plus tardifs.
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                En prolongeant la plage d'ouverture de la clinique de 18h00 à 20h00 le jeudi, vous vous alignez sur la demande des patients, remplissant facilement 4 créneaux premium supplémentaires par semaine.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex gap-3 text-xs text-green-900">
              <CalendarCheck className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">Impact prévisionnel</p>
                <p className="leading-relaxed">Augmentation attendue des réservations hebdomadaires : +1 200 $, représentant +10,8% d'activité pour la clinique avec des coûts de personnel supplémentaires négligeables.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Grid of Key Diagnostic Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-blue-50 rounded-xl text-blue-600">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Part des implants</span>
            <span className="text-xl font-black text-slate-900">40% du revenu</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-amber-50 rounded-xl text-amber-600">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Temps de fauteuil perdu</span>
            <span className="text-xl font-black text-slate-900">17 heures / mois</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-red-50 rounded-xl text-red-600">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Annulations du lundi</span>
            <span className="text-xl font-black text-slate-900">26% (Plus fort pic)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
