
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import MatchFinder from './components/MatchFinder';
import Profile from './components/Profile';
import SharkAI from './components/SharkAI';
import LiveSession from './components/LiveSession';
import { PlayerProfile, GameType } from './types';

const INITIAL_PROFILE: PlayerProfile = {
  id: 'current-user',
  name: 'Shark Player',
  skillLevel: 5,
  preferredGames: [GameType.EIGHT_BALL, GameType.NINE_BALL],
  wins: 12,
  losses: 4,
  isPro: false,
};

const App: React.FC = () => {
  const [profile, setProfile] = useState<PlayerProfile>(INITIAL_PROFILE);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Geolocation error:", error);
        }
      );
    }
  }, []);

  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-black text-zinc-100 pb-20 md:pb-0">
        <Navbar />
        
        <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
          <Routes>
            <Route path="/" element={<Dashboard profile={profile} location={userLocation} />} />
            <Route path="/find" element={<MatchFinder profile={profile} location={userLocation} />} />
            <Route path="/profile" element={<Profile profile={profile} setProfile={setProfile} />} />
            <Route path="/ai" element={<SharkAI profile={profile} location={userLocation} />} />
            <Route path="/live" element={<LiveSession profile={profile} />} />
          </Routes>
        </main>

        {/* Mobile Navigation Dock */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-zinc-800 flex justify-around py-3 z-50">
          <NavIcon to="/" icon="🏠" label="Home" />
          <NavIcon to="/find" icon="🎯" label="Find" />
          <NavIcon to="/live" icon="🎥" label="Live" />
          <NavIcon to="/ai" icon="🦈" label="AI" />
          <NavIcon to="/profile" icon="👤" label="Me" />
        </nav>
      </div>
    </Router>
  );
};

const NavIcon: React.FC<{ to: string; icon: string; label: string }> = ({ to, icon, label }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to} className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-cyan-400' : 'text-zinc-500'}`}>
      <span className="text-xl">{icon}</span>
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </Link>
  );
};

export default App;
