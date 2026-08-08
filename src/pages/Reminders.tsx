import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { Bell, Clock, Search, Smartphone, Mail, AlertCircle, Loader2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function Reminders() {
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'reminders'), orderBy('sentAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReminders(fetched);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching reminders:", error);
      toast.error("Échec du chargement des rappels.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const triggerBackgroundSMS = async () => {
    setTriggering(true);
    try {
      const res = await fetch('/api/reminders/trigger', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        if (data.processedCount > 0) {
          toast.success(`${data.processedCount} rappel(s) SMS 24h envoyé(s) avec succès !`);
        } else {
          toast.info("Service de rappel 24h exécuté : aucun nouveau rendez-vous à rappeler.");
        }
      } else {
        toast.error(data.error || "Erreur lors du déclenchement du service SMS.");
      }
    } catch (err) {
      console.error("Failed to trigger SMS service:", err);
      toast.error("Impossible de contacter le service d'arrière-plan.");
    } finally {
      setTriggering(false);
    }
  };

  const filteredReminders = reminders.filter(r => 
    r.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 text-slate-800 text-left">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Rappels Automatisés</h1>
          <p className="mt-2 text-sm text-slate-600">
            Journal de tous les rappels SMS et e-mails envoyés automatiquement aux patients 24 heures avant leur rendez-vous.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex items-center gap-3">
          <button
            onClick={triggerBackgroundSMS}
            disabled={triggering}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
          >
            {triggering ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Exécuter les rappels 24h
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="bg-white px-6 py-5 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
            <Bell className="h-5 w-5 text-blue-500" />
            Total Envoyés (30j)
          </div>
          <div className="mt-2 text-3xl font-bold text-slate-900">{reminders.length || 0}</div>
        </div>
        <div className="bg-white px-6 py-5 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
            <Smartphone className="h-5 w-5 text-green-500" />
            Rappels par SMS
          </div>
          <div className="mt-2 text-3xl font-bold text-slate-900">
            {reminders.filter(r => r.type === 'SMS').length || 0}
          </div>
        </div>
        <div className="bg-white px-6 py-5 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
            <Mail className="h-5 w-5 text-purple-500" />
            Rappels par E-mail
          </div>
          <div className="mt-2 text-3xl font-bold text-slate-900">
            {reminders.filter(r => r.type === 'Email').length || 0}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50">
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher par nom de patient ou téléphone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border-slate-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
          </div>
        ) : filteredReminders.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {filteredReminders.map((reminder) => (
              <li key={reminder.id} className="p-4 sm:px-6 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-2 rounded-lg",
                      reminder.type === 'SMS' ? "bg-green-50 text-green-600" : "bg-purple-50 text-purple-600"
                    )}>
                      {reminder.type === 'SMS' ? <Smartphone className="h-5 w-5" /> : <Mail className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{reminder.patientName}</p>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(reminder.sentAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                        <span className="mx-1">&bull;</span>
                        {reminder.phone}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-bold text-green-700 ring-1 ring-inset ring-green-600/20 uppercase tracking-wide">
                    {reminder.status === 'Priority Sent' ? 'Prioritaire' : 'Envoyé'}
                  </span>
                </div>
                <div className="mt-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 font-mono text-xs whitespace-pre-wrap">
                  {reminder.message}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <AlertCircle className="mx-auto h-12 w-12 text-slate-300 animate-pulse" />
            <h3 className="mt-2 text-sm font-semibold text-slate-900">Aucun rappel trouvé</h3>
            <p className="mt-1 text-sm text-slate-500">
              Il n'y a aucun rappel automatique envoyé pour le moment. Ils sont expédiés 24h avant l'heure du rendez-vous.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
