/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getTranslation } from '../lib/i18n';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home, 
  Bot, 
  Search, 
  Users2, 
  User as UserIcon, 
  LogOut, 
  Sprout,
  Menu,
  X,
  Bell,
  Settings,
  ShieldCheck,
  Award
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { userProfile, logout, language, switchLanguage } = useAuth();
  const t = getTranslation(language);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    { id: 'home', label: t.nav.home, icon: Home },
    { id: 'network', label: t.nav.network, icon: Users2 },
    { id: 'ai', label: t.nav.ai, icon: Bot, highlight: true },
    { id: 'profile', label: t.nav.profile, icon: UserIcon },
  ];

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className={`bg-premium-gradient relative text-krishx-dark-800 flex flex-col font-sans selection:bg-krishx-green-200 pb-16 md:pb-0 md:pl-72 ${activeTab === 'ai' ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      
      {/* Visual Depth Overlay */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Abstract organic pattern (2-4% opacity) */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-multiply" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%2315803D' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")` }} />
        
        {/* Blurred radial light spots */}
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-krishx-green-200/30 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 -left-20 w-72 h-72 bg-krishx-earth-200/50 rounded-full blur-[80px]" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-krishx-green-100/40 rounded-full blur-[100px]" />

        {/* Floating organic blobs */}
        <div className="absolute top-1/4 right-1/3 w-[30rem] h-[30rem] bg-krishx-green-300/10 rounded-full blur-[120px] mix-blend-multiply animate-blob" />
        <div className="absolute top-1/3 left-1/4 w-[25rem] h-[25rem] bg-amber-100/20 rounded-full blur-[100px] mix-blend-multiply animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/3 w-[35rem] h-[35rem] bg-krishx-green-200/10 rounded-full blur-[120px] mix-blend-multiply animate-blob animation-delay-4000" />
      </div>

      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col fixed top-0 left-0 bottom-0 w-72 bg-gradient-to-b from-white/90 to-krishx-green-50/80 backdrop-blur-2xl border-r border-krishx-earth-200/50 p-6 z-40 shadow-[var(--shadow-premium-soft)]">
        <div className="flex-1 space-y-10">
          {/* Logo */}
          <div className="flex items-center gap-4 px-2">
            <div className="p-3 bg-gradient-to-br from-krishx-green-500 to-krishx-green-700 rounded-2xl text-white shadow-[0_8px_16px_-6px_rgba(22,163,74,0.4)]">
              <Sprout className="w-7 h-7" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-3xl font-display font-bold tracking-tight text-krishx-dark-900 leading-none">
                Krish<span className="text-krishx-green-600">X</span>
              </h1>
              <p className="text-[10px] font-semibold text-krishx-dark-700/60 uppercase tracking-[0.25em] mt-1.5">
                {t.slogan}
              </p>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id)}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[13px] font-semibold tracking-wide transition-all duration-300 group ${
                    isActive 
                      ? 'bg-krishx-green-50 text-krishx-green-700 shadow-sm border border-krishx-green-100' 
                      : 'text-krishx-dark-700/60 hover:bg-krishx-earth-50 hover:text-krishx-dark-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-krishx-green-600' : 'text-krishx-dark-700/40'}`} strokeWidth={isActive ? 2 : 1.5} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Sidebar Actions */}
        <div className="space-y-4 pt-5 border-t border-krishx-earth-200/40">
          <div className="flex flex-col gap-1.5 px-2">
            <p className="text-[10px] font-black text-krishx-dark-700/40 uppercase tracking-widest">Interface Language</p>
            <div className="flex gap-1 p-1 bg-krishx-earth-50/50 rounded-xl border border-krishx-earth-200/40">
              {(['hi', 'en'] as const).map((lang) => (
                <button
                  key={lang}
                  onClick={() => switchLanguage(lang)}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all duration-300 cursor-pointer ${
                    language === lang 
                      ? 'bg-white text-krishx-green-800 shadow-sm border border-krishx-earth-200/40' 
                      : 'text-krishx-dark-700/50 hover:text-krishx-dark-800'
                  }`}
                >
                  {lang === 'hi' ? 'हिन्दी' : 'English'}
                </button>
              ))}
            </div>
          </div>

          {userProfile && (
            <div className="mx-2 p-3 bg-white/80 border border-krishx-earth-200/45 rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] space-y-2.5">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <img 
                  src={userProfile.photoURL || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=100'} 
                  alt={userProfile.name} 
                  className="w-10 h-10 rounded-xl object-cover shrink-0 ring-2 ring-krishx-green-100"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-extrabold text-krishx-dark-900 truncate leading-none">{userProfile.name}</p>
                    <span className="w-1.5 h-1.5 rounded-full bg-krishx-green-550 shrink-0 inline-block animate-pulse" title="Logged in" />
                  </div>
                  <p className="text-[10px] text-krishx-dark-700/55 truncate font-medium mt-0.5" title={userProfile.email || `${userProfile.krishXId}@krishx.org`}>
                    {userProfile.email || `${userProfile.krishXId}@krishx.org`}
                  </p>
                  <span className="inline-flex items-center text-[8px] font-black tracking-widest text-krishx-green-700 bg-krishx-green-50 px-1.5 py-0.5 rounded-md mt-1 uppercase font-mono">
                    {userProfile.krishXId}
                  </span>
                </div>
              </div>
              
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-[11px] font-bold transition-all tracking-wide cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" strokeWidth={2} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Header for Mobile */}
      <header className="md:hidden sticky top-0 bg-white/80 backdrop-blur-xl border-b border-krishx-earth-200/50 px-4 py-3 flex items-center justify-between z-40 shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 hover:bg-krishx-earth-50 rounded-xl text-krishx-dark-800 transition-colors"
          >
            <Menu className="w-6 h-6" strokeWidth={1.5} />
          </button>
          <div className="flex items-center gap-2">
            <Sprout className="w-5 h-5 text-krishx-green-600" strokeWidth={1.5} />
            <h1 className="text-xl font-display font-bold text-krishx-dark-900 tracking-tight">Krish<span className="text-krishx-green-600">X</span></h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 text-krishx-dark-700/60 hover:text-krishx-dark-900 transition-colors"><Search className="w-5 h-5" strokeWidth={1.5} /></button>
          <button className="p-2 text-krishx-dark-700/60 hover:text-krishx-dark-900 transition-colors"><Bell className="w-5 h-5" strokeWidth={1.5} /></button>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-krishx-dark-900/40 backdrop-blur-sm z-50 md:hidden"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-4/5 max-w-xs bg-white z-50 md:hidden p-6 flex flex-col"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <Sprout className="w-6 h-6 text-krishx-green-600" />
                  <span className="text-xl font-display font-bold tracking-tight text-krishx-dark-900">Krish<span className="text-krishx-green-600">X</span></span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2"><X className="w-6 h-6" /></button>
              </div>

              {userProfile && (
                <div className="mb-8 p-5 bg-krishx-dark-900 text-white rounded-[1.25rem] space-y-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <img src={userProfile.photoURL} className="w-12 h-12 rounded-xl object-cover ring-2 ring-krishx-green-500/30" />
                    <div>
                      <p className="text-sm font-bold tracking-tight">{userProfile.name}</p>
                      <p className="text-[10px] font-medium text-krishx-green-400 font-mono mt-0.5">{userProfile.krishXId}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="text-center flex-1">
                      <p className="text-[8px] font-bold text-krishx-green-400 uppercase tracking-widest">Score</p>
                      <p className="text-sm font-bold mt-0.5">{userProfile.krishScore}</p>
                    </div>
                    <div className="w-px h-6 bg-white/10" />
                    <div className="text-center flex-1">
                      <p className="text-[8px] font-bold text-krishx-green-400 uppercase tracking-widest">Badge</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest mt-1">{userProfile.badges?.[0] || 'Member'}</p>
                    </div>
                  </div>
                </div>
              )}

              <nav className="flex-1 space-y-1">
                {navigationItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors ${
                      activeTab === item.id ? 'bg-krishx-earth-50 text-krishx-dark-900 border border-krishx-earth-200/50' : 'text-krishx-dark-700/60 hover:bg-krishx-earth-50/50'
                    }`}
                  >
                    <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-krishx-green-600' : 'text-krishx-dark-700/40'}`} strokeWidth={1.5} />
                    {item.label}
                  </button>
                ))}
              </nav>

              {/* Mobile Language Selector */}
              <div className="mt-auto pt-4 border-t border-krishx-earth-200/30 space-y-2 mb-4">
                <p className="text-[10px] font-black text-krishx-dark-700/40 uppercase tracking-widest">Interface Language</p>
                <div className="flex gap-1 p-1 bg-krishx-earth-50 rounded-xl border border-krishx-earth-200/40">
                  {(['hi', 'en'] as const).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => switchLanguage(lang)}
                      className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all duration-300 ${
                        language === lang 
                          ? 'bg-white text-krishx-green-800 shadow-sm border border-krishx-earth-200/40' 
                          : 'text-krishx-dark-700/50'
                      }`}
                    >
                      {lang === 'hi' ? 'हिन्दी' : 'English'}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={logout}
                className="w-full flex items-center justify-center gap-3 py-3.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer"
              >
                <LogOut className="w-5 h-5" />
                Logout Account
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className={`relative z-10 flex-1 w-full max-w-7xl mx-auto px-4 ${activeTab === 'ai' ? 'min-h-0 flex flex-col py-2 md:py-6' : 'py-6 md:py-10'}`}>
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-krishx-earth-200/50 flex items-center justify-around py-2 px-2 z-40 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.05)]">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`flex flex-col items-center justify-center relative cursor-pointer flex-1 py-1`}
            >
              <div className={`p-1.5 rounded-xl transition-colors duration-300 ${
                isActive ? 'text-krishx-green-600' : 'text-krishx-dark-700/40'
              }`}>
                <Icon className={`w-6 h-6 ${isActive ? 'stroke-2' : 'stroke-[1.5px]'}`} />
              </div>
              <span className={`text-[9px] mt-1 tracking-wide transition-all ${
                isActive ? 'text-krishx-green-700 font-semibold' : 'text-krishx-dark-700/40 font-medium'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
export default Layout;
