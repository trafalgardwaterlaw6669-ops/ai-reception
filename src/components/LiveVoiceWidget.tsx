import { useState, useRef, useEffect } from 'react';
import { PhoneCall, PhoneOff, Mic, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function LiveVoiceWidget() {
  const [isCalling, setIsCalling] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [callerId, setCallerId] = useState<string>('new');
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef(0);

  // Helper: Convert Float32Array to 16-bit PCM base64
  const pcmToBase64 = (pcm: Float32Array) => {
    const buffer = new ArrayBuffer(pcm.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < pcm.length; i++) {
      let s = Math.max(-1, Math.min(1, pcm[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const scheduledSourcesRef = useRef<AudioBufferSourceNode[]>([]);

  const playAudioChunk = (audioCtx: AudioContext, base64Audio: string) => {
    try {
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const buffer = bytes.buffer;
      const view = new Int16Array(buffer);
      const floatArray = new Float32Array(view.length);
      for (let i = 0; i < view.length; i++) {
        floatArray[i] = view[i] / 0x8000;
      }
      
      const audioBuffer = audioCtx.createBuffer(1, floatArray.length, 24000);
      audioBuffer.getChannelData(0).set(floatArray);
      
      const source = audioCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioCtx.destination);
      
      if (nextStartTimeRef.current < audioCtx.currentTime) {
        nextStartTimeRef.current = audioCtx.currentTime;
      }
      
      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += audioBuffer.duration;
      
      scheduledSourcesRef.current.push(source);
      source.onended = () => {
        scheduledSourcesRef.current = scheduledSourcesRef.current.filter(s => s !== source);
      };
    } catch (err) {
      console.error("Error playing audio chunk:", err);
    }
  };

  const stopCall = () => {
    setIsCalling(false);
    setIsConnecting(false);
    scheduledSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    scheduledSourcesRef.current = [];
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    nextStartTimeRef.current = 0;
  };

  const startCall = async () => {
    try {
      setIsConnecting(true);
      
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.host}/live?callerId=${callerId}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      const outputAudioCtx = new window.AudioContext({ sampleRate: 24000 });
      audioContextRef.current = outputAudioCtx;

      ws.onopen = async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaStreamRef.current = stream;
          
          const inputAudioCtx = new window.AudioContext({ sampleRate: 16000 });
          const source = inputAudioCtx.createMediaStreamSource(stream);
          const processor = inputAudioCtx.createScriptProcessor(4096, 1, 1);
          processorRef.current = processor;
          
          source.connect(processor);
          processor.connect(inputAudioCtx.destination);

          processor.onaudioprocess = (e) => {
            if (ws.readyState === WebSocket.OPEN) {
              const base64 = pcmToBase64(e.inputBuffer.getChannelData(0));
              ws.send(JSON.stringify({ audio: base64 }));
            }
          };

          setIsConnecting(false);
          setIsCalling(true);
          toast.success("Appel connecté ! Essayez de parler à l'IA.");
        } catch (err) {
          console.error("Mic access error:", err);
          toast.error("Impossible d'accéder au microphone.");
          stopCall();
        }
      };

      ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.audio) {
          playAudioChunk(outputAudioCtx, msg.audio);
        }
        if (msg.interrupted) {
          scheduledSourcesRef.current.forEach(source => {
            try { source.stop(); } catch (e) {}
          });
          scheduledSourcesRef.current = [];
          nextStartTimeRef.current = outputAudioCtx.currentTime;
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        toast.error("Erreur de connexion. Le serveur est-il actif ?");
        stopCall();
      };

      ws.onclose = () => {
        stopCall();
      };

    } catch (error) {
      console.error("Error starting call:", error);
      toast.error("Impossible de démarrer l'appel.");
      stopCall();
    }
  };

  useEffect(() => {
    return () => stopCall();
  }, []);

  return (
    <div className={cn(
      "fixed bottom-24 right-6 flex flex-col items-end gap-4 z-50 transition-all duration-300",
      isCalling ? "scale-100 opacity-100" : "scale-100"
    )}>
      {isCalling && (
        <div className="bg-slate-900/90 text-white p-4 rounded-2xl shadow-2xl backdrop-blur-md border border-slate-700 w-64 animate-in slide-in-from-bottom-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center relative">
              <Mic className="w-5 h-5 text-blue-400" />
              <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-20" />
            </div>
            <div>
              <p className="font-medium text-sm">Réceptionniste IA</p>
              <p className="text-xs text-blue-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                Appel en cours
              </p>
            </div>
          </div>
          <button 
            onClick={stopCall}
            className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl text-sm font-medium transition-colors border border-red-500/20 flex justify-center items-center gap-2"
          >
            <PhoneOff className="w-4 h-4" /> Raccrocher
          </button>
        </div>
      )}

      {!isCalling && (
        <div className="flex flex-col items-end gap-2 bg-white p-3 rounded-2xl shadow-xl border border-slate-100">
          <div className="text-xs font-medium text-slate-500 mb-1 px-1">Simuler l'appel en tant que :</div>
          <select 
            value={callerId}
            onChange={(e) => setCallerId(e.target.value)}
            className="text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2 w-48"
          >
            <option value="new">Appelant inconnu (Nouveau)</option>
            <option value="pat_mother">👩‍👧‍👦 Amina Alami (Mère de famille)</option>
            <option value="pat_1">Youssef Benali (Déjà patient)</option>
            <option value="pat_2">Sara Ahmed (Contrôle nécessaire)</option>
            <option value="pat_3">Karim Tazi (Rendez-vous manqué)</option>
          </select>
          <button
            onClick={startCall}
            disabled={isConnecting}
            className={cn(
              "h-12 w-full rounded-xl shadow-sm flex items-center justify-center transition-all z-50 gap-2 font-medium",
              isConnecting ? "bg-slate-300 cursor-not-allowed text-white" : "bg-emerald-500 hover:bg-emerald-600 text-white active:scale-95"
            )}
          >
            {isConnecting ? (
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            ) : (
              <><PhoneCall className="w-4 h-4" /> Démarrer l'appel IA</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
