
import React, { useState } from 'react';
import { PlayerProfile } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  profile: PlayerProfile;
  location: { lat: number; lng: number } | null;
}

const DATA = [
  { name: 'Mon', wins: 2 },
  { name: 'Tue', wins: 3 },
  { name: 'Wed', wins: 1 },
  { name: 'Thu', wins: 5 },
  { name: 'Fri', wins: 4 },
  { name: 'Sat', wins: 8 },
  { name: 'Sun', wins: 6 },
];

const Dashboard: React.FC<DashboardProps> = ({ profile, location }) => {
  const [shareStatus, setShareStatus] = useState<'idle' | 'copied'>('idle');

  const handleShare = () => {
    // In a real app, this would be a deep link or a referral URL
    const shareUrl = `${window.location.origin}/#/profile?ref=${profile.id || 'shark'}`;
    navigator.clipboard.writeText(shareUrl);
    setShareStatus('copied');
    setTimeout(() => setShareStatus('idle'), 2000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 glass p-6 rounded-2xl relative overflow-hidden group border-l-4 border-cyan-500">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <span className="text-9xl">🎱</span>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-3xl font-oswald font-bold uppercase tracking-tight">Player: {profile.name}</h2>
            {profile.isPro && <span className="bg-cyan-500 text-black text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">PRO SHARK</span>}
          </div>
          <p className="text-zinc-500 mb-6 font-medium font-oswald uppercase tracking-widest text-xs">Global Ranking: Top 15% in your region.</p>
          
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Wins" value={profile.wins} color="text-zinc-100" />
            <StatCard label="Losses" value={profile.losses} color="text-zinc-500" />
            <StatCard label="Win Rate" value={`${Math.round((profile.wins / (profile.wins + profile.losses)) * 100)}%`} color="text-cyan-400" />
          </div>
        </div>

        <div className="glass p-6 rounded-2xl bg-zinc-950/50 border-zinc-800 flex flex-col justify-between">
          <div>
            <h3 className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] mb-2">Recruit Your Crew</h3>
            <p className="text-xs text-zinc-400 mb-4 font-medium leading-relaxed">Grow the County. Invite players to claim their free Shark Profile and start tracking matches.</p>
          </div>
          <button 
            onClick={handleShare}
            className={`w-full py-3 rounded-xl text-xs font-black transition-all border uppercase tracking-widest flex items-center justify-center gap-2 ${
              shareStatus === 'copied' ? 'bg-cyan-500 text-black border-cyan-500' : 'bg-zinc-900 text-white border-zinc-800 hover:border-cyan-500/50'
            }`}
          >
            {shareStatus === 'copied' ? 'COPIED TO CLIPBOARD' : 'SHARE INVITE LINK'}
            <span>{shareStatus === 'copied' ? '✓' : '🔗'}</span>
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass p-6 rounded-2xl border border-zinc-800">
          <h3 className="text-xl font-oswald font-bold mb-6 text-white uppercase tracking-wider">Performance Trend</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={DATA}>
                <defs>
                  <linearGradient id="colorWins" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                <XAxis dataKey="name" stroke="#52525b" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                <YAxis stroke="#52525b" fontSize={10} fontWeight="bold" tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', fontSize: '12px' }}
                  itemStyle={{ color: '#22d3ee' }}
                />
                <Area type="monotone" dataKey="wins" stroke="#22d3ee" strokeWidth={3} fillOpacity={1} fill="url(#colorWins)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass p-6 rounded-2xl border border-zinc-800">
          <h3 className="text-xl font-oswald font-bold mb-6 text-white uppercase tracking-wider">Partner Spotlight</h3>
          <div className="space-y-3">
            <div className="w-full h-32 bg-zinc-900 rounded-xl overflow-hidden relative border border-zinc-800">
              <img src="https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover opacity-30 grayscale" alt="Pool Hall" />
              <div className="absolute inset-0 p-3 flex flex-col justify-end bg-gradient-to-t from-black to-transparent">
                <p className="font-bold text-sm">Main Street Billiards</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Verified Partner • 2.1mi</p>
              </div>
            </div>
            <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800 flex justify-between items-center">
               <p className="text-xs text-zinc-400 italic">"Shark Pro members get 20% off table time today!"</p>
               <button className="text-[10px] font-black text-cyan-400 uppercase tracking-widest hover:text-cyan-300">CLAIM</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string | number; color: string }> = ({ label, value, color }) => (
  <div className="bg-zinc-900/40 p-4 rounded-xl border border-zinc-800">
    <p className="text-zinc-600 text-[9px] font-black uppercase tracking-[0.2em] mb-1">{label}</p>
    <p className={`text-2xl font-oswald font-bold ${color}`}>{value}</p>
  </div>
);

export default Dashboard;
