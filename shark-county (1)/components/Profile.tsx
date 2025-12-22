
import React from 'react';
import { PlayerProfile, GameType } from '../types';

interface ProfileProps {
  profile: PlayerProfile;
  setProfile: React.Dispatch<React.SetStateAction<PlayerProfile>>;
}

const Profile: React.FC<ProfileProps> = ({ profile, setProfile }) => {
  const toggleGame = (game: GameType) => {
    const updated = profile.preferredGames.includes(game)
      ? profile.preferredGames.filter(g => g !== game)
      : [...profile.preferredGames, game];
    setProfile({ ...profile, preferredGames: updated });
  };

  const togglePro = () => {
    setProfile({...profile, isPro: !profile.isPro});
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="text-center">
        <div className="relative inline-block group cursor-pointer">
          <img 
            src={`https://picsum.photos/seed/${profile.name}/200/200`} 
            alt="Profile" 
            className={`w-32 h-32 rounded-full border-4 shadow-2xl transition-transform group-hover:scale-105 grayscale ${profile.isPro ? 'border-cyan-400' : 'border-zinc-800'}`}
          />
          <div className="absolute bottom-0 right-0 bg-cyan-500 w-8 h-8 rounded-full flex items-center justify-center text-black border-4 border-black font-black text-xs">
            +
          </div>
        </div>
        <h2 className="text-3xl font-oswald font-bold mt-4 flex items-center justify-center gap-2 uppercase tracking-tighter">
          {profile.name}
          {profile.isPro && <span className="text-[10px] bg-cyan-400 text-black px-2 py-0.5 rounded font-black tracking-widest">PRO</span>}
        </h2>
        <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.3em]">Tier 1 Operator • Member since 2024</p>
      </div>

      <div className="glass p-8 rounded-3xl bg-zinc-950 border border-cyan-500/20">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <div>
            <h3 className="text-xl font-oswald font-bold text-white uppercase tracking-wider">Shark Pro Membership</h3>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">AI Overlays • Precision Tracking • Pro Status</p>
          </div>
          <button 
            onClick={togglePro}
            className={`w-full sm:w-auto px-8 py-3 rounded-full font-black text-xs transition-all uppercase tracking-widest ${
              profile.isPro 
                ? 'bg-zinc-800 text-zinc-400 hover:text-red-400' 
                : 'bg-cyan-500 text-black shadow-xl shadow-cyan-950/20'
            }`}
          >
            {profile.isPro ? 'Deactivate' : 'Upgrade $4.99'}
          </button>
        </div>
        {!profile.isPro && (
          <ul className="text-[10px] text-zinc-500 space-y-3 mt-4 grid grid-cols-1 sm:grid-cols-2 font-bold uppercase tracking-wider">
            <li className="flex items-center gap-2 text-cyan-400/80"><span className="text-cyan-400">✓</span> Real-time AI Tactician</li>
            <li className="flex items-center gap-2 text-cyan-400/80"><span className="text-cyan-400">✓</span> Precision Shot Logging</li>
            <li className="flex items-center gap-2 text-cyan-400/80"><span className="text-cyan-400">✓</span> Incognito Radar Mode</li>
            <li className="flex items-center gap-2 text-cyan-400/80"><span className="text-cyan-400">✓</span> Priority Match Listing</li>
          </ul>
        )}
      </div>

      <div className="glass p-8 rounded-3xl space-y-6 border border-zinc-900 bg-zinc-900/20">
        <div className="space-y-2">
          <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.4em]">Codename</label>
          <input 
            type="text" 
            value={profile.name}
            onChange={(e) => setProfile({...profile, name: e.target.value})}
            className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-xs font-bold focus:border-cyan-500 outline-none text-white tracking-wider"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.4em]">Fargo Level</label>
            <span className="text-cyan-400 font-black text-xs">{profile.skillLevel}/10</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="10" 
            step="1"
            value={profile.skillLevel}
            onChange={(e) => setProfile({...profile, skillLevel: parseInt(e.target.value)})}
            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        <div className="space-y-4">
          <label className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.4em]">Primary Disciplines</label>
          <div className="flex flex-wrap gap-2">
            {Object.values(GameType).map(game => (
              <button
                key={game}
                onClick={() => toggleGame(game)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all border uppercase tracking-widest ${
                  profile.preferredGames.includes(game) 
                    ? 'bg-cyan-500 border-cyan-500 text-black shadow-lg shadow-cyan-950/20' 
                    : 'bg-zinc-950 border-zinc-800 text-zinc-600 hover:border-zinc-600'
                }`}
              >
                {game}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-6 grid grid-cols-2 gap-4">
          <div className="bg-black p-4 rounded-2xl text-center border border-zinc-800">
            <p className="text-2xl font-oswald font-bold text-white">{profile.wins}</p>
            <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">VictorY</p>
          </div>
          <div className="bg-black p-4 rounded-2xl text-center border border-zinc-800">
            <p className="text-2xl font-oswald font-bold text-zinc-600">{profile.losses}</p>
            <p className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">Defeat</p>
          </div>
        </div>
      </div>
      
      <button className="w-full py-5 bg-zinc-100 hover:bg-white text-black rounded-3xl font-oswald font-bold text-xl transition-all shadow-2xl uppercase tracking-widest">
        Commit Profiles Changes
      </button>
    </div>
  );
};

export default Profile;
