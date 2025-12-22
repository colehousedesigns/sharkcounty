
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { PlayerProfile } from '../types';

interface LiveSessionProps {
  profile: PlayerProfile;
}

interface ReviewMessage {
  role: 'user' | 'assistant';
  text: string;
}

const LiveSession: React.FC<LiveSessionProps> = ({ profile }) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAiCoachActive, setIsAiCoachActive] = useState(false);
  const [transcription, setTranscription] = useState<string[]>([]);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [reviewChat, setReviewChat] = useState<ReviewMessage[]>([]);
  const [reviewInput, setReviewInput] = useState('');
  const [isReviewing, setIsReviewing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const reviewVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<any>(null);
  const frameIntervalRef = useRef<number | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }, 
        audio: true 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      setIsStreaming(false);
      setIsAiCoachActive(false);
      stopAiCoach();
    }
  };

  const startRecording = () => {
    if (!streamRef.current) return;
    recordedChunksRef.current = [];
    const mediaRecorder = new MediaRecorder(streamRef.current);
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) recordedChunksRef.current.push(event.data);
    };
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setRecordedUrl(url);
    };
    mediaRecorder.start();
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const stopAiCoach = useCallback(() => {
    if (frameIntervalRef.current) clearInterval(frameIntervalRef.current);
    if (sessionRef.current) sessionRef.current.close?.();
    sourcesRef.current.forEach(source => source.stop());
    sourcesRef.current.clear();
    setIsAiCoachActive(false);
  }, []);

  const startAiCoach = async () => {
    if (!streamRef.current || !videoRef.current) return;
    setIsAiCoachActive(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const outputNode = outputAudioContext.createGain();
    outputNode.connect(outputAudioContext.destination);
    let nextStartTime = 0;

    const sessionPromise = ai.live.connect({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction: `Technical Billiards Coach for player level ${profile.skillLevel}. Tone: Direct, tactical, professional. Analyze the video feed for table layout and form.`,
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Charon' } } },
        outputAudioTranscription: {}
      },
      callbacks: {
        onopen: () => {
          const canvas = canvasRef.current;
          const video = videoRef.current;
          if (canvas && video) {
            const ctx = canvas.getContext('2d');
            frameIntervalRef.current = window.setInterval(() => {
              canvas.width = 320; canvas.height = 180;
              ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
              const base64Data = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
              sessionPromise.then(session => session.sendRealtimeInput({ media: { data: base64Data, mimeType: 'image/jpeg' } }));
            }, 2000);
          }
        },
        onmessage: async (message: LiveServerMessage) => {
          if (message.serverContent?.outputTranscription) setTranscription(prev => [...prev.slice(-4), message.serverContent.outputTranscription!.text]);
          if (message.serverContent?.interrupted) { sourcesRef.current.forEach(s => s.stop()); sourcesRef.current.clear(); nextStartTime = 0; }
          const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (base64Audio) {
            const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioContext, 24000, 1);
            const source = outputAudioContext.createBufferSource();
            source.buffer = audioBuffer; source.connect(outputNode);
            source.addEventListener('ended', () => sourcesRef.current.delete(source));
            sourcesRef.current.add(source);
            nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
            source.start(nextStartTime); nextStartTime += audioBuffer.duration;
          }
        },
        onclose: () => setIsAiCoachActive(false)
      }
    });
    sessionRef.current = await sessionPromise;
  };

  const handleReviewQuery = async () => {
    if (!reviewInput.trim() || !reviewVideoRef.current || isReviewing) return;

    const query = reviewInput.trim();
    setReviewInput('');
    setReviewChat(prev => [...prev, { role: 'user', text: query }]);
    setIsReviewing(true);

    try {
      const canvas = canvasRef.current;
      const video = reviewVideoRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      canvas.width = 1280;
      canvas.height = 720;
      ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Image = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            parts: [
              { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
              { text: `The user is reviewing a past session and asking about this specific moment. 
              Question: ${query}. 
              Player Skill: ${profile.skillLevel}/10. 
              Analyze the balls on the table and provide technical advice on how they should have played the shot or the rest of the game.` }
            ]
          }
        ]
      });

      setReviewChat(prev => [...prev, { role: 'assistant', text: response.text || "Analysis failed." }]);
    } catch (err) {
      console.error(err);
      setReviewChat(prev => [...prev, { role: 'assistant', text: "Shark AI unavailable for review." }]);
    } finally {
      setIsReviewing(false);
    }
  };

  function decode(base64: string) {
    const b = atob(base64); const res = new Uint8Array(b.length);
    for (let i = 0; i < b.length; i++) res[i] = b.charCodeAt(i);
    return res;
  }

  async function decodeAudioData(data: Uint8Array, ctx: AudioContext, rate: number, channels: number) {
    const dataInt16 = new Int16Array(data.buffer); const frameCount = dataInt16.length / channels;
    const buffer = ctx.createBuffer(channels, frameCount, rate);
    for (let c = 0; c < channels; c++) {
      const chData = buffer.getChannelData(c);
      for (let i = 0; i < frameCount; i++) chData[i] = dataInt16[i * channels + c] / 32768.0;
    }
    return buffer;
  }

  if (isReviewMode && recordedUrl) {
    return (
      <div className="flex flex-col lg:flex-row gap-6 animate-in slide-in-from-right duration-500">
        <div className="flex-1 space-y-4">
          <div className="relative aspect-video glass rounded-3xl overflow-hidden bg-black border-2 border-zinc-900 shadow-2xl">
            <video ref={reviewVideoRef} src={recordedUrl} controls className="w-full h-full object-cover" />
            <div className="absolute top-4 left-4 px-3 py-1 bg-cyan-500 text-black text-[9px] font-black tracking-widest uppercase rounded-full">Analysis Mode</div>
          </div>
          <div className="flex justify-between items-center bg-zinc-950/50 p-6 rounded-3xl border border-zinc-900">
            <button onClick={() => setIsReviewMode(false)} className="bg-zinc-800 text-zinc-400 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest hover:text-white transition-colors">Abort Review</button>
            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Scrub to a shot and ask the AI below</p>
          </div>
        </div>

        <div className="lg:w-96 flex flex-col glass rounded-3xl border border-zinc-900 bg-zinc-950/20 overflow-hidden h-[600px]">
          <div className="p-4 border-b border-zinc-900 bg-zinc-950 flex justify-between items-center">
             <h3 className="text-xs font-black text-cyan-400 uppercase tracking-widest">Tactical Briefing</h3>
             <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_#22d3ee]"></div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
            {reviewChat.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-[11px] font-medium leading-relaxed ${
                  msg.role === 'user' ? 'bg-cyan-600 text-white rounded-tr-none' : 'bg-zinc-900 text-zinc-300 rounded-tl-none border border-zinc-800'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isReviewing && <div className="text-[10px] text-cyan-400 animate-pulse font-black uppercase tracking-widest">Shark AI analyzing layout...</div>}
          </div>
          <div className="p-4 bg-zinc-950 border-t border-zinc-900 flex gap-2">
            <input 
              type="text" 
              value={reviewInput}
              onChange={(e) => setReviewInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleReviewQuery()}
              placeholder="How should I play this?"
              className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-2 text-xs font-bold focus:border-cyan-500 outline-none transition-colors"
            />
            <button onClick={handleReviewQuery} disabled={isReviewing || !reviewInput.trim()} className="bg-cyan-500 text-black w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-30">🚀</button>
          </div>
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-in fade-in duration-500">
      <div className="flex-1 space-y-4">
        <div className="relative aspect-video glass rounded-3xl overflow-hidden bg-black border-2 border-zinc-900 shadow-[0_20px_50px_rgba(0,0,0,1)]">
          {!isStreaming && (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4 text-center p-6 bg-zinc-950/80">
              <div className="w-20 h-20 bg-zinc-900 rounded-2xl flex items-center justify-center text-4xl mb-2 border border-zinc-800 shadow-inner">🎥</div>
              <h3 className="text-2xl font-oswald font-bold uppercase tracking-widest text-white italic">Live Tactical Feed</h3>
              <p className="text-zinc-600 max-w-sm text-[10px] font-black uppercase tracking-[0.2em]">Deployment ready. Enable camera for mission start.</p>
              <button onClick={startCamera} className="bg-zinc-100 hover:bg-white text-black px-10 py-3 rounded-full font-black uppercase tracking-[0.2em] transition-all text-xs">Authorize</button>
            </div>
          )}
          <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transition-opacity duration-700 grayscale ${isStreaming ? 'opacity-100' : 'opacity-0'}`} />
          {isStreaming && (
            <>
              <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 bg-black/70 backdrop-blur rounded-full border border-zinc-800">
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_#22d3ee]"></div>
                <span className="text-[9px] font-black tracking-widest uppercase text-white">Feed Active</span>
              </div>
              {isRecording && (
                <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1 bg-white rounded-full animate-pulse">
                  <span className="text-[9px] font-black tracking-widest uppercase text-black">Data Logging</span>
                </div>
              )}
              {isAiCoachActive && transcription.length > 0 && (
                <div className="absolute bottom-20 left-4 right-4">
                  <div className="bg-zinc-950/90 backdrop-blur border border-cyan-500/30 p-4 rounded-2xl max-w-xl">
                    <p className="text-xs text-cyan-400 font-bold italic tracking-tight leading-relaxed">
                      "{transcription[transcription.length - 1]}"
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 bg-zinc-950/50 p-6 rounded-3xl border border-zinc-900">
          <ControlButton onClick={isStreaming ? stopCamera : startCamera} active={isStreaming} icon={isStreaming ? "✕" : "🎥"} label={isStreaming ? "Abort" : "Engage"} color="bg-zinc-900" />
          <ControlButton onClick={isRecording ? stopRecording : startRecording} active={isRecording} disabled={!isStreaming} icon="⏺" label={isRecording ? "Stop Log" : "Log Session"} color={isRecording ? "bg-white !text-black" : "bg-zinc-900"} />
          <ControlButton onClick={isAiCoachActive ? stopAiCoach : startAiCoach} active={isAiCoachActive} disabled={!isStreaming} icon="🦈" label={isAiCoachActive ? "Deactivate" : "Activate AI"} color={isAiCoachActive ? "bg-cyan-500 !text-black" : "bg-zinc-900"} />
          {recordedUrl && (
            <button 
              onClick={() => setIsReviewMode(true)}
              className="flex flex-col items-center gap-1 p-4 rounded-2xl transition-all min-w-[100px] border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:scale-105"
            >
              <span className="text-xl">🔍</span>
              <span className="text-[9px] font-black uppercase tracking-widest">Review Log</span>
            </button>
          )}
        </div>
      </div>

      <div className="lg:w-80 space-y-6">
        <div className="glass p-6 rounded-3xl border border-zinc-900 bg-zinc-950/20">
          <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
            Telemetry
          </h3>
          <div className="space-y-4">
            <SessionStat label="Mission Time" value="00:12:45" />
            <SessionStat label="AI Nodes" value={transcription.length.toString()} />
            <SessionStat label="Sync Rate" value="24.5 FPS" />
            <SessionStat label="Buffer" value="Optimized" />
          </div>
        </div>
        <div className="glass p-6 rounded-3xl h-[400px] flex flex-col border border-zinc-900">
          <h3 className="text-xs font-black text-zinc-500 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
            Coach Comms
          </h3>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 font-mono scrollbar-hide">
            {transcription.length === 0 ? (
              <p className="text-zinc-800 text-[10px] font-black uppercase tracking-widest mt-20 text-center">Awaiting data stream...</p>
            ) : (
              transcription.map((t, i) => (
                <div key={i} className="text-[10px] p-3 bg-zinc-900/50 rounded-xl border border-zinc-800 text-zinc-400 font-bold uppercase tracking-tight">
                  <span className="text-cyan-500 mr-2">>></span>{t}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ControlButton: React.FC<{ onClick: () => void; active: boolean; disabled?: boolean; icon: string; label: string; color: string }> = ({ onClick, active, disabled, icon, label, color }) => (
  <button onClick={onClick} disabled={disabled} className={`flex flex-col items-center gap-1 p-4 rounded-2xl transition-all min-w-[100px] border border-zinc-800 ${disabled ? 'opacity-10 cursor-not-allowed' : 'hover:scale-105'} ${active ? color : 'bg-black text-zinc-500'}`}>
    <span className="text-xl">{icon}</span>
    <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
  </button>
);

const SessionStat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between items-center py-2 border-b border-zinc-900/50">
    <span className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.3em]">{label}</span>
    <span className="text-[10px] font-bold text-zinc-300 uppercase">{value}</span>
  </div>
);

export default LiveSession;
