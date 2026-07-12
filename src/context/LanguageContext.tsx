import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

export type Language = 'French' | 'English' | 'Arabic' | 'Darija';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

// Simple and clean local translation library
const translations: Record<Language, Record<string, string>> = {
  French: {
    // Sidebar
    'nav.dashboard': 'Tableau de bord',
    'nav.appointments': 'Rendez-vous',
    'nav.patients': 'Patients',
    'nav.forms': 'Formulaires digitaux',
    'nav.voicenotes': 'Notes vocales dentiste',
    'nav.waitlist': "Liste d'attente IA",
    'nav.memory': 'Mémoire patient IA',
    'nav.selfimproving': 'IA auto-améliorante',
    'nav.screener': 'Dépistage visuel IA',
    'nav.messages': 'Messages',
    'nav.calls': 'Appels',
    'nav.reminders': 'Rappels',
    'nav.prediction': "Prédiction d'absences",
    'nav.analytics': 'Analyses cliniques',
    'nav.settings': 'Paramètres',
    'nav.workspace': 'Workspace & Firebase',
    'nav.onboarding': 'Onboarding Express',
    
    // Header & Global
    'global.synced': 'Synchro',
    'global.sync_title': 'Forcer la synchronisation',
    'global.clinic_switcher': 'Sélecteur de Clinique',
    'global.all_clinics': 'Toutes les cliniques (Unifié)',
    'global.demo_account': 'Compte Démo',
    'global.role': 'Dentiste du Groupe / Propriétaire',
    'global.language': 'Langue',
    'global.saved': 'Paramètres de langue enregistrés !',
    
    // Settings Page
    'settings.title': 'Paramètres de la clinique',
    'settings.subtitle': 'Gérer les préférences de votre cabinet et configurer le moteur linguistique.',
    'settings.active_languages': 'Langues actives de la clinique',
    'settings.preferred_language': 'Langue de salutation principale & appels sortants',
    'settings.sensitivity': 'Sensibilité de reconnaissance du dialecte marocain',
    'settings.sensitivity_desc': 'Ajustez les modèles vocaux pour optimiser la précision phonétique selon votre démographie.',
    'settings.crm_trans': 'Traduction des notes du patient vers le français',
    'settings.crm_trans_desc': 'Si un patient parle en darija, l’IA traduit automatiquement les symptômes en français dans le dossier médical.',
    'settings.analytics': 'Distribution des langues (Derniers 30 jours)',
    'settings.save_btn': 'Enregistrer les paramètres de langue',
  },
  English: {
    // Sidebar
    'nav.dashboard': 'Dashboard',
    'nav.appointments': 'Appointments',
    'nav.patients': 'Patients',
    'nav.forms': 'Digital Forms',
    'nav.voicenotes': 'Dentist Voice Notes',
    'nav.waitlist': 'AI Waitlist',
    'nav.memory': 'AI Patient Memory',
    'nav.selfimproving': 'Self-Improving AI',
    'nav.screener': 'AI Visual Screener',
    'nav.messages': 'Messages',
    'nav.calls': 'Calls',
    'nav.reminders': 'Reminders',
    'nav.prediction': 'No-Show Prediction',
    'nav.analytics': 'Clinic Analytics',
    'nav.settings': 'Settings',
    'nav.workspace': 'Workspace & Firebase',
    'nav.onboarding': 'Express Onboarding',
    
    // Header & Global
    'global.synced': 'Synced',
    'global.sync_title': 'Force real-time synchronization',
    'global.clinic_switcher': 'Clinical Node Switcher',
    'global.all_clinics': 'All Clinics (Unified)',
    'global.demo_account': 'Demo Account',
    'global.role': 'Group Dentist / Owner',
    'global.language': 'Language',
    'global.saved': 'Language settings saved successfully!',
    
    // Settings Page
    'settings.title': 'Clinic Settings',
    'settings.subtitle': 'Manage your clinic preferences and configure the multilingual voice engine.',
    'settings.active_languages': 'Active Clinic Languages',
    'settings.preferred_language': 'Primary Greeting & Outbound Call Language',
    'settings.sensitivity': 'Moroccan Dialect Recognition Sensitivity',
    'settings.sensitivity_desc': 'Adjust speech models to optimize phonetic accuracy according to your main patient demographics.',
    'settings.crm_trans': 'Auto-translate Patient Notes to French',
    'settings.crm_trans_desc': 'If a patient speaks in Darija, the AI automatically logs their symptoms in French inside medical files.',
    'settings.analytics': 'Language Distribution Analytics (Last 30 Days)',
    'settings.save_btn': 'Save Language Settings',
  },
  Arabic: {
    // Sidebar
    'nav.dashboard': 'لوحة التحكم',
    'nav.appointments': 'المواعيد',
    'nav.patients': 'المرضى',
    'nav.forms': 'الاستمارات الرقمية',
    'nav.voicenotes': 'ملاحظات طبيب الأسنان الصوتية',
    'nav.waitlist': 'قائمة الانتظار بالذكاء الاصطناعي',
    'nav.memory': 'ذاكرة المريض بالذكاء الاصطناعي',
    'nav.selfimproving': 'الذكاء الاصطناعي ذاتي التحسين',
    'nav.screener': 'الفحص البصري بالذكاء الاصطناعي',
    'nav.messages': 'الرسائل',
    'nav.calls': 'المكالمات',
    'nav.reminders': 'التنبيهات',
    'nav.prediction': 'التنبؤ بالغياب',
    'nav.analytics': 'تحليلات العيادة',
    'nav.settings': 'الإعدادات',
    'nav.workspace': 'جوجل و فايربيس',
    'nav.onboarding': 'الإعداد السريع',
    
    // Header & Global
    'global.synced': 'مزامنة',
    'global.sync_title': 'فرض المزامنة الفورية',
    'global.clinic_switcher': 'مبدل العيادات',
    'global.all_clinics': 'جميع العيادات (موحد)',
    'global.demo_account': 'الحساب التجريبي',
    'global.role': 'طبيب أسنان المجموعة / المالك',
    'global.language': 'اللغة',
    'global.saved': 'تم حفظ إعدادات اللغة بنجاح!',
    
    // Settings Page
    'settings.title': 'إعدادات العيادة',
    'settings.subtitle': 'إدارة تفضيلات العيادة وتكوين المحرك اللغوي متعدد اللغات.',
    'settings.active_languages': 'اللغات النشطة في العيادة',
    'settings.preferred_language': 'لغة الترحيب الرئيسية والمكالمات الصادرة',
    'settings.sensitivity': 'حساسية التعرف على الدارجة المغربية',
    'settings.sensitivity_desc': 'ضبط نماذج الكلام لتحسين الدقة الصوتية وفقاً للخصائص الديموغرافية لمرضاك.',
    'settings.crm_trans': 'ترجمة ملاحظات المريض تلقائياً إلى الفرنسية',
    'settings.crm_trans_desc': 'إذا تحدث المريض بالدارجة، يقوم الذكاء الاصطناعي تلقائياً بتسجيل أعراضه بالفرنسية في الملف الطبي.',
    'settings.analytics': 'تحليل توزيع اللغات (آخر 30 يوماً)',
    'settings.save_btn': 'حفظ إعدادات اللغة',
  },
  Darija: {
    // Sidebar
    'nav.dashboard': 'لوحة التحكم (الدارجة)',
    'nav.appointments': 'المواعيد (الرونديفويات)',
    'nav.patients': 'المرضى',
    'nav.forms': 'الفورموليرات الرقمية',
    'nav.voicenotes': 'ملاحظات الطبيب بالصوت',
    'nav.waitlist': 'ليستة د الانتظار ب لانديكاتور',
    'nav.memory': 'ميكانيزم د الذاكرة د المريض',
    'nav.selfimproving': 'الذكاء الاصطناعي اللي كيطوّر راسو',
    'nav.screener': 'الفحص البصري د السنان',
    'nav.messages': 'الرسائل',
    'nav.calls': 'المكالمات',
    'nav.reminders': 'التذكيرات',
    'nav.prediction': 'توقع الغياب د المرضى',
    'nav.analytics': 'الاحصائيات د العيادة',
    'nav.settings': 'الكونفيغوراسيون',
    'nav.workspace': 'جوجل و فايربيس',
    'nav.onboarding': 'الإعداد السريع',
    
    // Header & Global
    'global.synced': 'مزامنة دابا',
    'global.sync_title': 'فورصي المزامنة دابا',
    'global.clinic_switcher': 'بدّل العيادة',
    'global.all_clinics': 'كاع العيادات (مجموعين)',
    'global.demo_account': 'الكونت ديمو',
    'global.role': 'طبيب العيادة / مول الشي',
    'global.language': 'اللغة',
    'global.saved': 'تم حفظ الإعدادات ديال اللغة بنجاح !',
    
    // Settings Page
    'settings.title': 'إعدادات العيادة',
    'settings.subtitle': 'تحكم ف الإعدادات ديال العيادة ديالك و ريكل لغات د التواصل مع المرضى.',
    'settings.active_languages': 'اللغات اللي خدامين ف العيادة',
    'settings.preferred_language': 'لغة الترحيب ف التيليفون والرسائل',
    'settings.sensitivity': 'ريكلاج الفهم ديال الدارجة المغربية',
    'settings.sensitivity_desc': 'تحسين قدرة الذكاء الاصطناعي على فهم النطق واللكنات المغربية المختلفة.',
    'settings.crm_trans': 'ترجمة الهضرة د المريض للفرنسية',
    'settings.crm_trans_desc': 'يلا هضر المريض بالدارجة، السيستيم كيترجم الأعراض ويسجلهوم بالفرنسية ف الدوسي ديالو.',
    'settings.analytics': 'إحصائيات اللغات اللي كيستعملو المرضى (30 يوم الأخيرة)',
    'settings.save_btn': 'حفظ إعدادات اللغة',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Try to read preferred language, default to French
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('clinic_ui_language');
    return (saved as Language) || 'French';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('clinic_ui_language', lang);
    const msgs: Record<Language, string> = {
      French: 'Langue de l’interface changée en Français !',
      English: 'Interface language updated to English!',
      Arabic: 'تم تغيير لغة الواجهة إلى العربية!',
      Darija: 'اللغة ديال السيستيم تبدلات للدارجة المغربية !'
    };
    toast.success(msgs[lang]);
  };

  const t = (key: string): string => {
    return translations[language][key] || translations['French'][key] || key;
  };

  // Adjust document direction for RTL support if Arabic/Darija is selected
  useEffect(() => {
    if (language === 'Arabic' || language === 'Darija') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
