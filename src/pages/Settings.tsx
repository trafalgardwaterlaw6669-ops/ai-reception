import { useState } from 'react';
import { 
  Building2, 
  Bot, 
  Languages, 
  Clock, 
  CreditCard,
  Save,
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useLanguage, Language } from '@/context/LanguageContext';
import { useClinics } from '@/context/ClinicContext';

export function Settings() {
  const [activeTab, setActiveTab] = useState('ai');
  const { language, setLanguage, t } = useLanguage();
  const { demoSettings, updateDemoSettings, isDemoModeActive, toggleDemoMode } = useClinics();

  const [tempDentistName, setTempDentistName] = useState(demoSettings.dentistName);
  const [tempClinicName, setTempClinicName] = useState(demoSettings.clinicName);
  const [tempPhoneNumber, setTempPhoneNumber] = useState(demoSettings.phoneNumber);
  const [tempCity, setTempCity] = useState(demoSettings.city);

  const handleSaveDemoSettings = () => {
    updateDemoSettings({
      dentistName: tempDentistName,
      clinicName: tempClinicName,
      phoneNumber: tempPhoneNumber,
      city: tempCity,
    });
    toast.success(`Démo personnalisée avec succès pour le cabinet de ${tempDentistName} !`);
  };

  const handleResetDemoSettings = () => {
    setTempDentistName('Dr. El Alami');
    setTempClinicName('AuraDental Clinique');
    setTempPhoneNumber('+212 5 22 99 88 77');
    setTempCity('Casablanca');
    updateDemoSettings({
      dentistName: 'Dr. El Alami',
      clinicName: 'AuraDental Clinique',
      phoneNumber: '+212 5 22 99 88 77',
      city: 'Casablanca',
    });
    toast.success("Informations de démo réinitialisées par défaut.");
  };

  const tabs = [
    { id: 'ai', name: 'Secrétaire Virtuelle', icon: Bot },
    { id: 'clinic', name: 'Cabinet Dentaire', icon: Building2 },
    { id: 'hours', name: 'Horaires de Travail', icon: Clock },
    { id: 'languages', name: t('nav.settings'), icon: Languages },
    { id: 'demo', name: 'Mode Démo Vente', icon: Sparkles },
    { id: 'billing', name: 'Abonnement', icon: CreditCard },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-slate-800 text-left">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('settings.title')}</h1>
        <p className="mt-2 text-sm text-slate-600">
          {t('settings.subtitle')}
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 flex-shrink-0 text-left">
          <nav className="flex space-x-2 md:flex-col md:space-x-0 md:space-y-1 overflow-x-auto pb-2 md:pb-0">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700 font-bold'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50 font-semibold',
                  'group flex items-center rounded-md px-3 py-2 text-sm transition-colors whitespace-nowrap cursor-pointer'
                )}
              >
                <tab.icon
                  className={cn(
                    activeTab === tab.id ? 'text-blue-700' : 'text-slate-400 group-hover:text-slate-500',
                    'mr-3 h-5 w-5 flex-shrink-0'
                  )}
                  aria-hidden="true"
                />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 text-left">
          {activeTab === 'ai' && (
            <div className="bg-white shadow-sm border border-slate-200 rounded-xl text-left">
              <div className="px-4 py-5 sm:p-6 text-left">
                <h3 className="text-base font-bold leading-6 text-slate-900 text-left">Comportements de la Secrétaire Virtuelle</h3>
                <div className="mt-2 max-w-xl text-sm text-slate-500 text-left">
                  <p>Configurez la manière dont votre secrétaire virtuelle interagit avec les patients par téléphone et par WhatsApp.</p>
                </div>
                
                <form className="mt-6 space-y-6 text-left">
                  <div className="space-y-4 text-left">
                    <div className="flex items-start text-left">
                      <div className="flex h-6 items-center">
                        <input id="auto_book" name="auto_book" type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer" />
                      </div>
                      <div className="ml-3 text-sm leading-6 text-left">
                        <label htmlFor="auto_book" className="font-semibold text-slate-900">Prise de rendez-vous automatique</label>
                        <p className="text-slate-500">Autoriser l'IA à enregistrer directement les rendez-vous sur les créneaux disponibles du calendrier.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start text-left">
                      <div className="flex h-6 items-center">
                        <input id="missed_call" name="missed_call" type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer" />
                      </div>
                      <div className="ml-3 text-sm leading-6 text-left">
                        <label htmlFor="missed_call" className="font-semibold text-slate-900">Relance automatique des appels manqués</label>
                        <p className="text-slate-500">Envoyer automatiquement un message WhatsApp de courtoisie si un appel vers le cabinet n'a pas pu aboutir.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start text-left">
                      <div className="flex h-6 items-center">
                        <input id="slot_filling" name="slot_filling" type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer" />
                      </div>
                      <div className="ml-3 text-sm leading-6 text-left">
                        <label htmlFor="slot_filling" className="font-semibold text-slate-900">Remplissage de liste d'attente</label>
                        <p className="text-slate-500">Lorsqu'un rendez-vous est annulé, l'IA propose immédiatement la plage horaire vacante aux patients en attente.</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-200 pt-6 text-left">
                    <label htmlFor="custom_instructions" className="block text-sm font-bold leading-6 text-slate-900">
                      Consignes & Règles Personnalisées de l'IA
                    </label>
                    <div className="mt-2">
                      <textarea
                        id="custom_instructions"
                        name="custom_instructions"
                        rows={4}
                        className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 text-xs sm:text-sm sm:leading-6 font-medium p-3"
                        defaultValue="Nous acceptons uniquement le paiement en espèces ou par carte bancaire CMI. Pas de consultation d'enfants de moins de 5 ans. Les cas d'urgence absolue doivent être orientés vers le numéro personnel du docteur."
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Ajoutez des règles strictes que la secrétaire virtuelle virtuelle doit impérativement respecter lors des appels.</p>
                  </div>
                  
                  <div className="flex justify-end border-t border-slate-200 pt-6">
                    <button 
                      type="button" 
                      onClick={() => toast.success("Configuration sauvegardée avec succès !")}
                      className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 cursor-pointer"
                    >
                      <Save className="h-4 w-4" />
                      Enregistrer les réglages
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'hours' && (
            <div className="bg-white shadow-sm border border-slate-200 rounded-xl text-left">
              <div className="px-4 py-5 sm:p-6 text-left">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                  <div>
                    <h3 className="text-base font-bold leading-6 text-slate-900">Horaires d'Ouverture & Pilote Automatique IA</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Configurez les horaires de présence physique du cabinet. En dehors de ces heures, l'IA bascule en mode Pilote Automatique 24h/24.
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                    <span className="mr-1 h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                    Couverture IA 24h/24 Active
                  </span>
                </div>

                {/* Tagline Showcase */}
                <div className="bg-slate-900 text-white p-4 rounded-xl mb-6 border border-slate-800 text-left">
                  <div className="flex gap-3 text-left">
                    <Bot className="h-5 w-5 text-indigo-400 mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <h4 className="text-sm font-bold">Moteur "Zéro Appel Perdu"</h4>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed text-left">
                        Lorsque des patients appellent en dehors des horaires d'ouverture, vos lignes physiques basculent automatiquement vers le système vocal Gemini IA. 
                        Vos patients bénéficient d'un accueil réactif et naturel pour caler leur rendez-vous, évitant ainsi la messagerie classique souvent ignorée.
                      </p>
                    </div>
                  </div>
                </div>

                <form className="space-y-6 text-left">
                  {/* Business Hours List */}
                  <div className="space-y-4 text-left">
                    <h4 className="text-sm font-bold text-slate-900">Horaires Clinique</h4>
                    
                    {[
                      { day: 'Lundi - Vendredi', hours: '09:00 - 18:00', ai: 'Mode Assistant (Débordement & Lignes occupées)' },
                      { day: 'Samedi', hours: 'Fermé', ai: 'Pilote Automatique (Réponse 24h/24)' },
                      { day: 'Dimanche', hours: 'Fermé', ai: 'Pilote Automatique (Réponse 24h/24)' },
                    ].map((item, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 gap-2 text-left">
                        <div className="text-sm font-semibold text-slate-800">{item.day}</div>
                        <div className="flex items-center gap-4 text-xs text-left">
                          <span className="font-mono text-slate-600 bg-white px-2 py-1 rounded border border-slate-200 font-semibold">{item.hours}</span>
                          <span className={cn(
                            "inline-flex items-center rounded-md px-2 py-0.5 font-bold ring-1 ring-inset",
                            item.hours === 'Fermé' ? "bg-indigo-50 text-indigo-700 ring-indigo-600/10" : "bg-blue-50 text-blue-700 ring-blue-600/10"
                          )}>
                            {item.ai}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Voicemail Bypassing Options */}
                  <div className="border-t border-slate-200 pt-6 space-y-4 text-left">
                    <h4 className="text-sm font-bold text-slate-900">Directives d'Appels 24h/24</h4>

                    <div className="flex items-start text-left">
                      <div className="flex h-6 items-center">
                        <input id="bypass_voicemail" name="bypass_voicemail" type="checkbox" defaultChecked disabled className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-not-allowed" />
                      </div>
                      <div className="ml-3 text-sm leading-6 text-left">
                        <label htmlFor="bypass_voicemail" className="font-bold text-slate-900 flex items-center gap-2">
                          Éviter totalement la boîte vocale (Toujours actif)
                          <span className="inline-flex items-center rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">Noyau Standard</span>
                        </label>
                        <p className="text-slate-500">Chaque appel obtient une réponse. Les patients ne sont jamais renvoyés vers une messagerie ; l'IA décroche instantanément.</p>
                      </div>
                    </div>

                    <div className="flex items-start text-left">
                      <div className="flex h-6 items-center">
                        <input id="afterhours_booking" name="afterhours_booking" type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer" />
                      </div>
                      <div className="ml-3 text-sm leading-6 text-left">
                        <label htmlFor="afterhours_booking" className="font-bold text-slate-900">Réservation Directe Hors Horaires d'Ouverture</label>
                        <p className="text-slate-500">Permet aux patients d'enregistrer et de bloquer des créneaux en direct hors horaires. L'IA actualise l'agenda et les tâches Google instantanément.</p>
                      </div>
                    </div>
                  </div>

                  {/* Custom After-Hours Message */}
                  <div className="border-t border-slate-200 pt-6 text-left">
                    <label htmlFor="afterhours_greeting" className="block text-sm font-bold leading-6 text-slate-900">
                      Message d'Accueil IA Hors Horaires
                    </label>
                    <div className="mt-2 text-left">
                      <textarea
                        id="afterhours_greeting"
                        name="afterhours_greeting"
                        rows={4}
                        className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 text-xs sm:text-sm sm:leading-6 font-medium p-3"
                        defaultValue="Bonjour ! Merci d'avoir contacté la clinique AuraDental. Nos bureaux physiques sont actuellement fermés, mais je suis votre secrétaire virtuelle disponible 24h/24. Je peux planifier ou reporter un rendez-vous, ou répondre à vos questions pratiques à tout moment. Comment puis-je vous aider aujourd'hui ?"
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Ce message d'introduction est diffusé par l'IA lorsque le cabinet physique est fermé.</p>
                  </div>

                  <div className="flex justify-end border-t border-slate-200 pt-6">
                    <button 
                      type="button" 
                      onClick={() => toast.success("Horaires de travail mis à jour avec succès !")}
                      className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 cursor-pointer"
                    >
                      <Save className="h-4 w-4" />
                      Enregistrer les horaires
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'languages' && (
            <div className="bg-white shadow-sm border border-slate-200 rounded-xl text-left">
              <div className="px-4 py-5 sm:p-6 text-left">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6 text-left">
                  <div>
                    <h3 className="text-base font-bold leading-6 text-slate-900">Routage Multilingue Voix & Chat</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Gérez la manière dont votre secrétaire virtuelle gère les différentes langues parlées au Maroc.
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-semibold text-green-700 ring-1 ring-inset ring-green-700/10">
                    <span className="mr-1 h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                    Détection de langue en direct
                  </span>
                </div>

                {/* Global Interface Language Switcher Card */}
                <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl mb-6 text-left">
                  <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <span className="p-1 bg-blue-100 text-blue-700 rounded">
                      <Languages className="h-4 w-4" />
                    </span>
                    {t('global.language')} / Langue de l'interface système
                  </h4>
                  <p className="text-xs text-slate-500 mb-4">
                    Modifiez globalement la langue d'affichage du tableau de bord de la clinique.
                  </p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {(['French', 'English', 'Arabic', 'Darija'] as Language[]).map((lang) => {
                      const details = {
                        French: { flag: '🇫🇷', label: 'Français' },
                        English: { flag: '🇬🇧', label: 'English' },
                        Arabic: { flag: '🇲🇦', label: 'العربية' },
                        Darija: { flag: '🇲🇦', label: 'Darija' }
                      }[lang];
                      
                      const isSelected = language === lang;
                      return (
                        <button
                          key={lang}
                          type="button"
                          onClick={() => setLanguage(lang)}
                          className={cn(
                            "flex items-center justify-center gap-2 p-3 rounded-xl border text-sm font-bold transition-all cursor-pointer shadow-sm",
                            isSelected 
                              ? "bg-blue-600 border-blue-600 text-white font-bold" 
                              : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                          )}
                        >
                          <span className="text-lg">{details.flag}</span>
                          <span>{details.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Info Alert */}
                <div className="bg-blue-50 border border-blue-100 text-blue-800 p-4 rounded-xl mb-6 flex gap-3 text-left">
                  <Languages className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <h4 className="text-sm font-bold">Moteur de Reconnaissance Triple</h4>
                    <p className="text-xs text-blue-700 mt-1 leading-relaxed text-left">
                      Notre système intègre des modèles optimisés pour la Darija marocaine (retranscription orale avec accents régionaux), le Français (grammaire clinique) et l'Anglais. L'IA bascule fluidement de l'un à l'autre en cours de conversation selon le choix du patient.
                    </p>
                  </div>
                </div>

                <form className="space-y-6 text-left">
                  {/* Active Languages Configuration */}
                  <div className="space-y-4 text-left">
                    <h4 className="text-sm font-bold text-slate-900">{t('settings.active_languages')}</h4>
                    
                    <div className="space-y-3">
                      {/* French */}
                      <div className="flex items-start justify-between p-4 rounded-lg bg-slate-50 border border-slate-200 text-left">
                        <div className="flex gap-3 text-left">
                          <span className="text-xl">🇫🇷</span>
                          <div className="text-left">
                            <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                              Français
                              <span className="inline-flex items-center rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">Principal</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">Utilisé principalement pour les explications cliniques, les termes de soins, les ordonnances et la facturation.</p>
                          </div>
                        </div>
                        <input type="checkbox" defaultChecked disabled className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-not-allowed" />
                      </div>

                      {/* Darija */}
                      <div className="flex items-start justify-between p-4 rounded-lg bg-slate-50 border border-slate-200 text-left">
                        <div className="flex gap-3 text-left">
                          <span className="text-xl">🇲🇦</span>
                          <div className="text-left">
                            <div className="text-sm font-bold text-slate-800">Darija Marocaine</div>
                            <p className="text-xs text-slate-500 mt-0.5">Langue naturelle parlée par plus de 90% des patients. Optimisée pour les dialectes et expressions orales locales.</p>
                          </div>
                        </div>
                        <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer" />
                      </div>

                      {/* Arabic */}
                      <div className="flex items-start justify-between p-4 rounded-lg bg-slate-50 border border-slate-200 text-left">
                        <div className="flex gap-3 text-left">
                          <span className="text-xl">🇲🇦</span>
                          <div className="text-left">
                            <div className="text-sm font-bold text-slate-800">Arabe Standard Moderne</div>
                            <p className="text-xs text-slate-500 mt-0.5">Langue écrite officielle pour la correspondance mutuelle, les devis administratifs et d'assurance.</p>
                          </div>
                        </div>
                        <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer" />
                      </div>

                      {/* English */}
                      <div className="flex items-start justify-between p-4 rounded-lg bg-slate-50 border border-slate-200 text-left">
                        <div className="flex gap-3 text-left">
                          <span className="text-xl">🇬🇧</span>
                          <div className="text-left">
                            <div className="text-sm font-bold text-slate-800">Anglais</div>
                            <p className="text-xs text-slate-500 mt-0.5">Permet un accueil parfait pour les touristes, expatriés et patients internationaux.</p>
                          </div>
                        </div>
                        <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer" />
                      </div>
                    </div>
                  </div>

                  {/* Outbound Preferred Language */}
                  <div className="border-t border-slate-200 pt-6 text-left">
                    <label htmlFor="default_language" className="block text-sm font-bold leading-6 text-slate-900">
                      {t('settings.preferred_language')}
                    </label>
                    <div className="mt-2 max-w-md">
                      <select
                        id="default_language"
                        name="default_language"
                        defaultValue="French"
                        className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm bg-white p-2"
                      >
                        <option value="French">Français (Bonjour, cabinet dentaire du Dr. Smith...)</option>
                        <option value="Darija">Darija Marocaine (Salam alaykum, bghit nsewwel...)</option>
                        <option value="Arabic">Arabe (مرحباً، عيادة الدكتور Smith لطب الأسنان...)</option>
                        <option value="English">English (Hello, thank you for calling AuraDental...)</option>
                      </select>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">Langue d'accroche par défaut de l'IA lors des appels sortants ou rappels automatiques avant détection de la langue du patient.</p>
                  </div>

                  {/* Dialect Optimization */}
                  <div className="border-t border-slate-200 pt-6 text-left">
                    <label htmlFor="accent_mode" className="block text-sm font-bold leading-6 text-slate-900">
                      {t('settings.sensitivity')}
                    </label>
                    <div className="mt-2 max-w-md">
                      <select
                        id="accent_mode"
                        name="accent_mode"
                        defaultValue="auto"
                        className="block w-full rounded-md border-0 py-1.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 focus:ring-2 focus:ring-blue-600 text-xs sm:text-sm bg-white p-2"
                      >
                        <option value="auto">Détection automatique équilibrée (Toutes régions)</option>
                        <option value="center">Accent régional de l'axe Casablanca / Rabat</option>
                        <option value="north">Dialectes du Nord (Chamali / expressions espagnoles)</option>
                        <option value="south">Dialectes du Sud (Marrakech / Agadir)</option>
                      </select>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{t('settings.sensitivity_desc')}</p>
                  </div>

                  {/* CRM Integration */}
                  <div className="border-t border-slate-200 pt-6 space-y-4 text-left">
                    <h4 className="text-sm font-bold text-slate-900">Synchronisation CRM & Notes cliniques</h4>

                    <div className="flex items-start text-left">
                      <div className="flex h-6 items-center">
                        <input id="translate_crm_notes" name="translate_crm_notes" type="checkbox" defaultChecked className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 cursor-pointer" />
                      </div>
                      <div className="ml-3 text-sm leading-6 text-left">
                        <label htmlFor="translate_crm_notes" className="font-semibold text-slate-900">{t('settings.crm_trans')}</label>
                        <p className="text-slate-500 text-xs">{t('settings.crm_trans_desc')}</p>
                      </div>
                    </div>
                  </div>

                  {/* Visual Insights Section */}
                  <div className="border-t border-slate-200 pt-6 space-y-4 text-left">
                    <h4 className="text-sm font-bold text-slate-900">{t('settings.analytics')}</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                          <span>Darija Marocaine</span>
                          <span>72%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className="bg-blue-600 h-2 rounded-full" style={{ width: '72%' }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                          <span>Français</span>
                          <span>21%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '21%' }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-700 mb-1">
                          <span>Anglais</span>
                          <span>7%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div className="bg-amber-600 h-2 rounded-full" style={{ width: '7%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end border-t border-slate-200 pt-6">
                    <button 
                      type="button" 
                      onClick={() => toast.success(t('global.saved'))}
                      className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 cursor-pointer"
                    >
                      <Save className="h-4 w-4" />
                      {t('settings.save_btn')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'clinic' && (
            <div className="bg-white shadow-sm border border-slate-200 rounded-xl text-left">
              <div className="px-4 py-5 sm:p-6 text-left">
                <div className="border-b border-slate-100 pb-4 mb-6 text-left">
                  <h3 className="text-base font-bold leading-6 text-slate-900 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-blue-600" />
                    Personnalisation du Pitch Commercial (Démo Vente)
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Outil exclusif pour les équipes commerciales. Personnalisez instantanément la démo avec les informations réelles du dentiste à qui vous la présentez pour générer un effet "Wow" immédiat.
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl mb-6 flex gap-3 text-left">
                  <Bot className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div className="text-left">
                    <h4 className="text-sm font-bold">Mode White-Label Instantané</h4>
                    <p className="text-xs text-amber-700 mt-1 leading-relaxed text-left">
                      Toutes les mentions de l'application (nom du Docteur dans le bas de l'écran, nom du cabinet principal, ville et numéro de téléphone d'accueil) se synchronisent en temps réel.
                    </p>
                  </div>
                </div>

                <form className="space-y-6 text-left" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="demo_dentist_name" className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                        Nom du Dentiste (Prospect)
                      </label>
                      <input
                        type="text"
                        id="demo_dentist_name"
                        value={tempDentistName}
                        onChange={(e) => setTempDentistName(e.target.value)}
                        placeholder="Ex: Dr. Benchakroun"
                        className="block w-full rounded-lg border border-slate-300 p-2.5 text-sm bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="demo_clinic_name" className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                        Nom de la Clinique / Cabinet
                      </label>
                      <input
                        type="text"
                        id="demo_clinic_name"
                        value={tempClinicName}
                        onChange={(e) => setTempClinicName(e.target.value)}
                        placeholder="Ex: Cabinet Dentaire Gauthier"
                        className="block w-full rounded-lg border border-slate-300 p-2.5 text-sm bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="demo_phone_number" className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                        Numéro de Téléphone (Local)
                      </label>
                      <input
                        type="text"
                        id="demo_phone_number"
                        value={tempPhoneNumber}
                        onChange={(e) => setTempPhoneNumber(e.target.value)}
                        placeholder="Ex: +212 5 22 12 34 56"
                        className="block w-full rounded-lg border border-slate-300 p-2.5 text-sm bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label htmlFor="demo_city" className="block text-xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">
                        Ville principale
                      </label>
                      <input
                        type="text"
                        id="demo_city"
                        value={tempCity}
                        onChange={(e) => setTempCity(e.target.value)}
                        placeholder="Ex: Casablanca"
                        className="block w-full rounded-lg border border-slate-300 p-2.5 text-sm bg-white font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end border-t border-slate-200 pt-6 gap-3">
                    <button
                      type="button"
                      onClick={handleResetDemoSettings}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      Réinitialiser par défaut
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveDemoSettings}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-500 cursor-pointer transition-colors"
                    >
                      <Save className="h-3.5 w-3.5" />
                      Appliquer les Infos du Prospect
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'demo' && (
            <div className="bg-white shadow-sm border border-slate-200 rounded-xl text-left">
              <div className="px-4 py-5 sm:p-6 text-left">
                <div className="border-b border-slate-100 pb-4 mb-6 text-left">
                  <h3 className="text-base font-bold leading-6 text-slate-900 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-indigo-600 animate-pulse" />
                    Mode Démo Commercial Interactif (Zéro Configuration)
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Activez ce mode pour remplir instantanément toutes les sections de l'application avec des données de cabinet ultra-réalistes. Idéal pour épater les médecins et les acheteurs potentiels immédiatement.
                  </p>
                </div>

                {/* State Banner */}
                <div className={cn(
                  "p-5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 transition-all",
                  isDemoModeActive 
                    ? "bg-indigo-50 border-indigo-200 text-indigo-900" 
                    : "bg-slate-50 border-slate-200 text-slate-700"
                )}>
                  <div className="space-y-1 text-left">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <span className={cn(
                        "h-2.5 w-2.5 rounded-full inline-block",
                        isDemoModeActive ? "bg-indigo-600 animate-ping" : "bg-slate-400"
                      )} />
                      <span>{isDemoModeActive ? "Le Mode Démo est actuellement ACTIF" : "Le Mode Démo est actuellement INACTIF"}</span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">
                      {isDemoModeActive 
                        ? "La base de données Firestore contient 10+ profils patients fictifs marocains, 15+ rendez-vous intelligents, et des historiques d'appels simulés."
                        : "Le système n'affiche que vos données de test réelles."}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleDemoMode(!isDemoModeActive)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-extrabold shadow-sm transition-all cursor-pointer whitespace-nowrap",
                      isDemoModeActive 
                        ? "bg-red-600 text-white hover:bg-red-500" 
                        : "bg-indigo-600 text-white hover:bg-indigo-500"
                    )}
                  >
                    <Sparkles className="h-4 w-4" />
                    {isDemoModeActive ? "Désactiver la Démo" : "Activer la Démo Instantanée"}
                  </button>
                </div>

                {/* What's Injected Section */}
                <div className="space-y-4 text-left">
                  <h4 className="text-sm font-bold text-slate-900">Ce qui est peuplé en direct dans le CRM :</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 flex gap-3 text-left">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <div className="text-left">
                        <h5 className="text-xs font-bold text-slate-900">10+ Profils de Patients Marocains</h5>
                        <p className="text-[11px] text-slate-500 mt-1 font-medium leading-relaxed">
                          Noms réalistes (Mansouri, Benchakroun, Jabri), préférences linguistiques configurées (Darija, Français, Anglais) et dossiers médicaux pertinents pré-remplis (allergies, anxiétés, traitements).
                        </p>
                      </div>
                    </div>

                    <div className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 flex gap-3 text-left">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <div className="text-left">
                        <h5 className="text-xs font-bold text-slate-900">15+ Rendez-vous synchronisés</h5>
                        <p className="text-[11px] text-slate-500 mt-1 font-medium leading-relaxed">
                          Répartis stratégiquement sur les dates dynamiques (aujourd'hui, hier, demain) pour que votre calendrier d'agenda paraisse vivant et actif avec des indicateurs de statut et des affectations multisites.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 flex gap-3 text-left">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <div className="text-left">
                        <h5 className="text-xs font-bold text-slate-900">Journaux d'Appels & Transcriptions IA</h5>
                        <p className="text-[11px] text-slate-500 mt-1 font-medium leading-relaxed">
                          Conversations complètes écrites en Darija orale marocaine translittérée, arabe classique et français entre vos patients et l'assistante virtuelle de la clinique (moteur Gemini).
                        </p>
                      </div>
                    </div>

                    <div className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 flex gap-3 text-left">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <div className="text-left">
                        <h5 className="text-xs font-bold text-slate-900">Discussions WhatsApp Interactives</h5>
                        <p className="text-[11px] text-slate-500 mt-1 font-medium leading-relaxed">
                          Simulations de messagerie instantanée réactives démontrant comment la secrétaire virtuelle prend des rendez-vous d'urgence en direct et résout les plaintes des patients autonomement.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Enterprise Note */}
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mt-6 text-left flex gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <h5 className="text-xs font-bold text-amber-900">Isolation & Sécurité de vos données réelles</h5>
                    <p className="text-[11px] text-amber-700 mt-1 font-medium leading-relaxed">
                      L'activation ou la désactivation de ce mode n'affecte en aucun cas vos vrais dossiers de patients de test. Les données de démo s'auto-identifient par un tag isolé qui permet de les nettoyer proprement à tout moment sans laisser de résidus dans votre base Firestore.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab !== 'ai' && activeTab !== 'hours' && activeTab !== 'languages' && activeTab !== 'clinic' && activeTab !== 'demo' && (
            <div className="bg-white shadow-sm border border-slate-200 rounded-xl flex items-center justify-center p-12 text-center">
              <div className="text-center">
                <Clock className="mx-auto h-12 w-12 text-slate-300 animate-pulse" />
                <h3 className="mt-2 text-sm font-semibold text-slate-900">Bientôt Disponible</h3>
                <p className="mt-1 text-sm text-slate-500">Ce panneau de configuration est en cours de déploiement par l'équipe technique.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
