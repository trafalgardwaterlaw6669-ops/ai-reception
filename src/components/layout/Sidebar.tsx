import { Link, useLocation } from "react-router";
import { 
  LayoutDashboard, 
  CalendarDays, 
  Users, 
  Settings, 
  MessageSquare,
  PhoneCall,
  Bell,
  Brain,
  TrendingUp,
  Building2,
  RefreshCw,
  Globe,
  ClipboardList,
  Volume2,
  Zap,
  Camera,
  Sparkles,
  Languages,
  Play
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useClinics } from "@/context/ClinicContext";
import { useLanguage, Language } from "@/context/LanguageContext";

const navigation = [
  { name: 'Tableau de bord', translationKey: 'nav.dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Rendez-vous', translationKey: 'nav.appointments', href: '/appointments', icon: CalendarDays },
  { name: 'Patients', translationKey: 'nav.patients', href: '/patients', icon: Users },
  { name: 'Formulaires digitaux', translationKey: 'nav.forms', href: '/digital-forms', icon: ClipboardList },
  { name: 'Notes vocales dentiste', translationKey: 'nav.voicenotes', href: '/dentist-voice-notes', icon: Volume2 },
  { name: 'Liste d\'attente IA', translationKey: 'nav.waitlist', href: '/waitlist', icon: Zap },
  { name: 'Mémoire patient IA', translationKey: 'nav.memory', href: '/ai-memory', icon: Brain },
  { name: 'IA auto-améliorante', translationKey: 'nav.selfimproving', href: '/self-improving-ai', icon: Sparkles },
  { name: 'Dépistage visuel IA', translationKey: 'nav.screener', href: '/visual-screener', icon: Camera },
  { name: 'Messages', translationKey: 'nav.messages', href: '/messages', icon: MessageSquare },
  { name: 'Appels', translationKey: 'nav.calls', href: '/calls', icon: PhoneCall },
  { name: 'Rappels', translationKey: 'nav.reminders', href: '/reminders', icon: Bell },
  { name: 'Prédiction d\'absences', translationKey: 'nav.prediction', href: '/predictions', icon: Brain },
  { name: 'Analyses cliniques', translationKey: 'nav.analytics', href: '/analytics', icon: TrendingUp },
  { name: 'Google Workspace', translationKey: 'nav.workspace', href: '/google-workspace', icon: Sparkles },
  { name: 'Onboarding Express', translationKey: 'nav.onboarding', href: '/onboarding', icon: Play },
  { name: 'Paramètres', translationKey: 'nav.settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  const { currentClinic, clinics, isSyncing, lastSynced, setCurrentClinicById, triggerGlobalSync, demoSettings } = useClinics();
  const { language, setLanguage, t } = useLanguage();

  const initials = demoSettings.dentistName
    .split(' ')
    .filter(n => n && !n.toLowerCase().includes('dr') && !n.includes('.'))
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'DR';

  return (
    <div className="flex h-full w-64 flex-col bg-white border-r border-slate-200">
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">
          <span className="text-blue-600">AI</span> Dental
        </h1>
        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-green-500 ring-4 ring-green-100 animate-pulse" title="Base de données maître synchronisée" />
      </div>

      {/* Multi-Clinic Switcher & Language Segment */}
      <div className="p-4 bg-slate-50 border-b border-slate-100 space-y-3">
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {t('global.clinic_switcher')}
          </label>
          <div className="relative">
            <select
              value={currentClinic ? currentClinic.id : 'all'}
              onChange={(e) => setCurrentClinicById(e.target.value)}
              className="block w-full rounded-lg border-slate-200 py-2 pl-3 pr-8 text-xs font-semibold text-slate-800 bg-white hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
            >
              <option value="all">🌐 {t('global.all_clinics')}</option>
              {clinics.map((c) => (
                <option key={c.id} value={c.id}>
                  🏨 {c.name} ({c.city})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Global Language Toggle */}
        <div className="space-y-1">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Languages className="h-3 w-3 text-slate-400" />
            {t('global.language')}
          </label>
          <div className="relative">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="block w-full rounded-lg border-slate-200 py-2 pl-3 pr-8 text-xs font-semibold text-slate-800 bg-white hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
            >
              <option value="French">🇫🇷 Français</option>
              <option value="English">🇬🇧 English</option>
              <option value="Arabic">🇲🇦 العربية</option>
              <option value="Darija">🇲🇦 Darija</option>
            </select>
          </div>
        </div>

        {/* Sync Controls */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <Globe className="h-3.5 w-3.5 text-blue-500" />
            <span className="font-mono">{t('global.synced')}: {lastSynced}</span>
          </div>
          <button
            onClick={triggerGlobalSync}
            disabled={isSyncing}
            className={cn(
              "p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-white border border-transparent hover:border-slate-200 transition-all cursor-pointer",
              isSyncing && "animate-spin text-blue-600"
            )}
            title={t('global.sync_title')}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-3">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900',
                  'group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors'
                )}
              >
                <item.icon
                  className={cn(
                    isActive ? 'text-blue-700' : 'text-slate-400 group-hover:text-slate-500',
                    'mr-3 h-5 w-5 flex-shrink-0 transition-colors'
                  )}
                  aria-hidden="true"
                />
                {t(item.translationKey)}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Information Footer */}
      <div className="border-t border-slate-200 p-4 bg-slate-50/50">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
            {initials}
          </div>
          <div className="ml-3">
            <p className="text-sm font-bold text-slate-700">{demoSettings.dentistName}</p>
            <p className="text-xs text-slate-400 font-medium">{t('global.role')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
