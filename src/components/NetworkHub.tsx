/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Communities } from './Communities';
import { ProfessionalDirectory } from './ProfessionalDirectory';
import { useAuth } from '../context/AuthContext';
import { getTranslation } from '../lib/i18n';
import { Users2, UserPlus, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NetworkHubProps {
  onViewProfile?: (uid: string) => void;
}

export const NetworkHub: React.FC<NetworkHubProps> = ({ onViewProfile }) => {
  const { language } = useAuth();
  const t = getTranslation(language);
  const [activeSubTab, setActiveSubTab] = useState<'communities' | 'directory'>('communities');
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-1 sm:px-4">
      {/* Network Hub Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-krishx-dark-900 tracking-tight">
            कृषि नेटवर्क (Agri Network)
          </h2>
          <p className="text-[11px] font-semibold text-krishx-dark-700/60 uppercase tracking-[0.2em] mt-1">
            Connect • Learn • Grow together
          </p>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex p-1 bg-white/60 backdrop-blur-md rounded-2xl border border-krishx-earth-200/50 shadow-sm sm:w-[360px]">
          <button
            onClick={() => {
              setActiveSubTab('communities');
              setSearchQuery('');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-semibold tracking-wider transition-all duration-300 ${
              activeSubTab === 'communities'
                ? 'bg-krishx-dark-900 text-white shadow-md'
                : 'text-krishx-dark-700/60 hover:text-krishx-dark-900 hover:bg-krishx-earth-50'
            }`}
          >
            <Users2 className="w-4 h-4" strokeWidth={activeSubTab === 'communities' ? 2 : 1.5} />
            Communities
          </button>
          <button
            onClick={() => {
              setActiveSubTab('directory');
              setSearchQuery('');
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[11px] font-semibold tracking-wider transition-all duration-300 ${
              activeSubTab === 'directory'
                ? 'bg-krishx-dark-900 text-white shadow-md'
                : 'text-krishx-dark-700/60 hover:text-krishx-dark-900 hover:bg-krishx-earth-50'
            }`}
          >
            <UserPlus className="w-4 h-4" strokeWidth={activeSubTab === 'directory' ? 2 : 1.5} />
            Professionals
          </button>
        </div>
      </div>

      {/* Unified Search Bar */}
      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-krishx-dark-700/40 group-focus-within:text-krishx-green-600 transition-colors" strokeWidth={1.5} />
        <input 
          type="text"
          placeholder={
            activeSubTab === 'communities'
              ? "Search communities, topics, farming types (e.g. wheat, dairy)..."
              : "Search professionals, experts, organizations, students, farmers..."
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-14 pr-4 py-4 bg-white border border-krishx-earth-200/50 rounded-2xl text-[14px] font-medium focus:outline-none focus:ring-1 focus:ring-krishx-green-400 focus:border-krishx-green-400 transition-all shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] text-krishx-dark-900 placeholder:text-krishx-dark-700/40"
        />
      </div>

      {/* Content Area */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
        >
          {activeSubTab === 'communities' && (
            <Communities searchQuery={searchQuery} />
          )}
          {activeSubTab === 'directory' && (
            <ProfessionalDirectory searchQuery={searchQuery} onViewProfile={onViewProfile} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

