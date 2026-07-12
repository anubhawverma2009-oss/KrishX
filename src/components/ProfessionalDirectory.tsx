/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  MapPin, 
  Award, 
  Building2, 
  GraduationCap, 
  Sprout, 
  UserCheck, 
  TrendingUp,
  MessageCircle,
  UserPlus,
  ArrowUpRight,
  Check
} from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, query, onSnapshot } from '../lib/firebase';

interface Professional {
  id: string;
  name: string;
  role: 'Expert' | 'Organization' | 'Student' | 'Farmer';
  specialty: string;
  location: string;
  photoURL: string;
  krishScore: number;
  verified: boolean;
  tagline: string;
  isReal?: boolean;
}

interface ProfessionalDirectoryProps {
  searchQuery?: string;
  onViewProfile?: (uid: string) => void;
}

const MOCK_PROFESSIONALS: Professional[] = [
  {
    id: 'dr-ramesh',
    name: 'Dr. Ramesh Kumar',
    role: 'Expert',
    specialty: 'Soil Science & Nutrition Specialist',
    location: 'Ludhiana, Punjab',
    photoURL: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100',
    krishScore: 890,
    verified: true,
    tagline: 'Passionate about sustainable soil health and nutrient management. Ex-PAU Scientist.'
  },
  {
    id: 'ecofarm-org',
    name: 'EcoFarm Solutions',
    role: 'Organization',
    specialty: 'Ag-Tech / Precision Irrigation',
    location: 'Bangalore, Karnataka',
    photoURL: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&q=80&w=100',
    krishScore: 940,
    verified: true,
    tagline: 'Leading the way in AI-driven micro-irrigation and weather intelligence for Indian farmers.'
  },
  {
    id: 'suhani-stu',
    name: 'Suhani Singh',
    role: 'Student',
    specialty: 'Agricultural Biotechnology Research',
    location: 'Varanasi, Uttar Pradesh',
    photoURL: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100',
    krishScore: 450,
    verified: false,
    tagline: 'M.Sc Student at BHU. Deeply researching climate-resilient organic wheat varieties.'
  },
  {
    id: 'balwinder-fm',
    name: 'Balwinder Singh',
    role: 'Farmer',
    specialty: 'Organic Wheat & Mustard Specialist',
    location: 'Bhatinda, Punjab',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100',
    krishScore: 720,
    verified: true,
    tagline: '15 years of experience in chemical-free organic farming, vermicomposting and seed saving.'
  },
  {
    id: 'agripulse-org',
    name: 'Agri-Pulse Innovations',
    role: 'Organization',
    specialty: 'Post-Harvest Logistics & Storage',
    location: 'Pune, Maharashtra',
    photoURL: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=100',
    krishScore: 810,
    verified: true,
    tagline: 'Providing modular low-cost solar cold storage solutions for smallholder farmer groups.'
  }
];

