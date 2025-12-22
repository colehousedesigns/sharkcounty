
import React, { useState, useEffect } from 'react';
import { PlayerProfile, MatchEvent, GameType } from '../types';
import { getNearbyPoolHalls } from '../services/geminiService';

interface MatchFinderProps {
  profile: PlayerProfile;
  location: { lat: number; lng: number } | null;
}

const MOCK_EVENTS: MatchEvent[] = [
  {
    id: 'e1',
    title: 'Amateur 8-Ball Shootout',
    type: 'Tournament',
    distance: 1.2,
    locationName: 'The Break Room',
    startTime: 'Tonight, 7:00 PM',
    gameType: GameType.EIGHT_BALL,
    organizer: 'Shark County Official',
    description: 'Double elimination. $20 entry fee. House adds $100.'
  },
  {
    id: 'e2',
    title: 'Match: Looking for 9-Ball Partner',
    type: 'Match',
    distance: 0.8,
    locationName: 'Tavern On The Green',
    startTime: 'Tomorrow, 6:00 PM',
    gameType: GameType.NINE_BALL,
    organizer: 'Player_Ace',
    description: 'Casual games. Just looking to practice and meet new players.'
  }
];

const MatchFinder: React.FC<MatchFinderProps> = ({ profile, location }) => {
  const [radius, setRadius] = useState(10);
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<MatchEvent[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);

  const handleScan = async () => {
    if (!location) return;
    setScanning(true);
    setResults([]);
    
    setTimeout(async () => {
      setResults(MOCK_EVENTS.filter(e => e.distance <= radius));
      try {
        const halls = await getNearbyPoolHalls(location.lat, location.lng, radius);
        setAiSuggestions(halls || []);
      } catch (e) {
        console.error("AI Search Error:", e);
      }
      setScanning(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="glass p-8 rounded-3xl text-center space-y-6 relative overflow-hidden border border-zinc-800">
        {scanning && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-10 backdrop-blur-sm">
            <div className="relative w-48 h-48">
              <div className="absolute inset-0 border-4 border-cyan-500/10 rounded-full scale-110 animate-ping"></div>
              <div className="absolute inset-0 border-2 border-cyan-500 rounded-full animate-spin border-t-transparent shadow-[0_0_15px_rgba(34,211,238,0.5)]"></div>
              <div className="absolute inset-0 flex items-center justify-center font-oswald font-bold text-cyan-400 tracking-[0.2em] text-xs">
                RADAR SCANNING
              </div>
            </div>
          </div>
        )}

        <h2 className="text-4xl font-oswald font-bold tracking-tighter uppercase text-white italic">Scan Your Territory</h2>
        <p className="text-zinc-500 max-w-xl mx-auto text-sm font-medium">
          Detecting sharks and tables within {radius} miles of your GPS.
        </p>

        <div className="max-w-md mx-auto space-y-4">
          <input 
            type="range" 
            min="1" 
            max="50" 
            value={radius} 
            onChange={(e) => setRadius(parseInt(e.target.value))}
            className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <div className="flex justify-between text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">
            <span>1 MILE</span>
            <span className="text-cyan-400 text-lg font-oswald">{radius} MILES</span>
            <span>50 MILES</span>
          </div>
          
          <button 
            onClick={handleScan}
            disabled={scanning || !location}
            className={`w-full py-4 rounded-2xl font-oswald font-bold text-xl transition-all shadow-xl tracking-widest ${
              !location ? 'bg-zinc-900 text-zinc-700 cursor-not-allowed' : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-cyan-950/20 hover:scale-[1.01]'
            }`}
          >
            {location ? 'INITIATE RADAR' : 'GPS LOCKED'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-sm font-black text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></span>
            Detected Matches
          </h3>
          {results.length > 0 ? (
            results.map(event => (
              <div key={event.id} className="glass p-5 rounded-2xl hover:border-cyan-500/30 transition-all group cursor-pointer border border-zinc-800">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider mb-2 inline-block ${event.type === 'Tournament' ? 'bg-zinc-100 text-black' : 'bg-cyan-500/20 text-cyan-400'}`}>
                      {event.type}
                    </span>
                    <h4 className="text-lg font-bold group-hover:text-cyan-400 transition-colors text-white">{event.title}</h4>
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-tight">{event.locationName} • {event.distance}mi</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-cyan-400 uppercase tracking-tighter">{event.startTime}</p>
                    <p className="text-[10px] text-zinc-600 font-bold uppercase">{event.gameType}</p>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{event.description}</p>
                <div className="mt-4 pt-4 border-t border-zinc-900 flex justify-between items-center">
                  <span className="text-[10px] text-zinc-600 font-bold uppercase">Org: {event.organizer}</span>
                  <button className="bg-zinc-800 hover:bg-zinc-700 px-4 py-1.5 rounded-lg text-[10px] font-black transition-colors uppercase tracking-widest text-white">
                    Register
                  </button>
                </div>
              </div>
            ))
          ) : !scanning && (
            <div className="p-12 text-center text-zinc-700 glass rounded-3xl border-dashed border-2 border-zinc-900 uppercase font-black tracking-widest text-xs">
              No sharks in the vicinity.
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-black text-zinc-500 uppercase tracking-[0.3em] flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full"></span>
            Verified Venues
          </h3>
          <div className="space-y-3">
            {aiSuggestions.length > 0 ? (
              aiSuggestions.map((hall, idx) => (
                <a 
                  key={idx} 
                  href={hall.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="block glass p-4 rounded-xl hover:bg-zinc-900 transition-colors border-l-2 border-zinc-700 hover:border-cyan-500"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-white text-sm tracking-tight">{hall.title}</h4>
                      <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Global Maps Intel</p>
                    </div>
                    <span className="text-zinc-700 group-hover:text-cyan-400 transition-colors">🔗</span>
                  </div>
                </a>
              ))
            ) : (
              <div className="p-8 text-center text-zinc-700 glass rounded-3xl italic text-xs uppercase font-black tracking-widest border border-zinc-900">
                Awaiting scan telemetry...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchFinder;
