import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MessageSquare, 
  Phone, 
  Check, 
  CheckCheck,
  Send,
  User,
  Bot
} from 'lucide-react';
import { mockPatients, mockMessages } from '@/data/mockDb';
import { cn } from '@/lib/utils';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, addDoc, doc, writeBatch } from 'firebase/firestore';
import { Patient } from '@/types';
import { toast } from 'sonner';

export function Messages() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Load patients from Firestore
  useEffect(() => {
    const q = query(collection(db, 'patients'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Patient[];
      setPatients(fetched);
      if (fetched.length > 0 && !selectedPatientId) {
        // Look for a patient with messages or default to the second one
        const target = fetched.find(p => p.id === 'pat_2') || fetched[0];
        setSelectedPatientId(target.id);
      }
    });
    return () => unsubscribe();
  }, []);

  // Auto-seed default messages if empty
  const handleSeedMessages = async () => {
    try {
      const batch = writeBatch(db);
      const colRef = collection(db, 'messages');
      mockMessages.forEach((m) => {
        const docRef = doc(colRef);
        batch.set(docRef, m);
      });
      await batch.commit();
      console.log("Messages collection auto-seeded!");
    } catch (err) {
      console.error("Error seeding messages: ", err);
    }
  };

  // Load messages from Firestore
  useEffect(() => {
    const q = query(collection(db, 'messages'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setMessages([]);
        return;
      }
      const fetched = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(fetched);
    });
    return () => unsubscribe();
  }, []);

  const selectedPatient = patients.find(p => p.id === selectedPatientId);
  const conversation = messages
    .filter(m => m.patientId === selectedPatientId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const handleSendMessage = async () => {
    if (!inputText.trim() || !selectedPatientId) return;
    try {
      await addDoc(collection(db, 'messages'), {
        patientId: selectedPatientId,
        content: inputText,
        direction: 'outbound',
        status: 'delivered',
        timestamp: new Date().toISOString()
      });
      setInputText('');
    } catch (err) {
      console.error("Error sending message: ", err);
      toast.error("Échec de l'envoi.");
    }
  };

  const filteredPatients = patients.filter(patient => {
    const name = `${patient.firstName} ${patient.lastName}`.toLowerCase();
    return name.includes(searchTerm.toLowerCase()) || patient.phone.includes(searchTerm);
  });

  return (
    <div className="flex h-full flex-col -m-4 sm:-m-6 lg:-m-8">
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r border-slate-200 bg-white flex flex-col text-left">
          <div className="p-4 border-b border-slate-200">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">WhatsApp</h1>
            <div className="mt-4 relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
              </div>
              <input
                type="text"
                className="block w-full rounded-md border-0 py-1.5 pl-9 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-green-600 sm:text-sm sm:leading-6"
                placeholder="Rechercher des conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredPatients.map((patient) => {
              const patientMessages = messages.filter(m => m.patientId === patient.id);
              const lastMessage = patientMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
              
              if (!lastMessage) return null;

              return (
                <button
                  key={patient.id}
                  onClick={() => setSelectedPatientId(patient.id)}
                  className={cn(
                    "w-full text-left p-4 border-b border-slate-100 hover:bg-slate-50 transition-colors focus:outline-none cursor-pointer",
                    selectedPatientId === patient.id ? "bg-green-50/50" : ""
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{patient.firstName} {patient.lastName}</span>
                    <span className="text-xs text-slate-500">
                      {new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-slate-500 truncate max-w-[200px]">
                      {lastMessage.direction === 'outbound' && <span className="inline-flex mr-1"><CheckCheck className="h-4 w-4 text-slate-400" /></span>}
                      {lastMessage.content}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Chat Area */}
        {selectedPatient ? (
          <div className="flex-1 flex flex-col bg-slate-50 relative text-left">
            {/* WhatsApp pattern background overlay - subtle */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}></div>
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white relative z-10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold">
                  {selectedPatient.firstName[0]}{selectedPatient.lastName[0]}
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">{selectedPatient.firstName} {selectedPatient.lastName}</h2>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {selectedPatient.phone}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  <Bot className="mr-1 h-3 w-3" /> Géré par l'IA
                </span>
                <button className="text-sm text-slate-500 hover:text-slate-700 px-3 py-1.5 rounded-md border border-slate-300 cursor-pointer bg-white">
                  Prendre la main
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 relative z-10">
              {conversation.map((msg) => {
                const isOutbound = msg.direction === 'outbound';
                return (
                  <div key={msg.id} className={cn("flex", isOutbound ? "justify-end" : "justify-start")}>
                    <div className={cn(
                       "max-w-md rounded-lg px-4 py-2 shadow-sm relative",
                       isOutbound ? "bg-green-100 text-slate-900" : "bg-white text-slate-900"
                    )}>
                      <p className="text-sm">{msg.content}</p>
                      <div className="flex items-center justify-end gap-1 mt-1">
                        <span className="text-[10px] text-slate-500">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isOutbound && (
                          <CheckCheck className={cn("h-3 w-3", msg.status === 'read' ? "text-blue-500" : "text-slate-400")} />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-white border-t border-slate-200 relative z-10">
              <div className="flex items-end gap-2">
                <textarea
                  rows={1}
                  className="block w-full resize-none rounded-lg border-0 py-2.5 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-green-600 sm:text-sm sm:leading-6"
                  placeholder="Saisissez un message pour répondre manuellement..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <button 
                  onClick={handleSendMessage}
                  className="rounded-full bg-green-600 p-2.5 text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 cursor-pointer"
                >
                  <Send className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-400 text-center">
                L'envoi d'un message mettra en pause les réponses automatiques de l'IA pour ce patient.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-500 text-center">
            <MessageSquare className="h-12 w-12 text-slate-300 mb-4 animate-pulse" />
            <p>Sélectionnez une conversation pour l'afficher</p>
          </div>
        )}
      </div>
    </div>
  );
}