export const ProfessionalDirectory: React.FC<ProfessionalDirectoryProps> = ({ 
  searchQuery = '', 
  onViewProfile 
}) => {
  const [filter, setFilter] = useState<'All' | 'Expert' | 'Organization' | 'Farmer' | 'Student'>('All');
  const [realUsers, setRealUsers] = useState<Professional[]>([]);
  
  // Connections and notification states
  const [connectedIds, setConnectedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('krishx_connected_professionals');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [toastText, setToastText] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerToast = (msg: string) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastText(msg);
    toastTimeoutRef.current = setTimeout(() => setToastText(null), 3000);
  };

  // 1. Fetch real registered users from Firestore to merge with mocks
  useEffect(() => {
    const qUsers = query(collection(db, 'users'));
    const unsubscribe = onSnapshot(qUsers, (snapshot) => {
      try {
        const list = snapshot.docs.map(doc => {
          const data = doc.data() || {};
          const badges = data.badges || [];
          let calculatedRole: 'Expert' | 'Organization' | 'Student' | 'Farmer' = 'Farmer';
          if (badges.includes('expert')) calculatedRole = 'Expert';
          else if (data.education?.toLowerCase().includes('university') || data.education?.toLowerCase().includes('student')) calculatedRole = 'Student';
          
          return {
            id: doc.id,
            name: data.name || 'Anonymous Farmer',
            role: calculatedRole,
            specialty: data.education || (data.crops && data.crops.join(', ')) || 'कृषि विशेषज्ञ',
            location: data.location || 'India',
            photoURL: data.photoURL || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&q=80&w=100',
            krishScore: data.krishScore || 210,
            verified: badges.includes('expert') || badges.includes('pioneer') || false,
            tagline: data.summary || 'Professional agriculturist on KrishX professional network.',
            isReal: true
          } as Professional;
        });
        
        // Remove duplicate of the current user if they are already mocked (or just filter list)
        setRealUsers(list);
      } catch (err) {
        console.warn('Could not read users from firestore, directory fallback activated:', err);
      }
    });
    return unsubscribe;
  }, []);

  // Merge mocks and real users
  const mergedProfessionals = [
    ...realUsers,
    ...MOCK_PROFESSIONALS.filter(mock => !realUsers.some(real => real.name.toLowerCase() === mock.name.toLowerCase()))
  ];

  // Perform filtering & searching
  const filtered = mergedProfessionals.filter(p => {
    const matchesFilter = filter === 'All' || p.role === filter;
    
    const s = searchQuery.toLowerCase();
    const matchesSearch = p.name.toLowerCase().includes(s) || 
                          p.specialty.toLowerCase().includes(s) ||
                          p.location.toLowerCase().includes(s) ||
                          p.tagline.toLowerCase().includes(s) ||
                          p.role.toLowerCase().includes(s);

    return matchesFilter && matchesSearch;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'Expert': return <Award className="w-3.5 h-3.5" />;
      case 'Organization': return <Building2 className="w-3.5 h-3.5" />;
      case 'Student': return <GraduationCap className="w-3.5 h-3.5" />;
      case 'Farmer': return <Sprout className="w-3.5 h-3.5" />;
      default: return <Users className="w-3.5 h-3.5" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Expert': return 'bg-amber-50 text-amber-700 border-amber-100/50';
      case 'Organization': return 'bg-blue-50 text-blue-700 border-blue-100/50';
      case 'Student': return 'bg-purple-50 text-purple-700 border-purple-100/50';
      case 'Farmer': return 'bg-krishx-green-50 text-krishx-green-700 border-krishx-green-100/50';
      default: return 'bg-krishx-earth-50 text-krishx-dark-700 border-krishx-earth-100/50';
    }
  };

  const handleConnectToggle = (id: string, name: string) => {
    let updated;
    if (connectedIds.includes(id)) {
      updated = connectedIds.filter(x => x !== id);
      triggerToast(`Removed connection with ${name}`);
    } else {
      updated = [...connectedIds, id];
      triggerToast(`Connection request sent to ${name}!`);
    }
    setConnectedIds(updated);
    localStorage.setItem('krishx_connected_professionals', JSON.stringify(updated));
  };

  return (
    <div className="space-y-6">
      
      {/* Toast Alert */}
      <AnimatePresence>
        {toastText && (
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 bg-krishx-dark-900 text-white border border-krishx-dark-800 text-[11px] font-bold uppercase tracking-[0.2em] py-3.5 px-6 rounded-2xl z-50 shadow-2xl flex items-center gap-3"
          >
            <div className="w-2 h-2 bg-krishx-green-400 rounded-full animate-ping" />
            <span>{toastText}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Role Filter Pills */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-krishx-earth-200/50">
        {(['All', 'Expert', 'Organization', 'Farmer', 'Student'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.15em] transition-all ${
              filter === f 
                ? 'bg-krishx-dark-900 text-white shadow-md shadow-krishx-dark-900/10' 
                : 'bg-krishx-earth-50 text-krishx-dark-700/80 hover:text-krishx-dark-900 hover:bg-krishx-earth-100/80 border border-krishx-earth-200/50'
            }`}
          >
            {f === 'All' ? 'All Roles' : `${f}s`}
          </button>
        ))}
      </div>

      {/* Directory Cards Grid - Smaller, Cleaner, Elegant Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filtered.map((prof) => {
            const isConnected = connectedIds.includes(prof.id);
            return (
              <motion.div
                key={prof.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="premium-card p-6 shadow-sm hover:shadow-xl hover:shadow-krishx-dark-900/5 hover:border-krishx-earth-300 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Compact Header Profile Row */}
                  <div className="flex gap-4 items-start">
                    
                    {/* Avatar with verified check */}
                    <div 
                      className="relative shrink-0 cursor-pointer"
                      onClick={() => onViewProfile?.(prof.id)}
                    >
                      <img 
                        src={prof.photoURL} 
                        className="w-16 h-16 rounded-[1.25rem] object-cover border-2 border-krishx-earth-50 shadow-inner group-hover:scale-105 transition-transform duration-300" 
                        alt={prof.name}
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-krishx-green-500 rounded-full border-2 border-white" />
                    </div>

                    {/* Meta info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[9px] font-bold uppercase tracking-widest ${getRoleColor(prof.role)}`}>
                          {getRoleIcon(prof.role)}
                          {prof.role}
                        </span>
                        
                        <span className="text-[10px] font-bold text-krishx-dark-700/80 bg-krishx-earth-50 px-2 py-1 rounded-lg border border-krishx-earth-200/50 flex items-center gap-1 shrink-0">
                          <TrendingUp className="w-3 h-3 text-krishx-green-600" strokeWidth={1.5} />
                          {prof.krishScore}
                        </span>
                      </div>

                      <h3 
                        onClick={() => onViewProfile?.(prof.id)}
                        className="text-[16px] font-display font-bold text-krishx-dark-900 mt-2 hover:text-krishx-green-700 cursor-pointer truncate flex items-center gap-1.5 transition-colors"
                      >
                        <span>{prof.name}</span>
                        {prof.verified && (
                          <UserCheck className="w-4 h-4 text-krishx-green-600 shrink-0 inline" strokeWidth={1.5} />
                        )}
                      </h3>

                      <p className="text-[10px] font-bold text-krishx-green-700 uppercase tracking-widest truncate mt-0.5">
                        {prof.specialty}
                      </p>
                    </div>
                  </div>

                  {/* Tagline / Bio - Cleaner & spacing balanced */}
                  <div className="mt-5">
                    <p className="text-[13px] text-krishx-dark-700/90 font-medium leading-relaxed line-clamp-2">
                      "{prof.tagline}"
                    </p>
                  </div>
                </div>

                {/* Bottom Stats & Actions */}
                <div className="mt-6 pt-4 border-t border-krishx-earth-200/50 flex items-center justify-between">
                  
                  {/* Location indicator */}
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-krishx-dark-700/60 truncate max-w-[130px]">
                    <MapPin className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                    <span className="truncate">{prof.location}</span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-2">
                    {/* View Profile Action button */}
                    <button 
                      onClick={() => onViewProfile?.(prof.id)}
                      className="p-3 bg-krishx-earth-50 text-krishx-dark-900 rounded-xl hover:bg-krishx-earth-100 hover:text-krishx-green-700 transition-colors border border-krishx-earth-200/50"
                      title="View Public Profile"
                    >
                      <ArrowUpRight className="w-4 h-4" strokeWidth={1.5} />
                    </button>

                    {/* Toggle Connection button */}
                    <button 
                      onClick={() => handleConnectToggle(prof.id, prof.name)}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                        isConnected
                          ? 'bg-krishx-earth-50 text-krishx-dark-900 border border-krishx-earth-200 hover:bg-krishx-earth-100/80'
                          : 'bg-krishx-dark-900 text-white hover:bg-krishx-dark-800 shadow-sm shadow-krishx-dark-900/10'
                      }`}
                    >
                      {isConnected ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-krishx-green-600" strokeWidth={2} />
                          <span>Connected</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" strokeWidth={1.5} />
                          <span>Connect</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-24 premium-card shadow-sm">
          <p className="text-[12px] font-bold text-krishx-dark-700/60 uppercase tracking-[0.2em]">
            No professionals found matching your search.
          </p>
        </div>
      )}
    </div>
  );
};
