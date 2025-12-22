
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { PlayerProfile } from '../types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  links?: { uri: string; title: string }[];
}

interface SharkAIProps {
  profile: PlayerProfile;
  location: { lat: number; lng: number } | null;
}

const SharkAI: React.FC<SharkAIProps> = ({ profile, location }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "I'm your tactical AI. State your query: Strategy, local intel, or technical rules." }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: {
          systemInstruction: `You are 'Shark Bot', a high-level technical assistant.
          Player Skill: ${profile.skillLevel}/10. 
          Current Coordinates: ${location ? `${location.lat}, ${location.lng}` : 'Stealth Mode'}. 
          Tone: Direct, analytical, professional, and technical. Use billiards terminology accurately.`,
          tools: [{ googleSearch: {} }]
        }
      });

      const text = response.text || "Connection dropout. Retrying handshake...";
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      const links = chunks 
        ? chunks
            .filter((c: any) => c.web)
            .map((c: any) => ({ uri: c.web.uri, title: c.web.title }))
        : [];

      setMessages(prev => [...prev, { role: 'assistant', content: text, links }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Encryption error. Protocol failed." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-4xl mx-auto glass rounded-3xl overflow-hidden border border-zinc-800">
      <div className="bg-zinc-950 p-4 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-center text-lg shadow-[0_0_10px_rgba(34,211,238,0.1)]">
            🦈
          </div>
          <div>
            <h3 className="font-oswald font-bold leading-tight uppercase tracking-[0.2em] text-white">Shark AI System</h3>
            <p className="text-[9px] text-cyan-400 font-black tracking-widest uppercase">Encryption Active</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide bg-black/40">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed font-medium ${
              msg.role === 'user' 
                ? 'bg-cyan-600 text-white rounded-tr-none shadow-[0_4px_15px_rgba(8,145,178,0.2)]' 
                : 'bg-zinc-900 text-zinc-200 rounded-tl-none border border-zinc-800'
            }`}>
              {msg.content}
              
              {msg.links && msg.links.length > 0 && (
                <div className="mt-4 pt-3 border-t border-zinc-800 space-y-2">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Grounding Data</p>
                  {msg.links.map((link, idx) => (
                    <a 
                      key={idx} 
                      href={link.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block text-cyan-400 hover:text-cyan-300 transition-colors truncate italic"
                    >
                      > {link.title || link.uri}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-zinc-900 p-4 rounded-xl rounded-tl-none animate-pulse text-zinc-600 text-[10px] font-black uppercase tracking-widest">
              Processing...
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="p-4 bg-zinc-950 border-t border-zinc-800">
        <div className="flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="System input: Describe shot or request intel..."
            className="flex-1 bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-zinc-700"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="bg-cyan-500 hover:bg-cyan-400 disabled:bg-zinc-900 text-black w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-cyan-900/10"
          >
            🚀
          </button>
        </div>
      </div>
    </div>
  );
};

export default SharkAI;
