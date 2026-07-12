/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, getDocs, limit } from '../lib/firebase';
import { UserProfile, Post, Community } from '../types';
import { useAuth } from '../context/AuthContext';
import { getTranslation } from '../lib/i18n';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search as SearchIcon, 
  Filter, 
  ChevronRight, 
  Sprout,
  TrendingUp,
  Newspaper,
  BookOpen,
  ArrowRight
} from 'lucide-react';

export const Discover: React.FC = () => {
  const { language } = useAuth();
  const t = getTranslation(language);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'news' | 'science' | 'people'>('all');
  const [loading, setLoading] = useState(false);

  return (
    <div className="space-y-8">
      {/* Header & Search */}
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-krishx-dark-900 tracking-tight">
            {t.discover.title}
          </h2>
          <p className="text-[11px] font-semibold text-krishx-dark-700/60 uppercase tracking-[0.2em] mt-1">
            Knowledge • Innovation • Trends
          </p>
        </div>

        <div className="relative group">
          <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-krishx-dark-700/40 group-focus-within:text-krishx-green-600 transition-colors" strokeWidth={1.5} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.discover.searchPlaceholder}
            className="w-full pl-14 pr-4 py-4 bg-white border border-krishx-earth-200/50 rounded-2xl text-[14px] font-medium focus:outline-none focus:ring-1 focus:ring-krishx-green-400 focus:border-krishx-green-400 transition-all shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] text-krishx-dark-900 placeholder:text-krishx-dark-700/40"
          />
        </div>
      </div>

      {/* Trending Agriculture Topics */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-bold text-krishx-dark-700/60 uppercase tracking-widest">
            {t.discover.trending}
          </h3>
          <button className="text-[11px] font-bold text-krishx-green-700 uppercase tracking-wider flex items-center gap-1 hover:text-krishx-green-800 transition-colors">
            View Analysis <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {[
            { tag: 'Hydroponics', trend: '+240%', icon: '💧' },
            { tag: 'Organic Wheat', trend: '+18%', icon: '🌾' },
            { tag: 'Drones', trend: '+156%', icon: '🚁' },
            { tag: 'Micro-Irrigation', trend: '+42%', icon: '🌦️' }
          ].map((item, idx) => (
            <div 
              key={idx}
              className="shrink-0 premium-card p-5 flex flex-col gap-3 min-w-[150px] hover:scale-105 transition-transform duration-300 cursor-pointer"
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="text-[13px] font-bold text-krishx-dark-900">{item.tag}</span>
              <span className="text-[11px] font-semibold text-krishx-green-600">{item.trend} increase</span>
            </div>
          ))}
        </div>
      </div>

      {/* Discover Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Agriculture News */}
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-krishx-earth-50 border border-krishx-earth-200/50 rounded-xl">
              <Newspaper className="w-5 h-5 text-krishx-dark-700" />
            </span>
            <h4 className="text-[13px] font-bold text-krishx-dark-900 uppercase tracking-[0.2em]">
              {t.discover.sections.news}
            </h4>
          </div>

          <div className="space-y-4">
            {[
              { title: 'New MSP rates announced for Rabi season', time: '2 hours ago', source: 'AgriNews' },
              { title: 'Scientists develop flood-resistant rice variety', time: '5 hours ago', source: 'ICAR Research' },
              { title: 'Digital agriculture mission gets ₹500Cr boost', time: '1 day ago', source: 'Govt Updates' }
            ].map((news, idx) => (
              <div key={idx} className="premium-card p-5 hover:-translate-y-1 cursor-pointer transition-all duration-300">
                <p className="text-[14px] font-bold text-krishx-dark-900 mb-3 leading-snug">{news.title}</p>
                <div className="flex justify-between items-center text-[11px] font-semibold text-krishx-dark-700/60 uppercase tracking-wider">
                  <span>{news.source}</span>
                  <span>{news.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scientific Insights */}
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-krishx-earth-50 border border-krishx-earth-200/50 rounded-xl">
              <BookOpen className="w-5 h-5 text-krishx-dark-700" />
            </span>
            <h4 className="text-[13px] font-bold text-krishx-dark-900 uppercase tracking-[0.2em]">
              {t.discover.sections.science}
            </h4>
          </div>

          <div className="space-y-4">
            {[
              { title: 'Nano-Urea application guidelines 2024', author: 'Dr. S. Sharma', type: 'Guidelines' },
              { title: 'Impact of climate change on cereal crops', author: 'Nature Agri', type: 'Research' },
              { title: 'Integrated Pest Management for Sugarcane', author: 'Expert Panel', type: 'Case Study' }
            ].map((item, idx) => (
              <div key={idx} className="premium-card bg-krishx-earth-50/50 p-5 hover:-translate-y-1 cursor-pointer transition-all duration-300">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-krishx-green-700 bg-white px-2 py-1 rounded-md border border-krishx-earth-200/80 uppercase tracking-widest">{item.type}</span>
                </div>
                <p className="text-[14px] font-bold text-krishx-dark-900 mb-2 leading-snug">{item.title}</p>
                <p className="text-[11px] font-semibold text-krishx-dark-700/60 uppercase tracking-wider">By {item.author}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
export default Discover;
